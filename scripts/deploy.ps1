# METALINK CMS 원클릭 배포 스크립트
# 사용법: PowerShell에서 프로젝트 루트(metalink_CMS)로 이동 후
#   ./scripts/deploy.ps1
#
# 서버 비밀번호는 $env:WONJU_DEPLOY_PW 에서 읽음. 없으면 프롬프트로 물음.
# 핵심: node_modules / .next 는 서버에서 빌드. DB/uploads 는 절대 덮어쓰지 않음.

$ErrorActionPreference = 'Stop'

$ServerHost = 'root@172.235.202.109'
$RemoteApp  = '/var/www/MetaCMS/app'
$RemoteTmp  = '/tmp/metacms-deploy'
$HostKey    = 'SHA256:igNJWcC/dhkOLw0RFzQWOwseBXRVq0l2DaU+eIUjG8Y'  # 서버 ssh-ed25519 호스트 키 핀 (batch 모드용)

# 1. 비밀번호 준비
$pw = $env:WONJU_DEPLOY_PW
if (-not $pw) {
  $sec = Read-Host 'Server password' -AsSecureString
  $pw = [System.Net.NetworkCredential]::new('', $sec).Password
}

# 2. 로컬에서 프리빌드로 빠르게 오류 탐지 (실패 시 배포 중단)
Write-Host '==> Local build check' -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) { throw 'Local build failed' }

# 3. 소스만 zip (node_modules, .next, *.db, uploads, *.log, .env* 제외)
Write-Host '==> Packaging source' -ForegroundColor Cyan
$zip = Join-Path $PSScriptRoot '..\deploy-src.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$includeNames = @('src','public','docs','scripts','package.json','package-lock.json',
                  'next.config.mjs','postcss.config.mjs','tailwind.config.mjs',
                  'jsconfig.json','eslint.config.mjs','server.js')
$items = $includeNames |
  Where-Object { Test-Path (Join-Path $root $_) } |
  ForEach-Object { Join-Path $root $_ }

Compress-Archive -Path $items -DestinationPath $zip -CompressionLevel Optimal -Force

# 4. 업로드
Write-Host '==> Uploading' -ForegroundColor Cyan
& pscp -hostkey $HostKey -pw $pw -batch $zip "${ServerHost}:/tmp/deploy.zip"
if ($LASTEXITCODE -ne 0) { throw 'Upload failed' }

# 5. 원격 배포: 서버 측 스크립트 단일 호출 (멀티라인 here-string CRLF 문제 회피)
#    remote-deploy.sh 가 unzip -> rsync -> build -> standalone copy -> restart -> health check 수행
Write-Host '==> Remote deploy (server-side remote-deploy.sh)' -ForegroundColor Cyan
& plink -batch -hostkey $HostKey -pw $pw $ServerHost "bash $RemoteApp/scripts/remote-deploy.sh"
if ($LASTEXITCODE -ne 0) { throw 'Remote deploy failed' }

Write-Host '==> Deploy complete' -ForegroundColor Green
