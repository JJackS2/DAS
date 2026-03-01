# 모듈 수준 상세 설명

프로젝트 내 **각 모듈(패키지/디렉터리)**의 역할, 입출력, 의존성, 주요 파일을 정리합니다. 아키텍처 개요는 [ARCHITECTURE.md](ARCHITECTURE.md)를 참조합니다.

---

## 1. 루트 (DAS)

| 항목 | 내용 |
|------|------|
| **역할** | 스크립트·워크스페이스·테스트 러너·문서 인덱스 제공. |
| **주요 파일** | `package.json`(test, test:treemap-quality, build:dashboard, serve, build-and-test), `DAS.code-workspace`, `AGENTS.md`. |
| **의존성** | finviz-like-treemap/web(빌드), finviz-like-treemap/server(데이터 API, 선택), Playwright. |
| **입력** | 없음(진입점). |
| **출력** | `npm run build:dashboard` → web/dist; `npm run test*` → test-results, reports/treemap/. |

---

## 2. finviz-like-treemap/web (React 프론트엔드)

| 항목 | 내용 |
|------|------|
| **역할** | BI 트리맵 대시보드 UI. 데이터 fetch, state 관리, 트리 생성, ECharts 트리맵 렌더, 컨트롤·헤더·Others 패널. |
| **기술** | React 18, Vite 5, ECharts 5, ES modules (JS/JSX). |
| **의존성** | api.js → Data API(8787); buildTree → 없음(순수 함수); TreemapChart → ECharts, buildTree, RegionBarStrip. |

### 2.1 디렉터리·파일

| 경로 | 역할 | 입출력 요약 |
|------|------|-------------|
| **src/App.jsx** | 진입 컴포넌트. state(dateKey, axis, path, sizeMetric, colorMetric, topN), fetchData, onChartEvent, HeaderBar/Controls/TreemapChart/OthersPanel. | props 없음. state → buildTreemapChildren; rows → computeGlobalTotals. |
| **src/api.js** | Data API 호출. | `fetchData(dateKey?)` → Promise<{ meta, dateKey, rows }>. |
| **src/main.jsx** | React 렌더 진입. | ReactDOM.createRoot, App. |
| **src/treemap/buildTree.js** | 행 데이터 → 2레벨 트리 데이터. | (rows, state) → buildTreemapChildren → { treeData, isLeaf, othersItems }. keysForAxis, getKeyAt, rowMatchesPath, aggInit, recomputeRates, TopN/Others. |
| **src/treemap/TreemapChart.jsx** | ECharts 트리맵 래퍼. options 생성, visualMap, levels, getLeafLayouts, resize/notMerge. | props: treeData, state, isLeaf, onChartEvent, regionSummaries. __TREEMAP_DEBUG__.getLeafLayouts() → { x,y,w,h }[]. |
| **src/ui/HeaderBar.jsx** | 상단 글로벌 요약·날짜 표시. | props: globalTotals, dateKey, availableDates, onDateChange 등. |
| **src/ui/Controls.jsx** | Axis/Size/Color/TopN/Back, Breadcrumb. | props: state, meta, onChange*. data-testid: axis-geo, axis-product 등. |
| **src/ui/RegionBarStrip.jsx** | path.length===0일 때 지역별 막대·요약값. | props: regionSummaries, sizeMetric. |
| **src/ui/OthersPanel.jsx** | Others 클릭 시 리스트·드릴. | props: open, items, onClose, onSelect. |

### 2.2 데이터 계약 (요약)

- **state**: `{ dateKey, axis, path, sizeMetric, colorMetric, topN }`. path: 문자열 배열.
- **트리 노드**: name, value, metrics, colorValue, tooltipHtml, displayLabel, pathToNode, isDrillable, children(선택).
- **displayLabel**: "이름 메트릭값"(공백 1개). 리프 2줄: 이름 + 줄바꿈 + 메트릭값.

---

## 3. finviz-like-treemap/server (Data API)

| 항목 | 내용 |
|------|------|
| **역할** | GET /data, /subsidiaries, /health. 정적 JSON(dummy.json, byDate) 기반. |
| **기술** | Express, Node ES modules. |
| **의존성** | fs, path; routes에서 data 파일 읽기. |

### 3.1 파일

