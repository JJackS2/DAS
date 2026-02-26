#!/usr/bin/env bash
# Advanced Treemap 품질 테스트 실행 스크립트
# 사용법: ./scripts/run-treemap-quality-tests.sh
# 요구: Node.js, npm

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "DAS 프로젝트 루트: $ROOT"

if ! command -v npm &>/dev/null; then
  echo "오류: npm을 찾을 수 없습니다. Node.js를 설치하세요."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "의존성 설치 중..."
  npm install
fi

if [ ! -d "node_modules/@playwright/test/node_modules/playwright-core/.local-browsers" ]; then
  echo "Playwright Chromium 설치 중..."
  npm run install:browsers
fi

echo "Treemap 품질 테스트 실행 중..."
npm run test:treemap-quality
