#!/usr/bin/env bash
# METALINK CMS — MCP(OAuth) 서버 원격 설치/갱신 스크립트
# 서버에서 실행. /tmp/mcp-deploy.zip 의 mcp/ 를 /var/www/metalink-mcp 로 배치하고
# systemd 서비스 metalink-mcp + nginx mcp.metacms.kr 를 구성한다.
set -euo pipefail

APP_DIR=/var/www/metalink-mcp
SERVICE=metalink-mcp
DOMAIN=mcp.metacms.kr
PORT=3030
# 이 스크립트가 위치한 디렉터리 = 배포 소스
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Node 버전 확인"
node -v
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "!! Node $NODE_MAJOR — node:sqlite 는 Node 22+ 필요. 중단."
  exit 1
fi
node -e "require('node:sqlite');console.log('node:sqlite OK')"

echo "==> 파일 배치 (소스: $SRC)"
mkdir -p "$APP_DIR"
# 코드만 갱신 (DB·node_modules 보존)
cp -f "$SRC"/server.mjs "$SRC"/oauth.mjs "$SRC"/package.json "$SRC"/README.md "$APP_DIR"/

echo "==> 의존성 설치"
cd "$APP_DIR"
npm install --omit=dev --no-audit --no-fund

echo "==> systemd 서비스 작성"
cat > /etc/systemd/system/$SERVICE.service <<UNIT
[Unit]
Description=METALINK CMS MCP (OAuth, Streamable HTTP)
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=MCP_PORT=$PORT
Environment=MCP_PUBLIC_URL=https://$DOMAIN
Environment=PLATFORM_URL=https://metacms.kr
Environment=MCP_DB=$APP_DIR/mcp-oauth.db
Environment=NODE_OPTIONS=--no-warnings
ExecStart=/usr/bin/env node server.mjs
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable $SERVICE >/dev/null 2>&1 || true
systemctl restart $SERVICE
sleep 1
systemctl --no-pager --full status $SERVICE | head -8 || true

echo "==> nginx 서버 블록 작성"
# 와일드카드 인증서 경로 자동 탐지 (metacms.kr 또는 metacms.kr-NNNN)
CERT_DIR=""
for d in /etc/letsencrypt/live/metacms.kr-0001 /etc/letsencrypt/live/metacms.kr /etc/letsencrypt/live/*metacms.kr*; do
  if [ -f "$d/fullchain.pem" ] && openssl x509 -in "$d/fullchain.pem" -noout -text 2>/dev/null | grep -q "\*.metacms.kr"; then
    CERT_DIR="$d"; break
  fi
done
if [ -z "$CERT_DIR" ]; then
  echo "!! 와일드카드(*.metacms.kr) 인증서를 찾지 못함. 후보:"
  ls -d /etc/letsencrypt/live/*/ 2>/dev/null || true
  exit 1
fi
echo "   인증서: $CERT_DIR"

cat > /etc/nginx/sites-available/$DOMAIN <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate     $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;

    # MCP Streamable HTTP (SSE 스트리밍 대응)
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        chunked_transfer_encoding on;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t
systemctl reload nginx

echo "==> 로컬 헬스체크"
curl -s http://127.0.0.1:$PORT/health || true
echo ""
echo "==> 공개 디스커버리 검증"
curl -s https://$DOMAIN/.well-known/oauth-authorization-server | head -c 300 || true
echo ""
curl -s https://$DOMAIN/.well-known/oauth-protected-resource/mcp || true
echo ""
echo "==> 완료. 커넥터 URL: https://$DOMAIN/mcp"