# Advanced Treemap 품질 테스트 실행 스크립트
# 사용법: .\scripts\run-treemap-quality-tests.ps1
# 요구: Node.js, npm (PATH에 등록)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
Set-Location $root

Write-Host "DAS 프로젝트 루트: $root" -ForegroundColor Cyan

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "오류: npm을 찾을 수 없습니다. Node.js를 설치하고 PATH에 추가하세요." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "의존성 설치 중..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$chromiumPath = "node_modules\@playwright\test\node_modules\playwright-core\\.local-browsers"
if (-not (Test-Path $chromiumPath)) {
    Write-Host "Playwright Chromium 설치 중..." -ForegroundColor Yellow
    npm run install:browsers
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Treemap 품질 테스트 실행 중..." -ForegroundColor Green
npm run test:treemap-quality
exit $LASTEXITCODE