| 경로 | 역할 | 입출력 요약 |
|------|------|-------------|
| **src/index.js** | Express 앱 생성, cors·json 미들웨어, registerRoutes, listen(8787). | - |
| **src/routes.js** | GET /health, /subsidiaries, /data. readData()→dummy.json, readSubsidiaries()→dim_subsidiary.json. | /data?dateKey= → { meta, dateKey, rows }. |
| **src/data/dummy.json** | byDate[dateKey] = rows[], meta.availableDates, meta.metrics, defaultSize, defaultColor, topNDefault. | - |
| **src/data/dim_subsidiary.json** | (선택) 법인 코드·이름. | - |

### 3.2 API 계약

- **GET /data?dateKey=YYYY-MM**  
  응답: `{ meta: { availableDates, metrics, defaultSize, defaultColor, topNDefault }, dateKey, rows }`.  
  row: region, subsidiary, division, product_l2, product_l3, sales, wifi_sales, connected 등.

---

## 4. finviz-like-treemap/docs (명세·규칙)

| 항목 | 내용 |
|------|------|
| **역할** | 계층별 명세, 개발·테스트 규칙, 논문 참고 문헌. |
| **주요 파일** | 00_SPECIFICATION_LAYERED.md, DEVELOPMENT_RULES.md, TEST_RULES.md, REFERENCES_TREEMAP_LITERATURE.md, README.md. |
| **의존성** | 없음(문서). 코드·테스트가 이 문서를 따름. |

---

## 5. tests/treemap (E2E)

| 항목 | 내용 |
|------|------|
| **역할** | Playwright E2E. 품질 러너(axis×size×color 조합), 헤더 레이아웃, 대시보드 티어 평가. |
| **기술** | @playwright/test, TypeScript, Chromium. |
| **의존성** | baseURL 3000(또는 TREEMAP_BASE_URL). 품질 테스트 시 getLeafLayouts() 계약; 데이터 API(8787) 권장. |

### 5.1 파일

| 경로 | 역할 | 입출력 요약 |
|------|------|-------------|
| **quality_runner.spec.ts** | axis×size×color 조합 순회, 각 조합에서 트리맵 렌더 대기 후 getLeafLayouts() 수집, quality_metrics로 지표·acceptance 계산, 리포트 저장. | reports/treemap/treemap_quality_report.json, .md. |
| **quality_metrics.ts** | LeafLayout[], computeQualityFromLayouts → QualityMetrics; getAcceptance → GOAL/SOFT/HARD/FAIL; getFailReason, getRecommendedAction. | - |
| **quality_report.ts** | (선택) 리포트 생성 유틸. | - |
| **treemap-header-layout.spec.ts** | 헤더 오버플로우, 폰트 9px 이상, 컨트롤·Preset 한 줄 등. | - |
| **dashboard_tier_evaluation.spec.ts** | 색상 범례, 오버플로우, 우측 패널, roam, 품질 배지 등. | - |

### 5.2 앱 계약 (테스트가 가정)

- id: main-dashboard, treemap-container; data-testid: dashboard, treemap-container, axis-geo, axis-product.
- window.__TREEMAP_DEBUG__.getLeafLayouts() → { x, y, w, h }[].

---

## 6. docs (프로젝트 문서)

| 항목 | 내용 |
|------|------|
| **역할** | Cursor 적합성, 아키텍처, 모듈 설명, 평가 방법, 프로젝트 가이드. |
| **주요 파일** | ARCHITECTURE.md, MODULES.md(본 문서), CURSOR_EFFICIENCY_GUIDE.md, CURSOR_SUITABILITY_EVALUATION.md, CURSOR_FIT_ASSESSMENT.md, PROJECT_GUIDE.md. |

---

## 7. .cursor (Cursor 설정)

| 항목 | 내용 |
|------|------|
| **역할** | 규칙·스킬·명령·README. 에이전트가 프로젝트 규칙과 워크플로를 참조. |
| **구조** | rules/*.mdc(3), skills/*/SKILL.md(6), commands/*.md(3), README.md. |

모듈 간 호출·데이터 형식은 [ARCHITECTURE.md](ARCHITECTURE.md) §2–4와 [00_SPECIFICATION_LAYERED.md](../finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md) §3·§4를 함께 참조하세요.
