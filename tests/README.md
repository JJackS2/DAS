# 테스트 환경 구축 및 자동 수행

## 요구사항

- Node.js 18+
- npm

## 1. 테스트 환경 구축

```bash
# 프로젝트 루트에서
cd c:\workspace\DAS

# 의존성 설치
npm install

# Playwright Chromium 브라우저 설치 (최초 1회)
npm run install:browsers
```

## 2. 테스트 자동 수행

### Treemap 품질 테스트 (권장)

**서버 자동 기동**  
로컬 서버가 없으면 Playwright가 `dashboard_demo`를 포트 3000에서 띄운 뒤 테스트를 실행합니다.

```bash
npm run test:treemap-quality
```

- 실행 시 `npx serve dashboard_demo -l 3000`으로 서버가 자동 기동됩니다.
- 이미 3000 포트에서 서버가 떠 있으면 재사용합니다 (`reuseExistingServer`).
- 결과는 `reports/treemap/treemap_quality_report.json`, `treemap_quality_report.md`에 저장됩니다.

### CI에서 실행

```bash
npm run test:treemap-quality:ci
```

- `CI=1`로 실행되며, 기존 서버를 재사용하지 않고 매번 새로 띄웁니다.
- 실패 시 1회 재시도합니다.

### 수동으로 서버 띄우고 테스트

```bash
# 터미널 1: 대시보드 서버
npm run serve

# 터미널 2: 테스트 (서버 사용)
npm run test:treemap-quality
```

### 다른 URL에서 테스트

이미 다른 포트/URL에서 대시보드를 서비스 중이면:

```bash
# Windows (PowerShell)
$env:TREEMAP_BASE_URL="http://localhost:5000"; npm run test:treemap-quality

# Windows (CMD)
set TREEMAP_BASE_URL=http://localhost:5000 && npm run test:treemap-quality
```

서버 자동 기동은 하지 않고, 해당 URL로만 접속해 테스트합니다.

## 3. 산출물

| 경로 | 설명 |
|------|------|
| `reports/treemap/treemap_quality_report.json` | 케이스별 품질 지표·acceptance JSON |
| `reports/treemap/treemap_quality_report.md` | 동일 내용 마크다운 테이블 |
| `test-results/` | Playwright 실행 결과 (실패 시 스크린샷 등) |

## 4. 스크립트 요약

| 스크립트 | 설명 |
|----------|------|
| `npm run test:treemap-quality` | Treemap 품질 테스트 (서버 자동 기동) |
| `npm run test:treemap-quality:ci` | CI용 Treemap 품질 테스트 |
| `npm run test` | 전체 Playwright 테스트 |
| `npm run serve` | 대시보드만 포트 3000에서 서비스 |
| `npm run install:browsers` | Chromium 브라우저 설치 |

## 5. 트러블슈팅

- **포트 3000 사용 중**  
  다른 앱이 3000을 쓰고 있으면 `TREEMAP_BASE_URL`로 다른 주소를 지정하거나, `npm run serve`로 원하는 포트를 지정한 뒤 해당 URL로 테스트하세요.

- **브라우저 설치 실패**  
  `npm run install:browsers`를 다시 실행하거나, [Playwright 설치 가이드](https://playwright.dev/docs/installation)를 참고하세요.

- **file:// 로 테스트**  
  가능하면 `http://127.0.0.1:3000` 같은 서버 URL 사용을 권장합니다. file URL은 브라우저 정책으로 스크립트가 막힐 수 있습니다.
