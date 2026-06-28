#!/bin/bash
# 서버 측 배포 스크립트 — /tmp/deploy.zip 을 받아 운영 앱으로 동기화
# - DB / uploads / .env 는 절대 덮어쓰지 않음
# - .next는 매번 clean rebuild (standalone/public 충돌·구 chunk 잔존 방지)
set -e

RemoteApp=/var/www/MetaCMS/app
RemoteTmp=/tmp/metacms-deploy

echo "==> 1) Unzip"
rm -rf "$RemoteTmp"
mkdir -p "$RemoteTmp"
unzip -qo /tmp/deploy.zip -d "$RemoteTmp" 2>&1 | tail -3 || true

echo "==> 2) Rsync (DB / uploads / .env 제외, 삭제 파일 반영)"
rsync -a --delete \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'wonjudental.db' \
  --exclude '*.db' \
  --exclude '*.db-journal' \
  --exclude 'uploads/' \
  --exclude '.env*' \
  --exclude 'public/uploads/' \
  "$RemoteTmp"/ "$RemoteApp"/

cd "$RemoteApp"

echo "==> 3) Clean .next (standalone 충돌·구 chunk 잔존 방지)"
rm -rf .next

echo "==> 4) npm install"
npm install --no-audit --no-fund 2>&1 | tail -3

echo "==> 5) npm run build"
npm run build 2>&1 | tail -5

echo "==> 6) standalone copy (public, static, DB symlink)"
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
if [ ! -L .next/standalone/wonjudental.db ]; then
  rm -f .next/standalone/wonjudental.db
  ln -s ../../wonjudental.db .next/standalone/wonjudental.db
fi

echo "==> 7) Restart service"
systemctl restart MetaCMS
sleep 3
systemctl is-active MetaCMS

echo "==> 8) Health check"
curl -sf -o /dev/null -w 'admin=%{http_code}\n' https://metalink3.mycafe24.com/admin
