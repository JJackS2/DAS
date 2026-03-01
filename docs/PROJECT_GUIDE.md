# DAS 프로젝트 개발·테스트 가이드

본 문서는 **조사된 Cursor 효율 항목**에 따라 리팩터링한 뒤의 프로젝트 사용법을 정리한 가이드입니다. 효과적인 개발·구현·테스트 절차와, **리팩터링 전후 비교**를 구체적으로 담습니다.

**한눈에 보는 변경 요약**

| 전 | 후 |
|----|-----|
| 단일 루트 또는 폴더별로만 열기 | **DAS.code-workspace** 로 멀티루트 한 번에 열기 |
| 슬래시 명령 없음 | **.cursor/commands/** 3종 (테스트·빌드·규칙 동기화) |
| 빌드와 테스트 각각 실행 | **npm run build-and-test** 로 일원화 |
| Cursor 인덱싱 제외 설정 없음 | **search.exclude**(워크스페이스) + **.cursorignore** 권장 템플릿 |
| Cursor 설정 문서에 명령·워크스페이스 없음 | **.cursor/README.md** 에 명령 표·워크스페이스·본 가이드 링크 |

---

## 1. 목적 및 대상

| 항목 | 내용 |
|------|------|
| **목적** | 프로젝트를 효과적으로 개발·구현·테스트하기 위해, Cursor 효율 가이드의 항목에 맞춰 리팩터링하고 사용법을 문서화함. |
| **대상** | DAS 저장소 전체(루트, finviz-like-treemap/web·server·docs, tests/treemap, docs). |
| **참조** | [docs/CURSOR_EFFICIENCY_GUIDE.md](CURSOR_EFFICIENCY_GUIDE.md) — 카테고리별 100+ 항목. |

---

## 2. 리팩터링 전후 비교 (구체적)

### 2.1 추가·변경된 항목

| 구분 | 리팩터링 전 | 리팩터링 후 | 근거(가이드 항목) |
|------|-------------|-------------|-------------------|
| **워크스페이스** | 단일 루트만 열기 또는 폴더별로 따로 열기 | **DAS.code-workspace** 로 멀티루트(루트, web, server, treemap docs, tests, docs) 한 번에 열기 | §2.7 Multi-Root Workspace, §2.8 |
| **슬래시 명령** | 없음 | **.cursor/commands/** 에 3개: `run-treemap-quality`, `build-and-test-dashboard`, `review-and-sync-rules` | §9.75–83 슬래시 명령·반복 워크플로 |
| **빌드·테스트 일원화** | `build:dashboard` 와 `test:treemap-quality` 를 각각 수동 실행 | 루트 **`npm run build-and-test`** 로 빌드 후 품질 테스트 한 번에 실행 | §13.101 TDD·검증 플로우, 워크플로 일원화 |
| **인덱싱 제외** | .cursorignore 없음; Cursor가 node_modules·dist 등까지 인덱싱 가능 | **.cursorignore** 는 작성 권장(아래 템플릿). **DAS.code-workspace** 의 `search.exclude` 로 검색 제외 설정 | §5.36–38, §2.9 search.exclude |
| **Cursor 설정 문서** | .cursor/README.md(규칙·스킬만) | **슬래시 명령 표**, **워크스페이스 설명**, **PROJECT_GUIDE 링크** 추가 | §3.17 규칙에서 스킬·워크플로 명시 |

### 2.2 파일·경로 수준 비교

| 항목 | 전 | 후 |
|------|----|----|
| **루트 package.json scripts** | `test`, `test:treemap-quality`, `build:dashboard`, `serve`, … | 동일 + **`build-and-test`** 추가 |
| **.cursor/** | rules(3), skills(6), README | rules(3), skills(6), **commands/(3개 .md)**, README(명령·워크스페이스 섹션 추가) |
| **루트** | package.json, .gitignore 등 | **DAS.code-workspace** 추가 |
| **docs/** | CURSOR_EFFICIENCY_GUIDE.md | + **PROJECT_GUIDE.md** (본 문서) |

### 2.3 .cursorignore (권장 — 수동 추가)

리팩터링 시 루트에 `.cursorignore` 를 자동 생성하지 못했을 수 있으므로, 아래 내용을 **프로젝트 루트에 수동으로 추가**하는 것을 권장합니다. (Cursor 효율 가이드 §5 인덱싱·성능)

```gitignore
node_modules/
**/node_modules/
**/dist/
**/build/
**/coverage/
test-results/
playwright-report/
reports/
**/package-lock.json
**/pnpm-lock.yaml
**/yarn.lock
**/.env
**/.env.*
```

---

## 3. 효과적인 개발·구현·테스트 방법

### 3.1 일상 개발 플로우

1. **워크스페이스로 열기**: `cursor DAS.code-workspace` (또는 Cursor에서 File → Open Workspace from File → DAS.code-workspace).
2. **코드 수정**: `finviz-like-treemap/web` 또는 `finviz-like-treemap/server` 에서 작업. 열린 파일에 따라 **finviz-treemap-development** 규칙이 적용됨.
3. **로컬 확인**:  
   - 웹: `cd finviz-like-treemap/web && npm run dev`  
   - 데이터 API: `cd finviz-like-treemap/server && npm run start` (8787)  
   - 정적 서빙: 루트에서 `npm run build:dashboard` 후 `npm run serve` (3000).
4. **테스트**: 루트에서 `npm run build-and-test` 또는 `npm run test:treemap-quality`. 품질 지표가 의미 있으려면 데이터 API(8787) 기동 권장.

### 3.2 테스트만 빠르게 실행

- **품질 테스트**: `npm run test:treemap-quality`  
  - 서버 미기동 시 자동으로 빌드 후 3000에서 서빙 후 테스트.
- **전체 Playwright**: `npm run test`
- **CI 스타일**: `npm run test:treemap-quality:ci`

### 3.3 Cursor 에이전트 활용

- **Plan Mode (Shift+Tab)**: 다단계 기능 추가·리팩터 전에 계획 수립 후 승인하고 실행.
- **슬래시 명령**: 채팅에서 `/` → `run-treemap-quality`, `build-and-test-dashboard`, `review-and-sync-rules` 중 선택해 빌드·테스트·규칙 동기화 지시.
- **규칙·스킬**: 명세·문서는 `finviz-like-treemap/docs/` 열고 작업 시 **das-dashboard-spec-and-skills** 규칙의 스킬 표 참조; 테스트는 `tests/treemap/` 작업 시 **finviz-treemap-testing** 규칙 참조.

### 3.4 변경 후 규칙·문서 동기화

- **앱 계약 변경**(id, data-testid, __TREEMAP_DEBUG__ 등): `finviz-like-treemap/docs/DEVELOPMENT_RULES.md` §5, `finviz-like-treemap/docs/TEST_RULES.md` §4·§5 수정.
- **테스트 선택자·품질 기준 변경**: TEST_RULES 반영 후 DEVELOPMENT_RULES와 일치 여부 확인.
- 슬래시 명령 **review-and-sync-rules** 로 “변경 사항 검토 → 규칙·문서 동기화 → 테스트 재실행”을 에이전트에 맡길 수 있음.

---

## 4. 변경된 프로젝트에 대한 가이드 (요약)

### 4.1 디렉터리·문서 맵

| 경로 | 역할 |
|------|------|
| **루트** | package.json(스크립트: test, build:dashboard, serve, **build-and-test** 등), DAS.code-workspace |
| **.cursor/rules/** | 파일 패턴별 규칙(명세·개발·테스트), 규칙에서 사용할 스킬 명시 |
| **.cursor/skills/** | 대시보드 명세·요구사항·차원·기법·논문 등 세분화 스킬 + 오케스트레이션 스킬 |
| **.cursor/commands/** | run-treemap-quality, build-and-test-dashboard, review-and-sync-rules |
| **.cursor/README.md** | 규칙·스킬·명령·워크스페이스 요약, CURSOR_EFFICIENCY_GUIDE·PROJECT_GUIDE 링크 |
| **finviz-like-treemap/** | web(React+Vite+ECharts), server(Express 8787), docs(명세·DEVELOPMENT_RULES·TEST_RULES) |
| **tests/treemap/** | Playwright E2E(quality_runner, treemap-header-layout, dashboard_tier_evaluation 등) |
| **docs/** | CURSOR_EFFICIENCY_GUIDE.md, **PROJECT_GUIDE.md**(본 문서) |

### 4.2 주요 명령어 (루트 기준)

| 명령 | 설명 |
|------|------|
| `npm run build-and-test` | 대시보드 빌드 후 품질 테스트 일괄 실행 (리팩터링으로 추가) |
| `npm run build:dashboard` | finviz-like-treemap/web 빌드 |
| `npm run test:treemap-quality` | 트리맵 품질 E2E (서버 없으면 자동 기동) |
| `npm run test` | 전체 Playwright 테스트 |
| `npm run serve` | web/dist 를 3000에서 서빙 (사전 build:dashboard 필요) |
| `npm run test:treemap-quality:ci` | CI용 품질 테스트 |

### 4.3 워크스페이스 사용

- **열기**: `cursor DAS.code-workspace` 또는 Cursor UI에서 해당 파일 열기.
- **효과**: 에이전트가 루트·Dashboard·Data API·Treemap docs·E2E tests·Project docs를 한 세션에서 참조·편집 가능.
- **검색**: 워크스페이스 `settings.search.exclude` 로 node_modules·dist·build·coverage·test-results·reports·lock 파일 제외.

### 4.4 슬래시 명령 사용

- 채팅 입력창에서 `/` 입력 → 표시되는 명령 중 선택.
- **run-treemap-quality**: 품질 테스트 실행 및 결과 요약.
- **build-and-test-dashboard**: 빌드 후 테스트 전체 플로우 실행.
- **review-and-sync-rules**: 변경 사항 기준으로 규칙·문서 동기화 후 테스트 실행.

---

## 5. 참고 문서

- [CURSOR_EFFICIENCY_GUIDE.md](CURSOR_EFFICIENCY_GUIDE.md) — Cursor 사용 효율 100+ 항목 (카테고리별).
- [ARCHITECTURE.md](ARCHITECTURE.md) — 프로젝트 전체 아키텍처·데이터 흐름·핵심 알고리즘.
- [MODULES.md](MODULES.md) — 모듈 수준 상세(web/server/treemap/tests) 역할·입출력·의존성.
- [CURSOR_SUITABILITY_EVALUATION.md](CURSOR_SUITABILITY_EVALUATION.md) — Cursor 적합성 평가 방법·기준·점수.
- [CURSOR_SUITABILITY_SCORE.md](CURSOR_SUITABILITY_SCORE.md) — 최신 평가 점수·등급·개선 권장.
- [.cursor/README.md](../.cursor/README.md) — 규칙·스킬·명령·워크스페이스 인덱스.
- [tests/README.md](../tests/README.md) — 테스트 환경 구축·자동 수행.
- [finviz-like-treemap/docs/README.md](../finviz-like-treemap/docs/README.md) — 대시보드 문서 인덱스.
- [finviz-like-treemap/docs/DEVELOPMENT_RULES.md](../finviz-like-treemap/docs/DEVELOPMENT_RULES.md), [TEST_RULES.md](../finviz-like-treemap/docs/TEST_RULES.md) — 개발·테스트 계약.

이 가이드는 리팩터링 이후의 프로젝트 상태를 기준으로 하며, 이후 스크립트·규칙·명령이 바뀌면 본 문서를 갱신하는 것을 권장합니다.
