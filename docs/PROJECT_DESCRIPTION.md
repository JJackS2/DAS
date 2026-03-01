# DAS 프로젝트 설명 (상위 → 상세)

이 문서는 **프로젝트가 무엇인지**를 상위 레벨에서부터 점차 상세한 레벨까지 서술합니다.

---

## 1. 상위: 이 저장소는 무엇인가

이 저장소는 **DAS**라는 이름의 프로젝트입니다. **비즈니스 인텔리전스(BI)용 시각화 대시보드**를 제공하며, 그 핵심은 **finviz-like-treemap**이라는 **트리맵 대시보드**입니다.  
위치(지역)·제품·시간·매출·탑재율·연결률 같은 **다차원 데이터**를 **트리맵**으로 한 화면에 보여 주고, 지역→법인 또는 제품군→제품처럼 **드릴다운**하면서 규모와 비율을 비교할 수 있게 합니다.  
데이터는 **Express API(포트 8787)**에서 받고, 화면은 **React + Vite + ECharts**로 구현하며, **Playwright**로 E2E·품질 테스트를 실행합니다.  
또 **계층별 명세**, **개발·테스트 규칙**, **Cursor용 규칙·스킬·평가**를 문서로 갖춰, “이 프로젝트가 무엇인지”와 “어떻게 개발·테스트·평가할지”를 한곳에서 따라갈 수 있게 되어 있습니다.  
한 줄로 말하면, **다차원 비즈니스 데이터를 트리맵으로 탐색하는 BI 대시보드 프로젝트**입니다.

---

## 2. 제품 레벨: 대시보드가 하는 일

- **역할**: BI용 단일 트리맵 뷰. 한 화면에 하나의 트리맵만 표시하고, **2레벨**(상위 1레벨 + 리프 1레벨)로 고정합니다.
- **축**: **Geo**(지역→법인) 또는 **Product**(제품군→제품) 중 하나를 선택해 트리맵 계층을 바꿉니다.
- **시간**: API에서 **dateKey**(예: 2026-01)로 기간을 선택해 해당 기간 데이터만 표시합니다.
- **메트릭**: 박스 **면적**에 쓸 메트릭(size: sales, wifi_sales, connected)과 **색상**에 쓸 메트릭(color: attach_rate, connect_rate)을 선택합니다. 탑재율·연결률은 0~1로 정규화해 빨강–회색–초록, 볼륨 계열은 파랑 계열로 표시합니다.
- **드릴·백**: 노드 클릭 시 한 단계만 드릴하고, Back으로 한 단계 되돌립니다. **TopN** 초과 구간은 “Others”로 묶고, Others 클릭 시 패널에서 항목을 골라 드릴할 수 있습니다.
- **글로벌 뷰**(path 비어 있을 때): 상단에 **RegionBarStrip**(지역별 막대·요약값), 트리맵 상단에는 **upperLabel**로 지역명, 리프에는 **2줄 레이블**(이름 + 메트릭값)을 표시합니다.
- **제약**: 단일 트리맵·2레벨·한 단계 드릴·Geo/Product 두 축만·고정 메트릭 집합(확장 경로는 열어 둠)·외부 UI 프레임워크 미사용(인라인 스타일 또는 레포 내 CSS만).

---

## 3. 시스템 레벨: 아키텍처·데이터 흐름

- **구성**: 사용자 브라우저 ↔ **React 앱**(Vite, 포트 3000 또는 dev) ↔ **Data API**(Express, 포트 8787). 실 DB·스트리밍은 없고, API는 정적 JSON(dummy.json, byDate) 기반입니다.
- **초기 로드**: App의 `useEffect`가 `fetchData(dateKey)`로 GET 8787/data를 호출해 `meta`, `dateKey`, `rows`를 받고, state(dateKey, sizeMetric, colorMetric, topN 등)를 세팅합니다.
- **트리 계산**: `rows`와 state(axis, path, sizeMetric, colorMetric, topN)를 **buildTreemapChildren**에 넣어 **2레벨 트리**(treeData)와 Others용 리스트(othersItems)를 만듭니다.
- **렌더**: treeData를 **TreemapChart**(ECharts treemap)에 넘겨, levels[0]은 upperLabel, levels[1]은 2줄 label, visualMap으로 rate/volume 색상을 적용해 그립니다.
- **상호작용**: 노드 클릭 시 `onChartEvent({ type: "node", path })` 또는 `{ type: "others", othersItems }`로 이벤트가 올라와, path 갱신 또는 Others 패널이 열립니다. Back은 path를 한 단계 잘라서 갱신합니다.
- **품질 평가(E2E)**: Playwright가 브라우저에서 트리맵을 렌더한 뒤 `window.__TREEMAP_DEBUG__.getLeafLayouts()`로 리프 박스 좌표를 받아, **quality_metrics**로 arP95·arMax·minP50·tinyPct를 계산하고 GOAL/SOFT/HARD/FAIL로 판정합니다.

---

## 4. 알고리즘·로직 레벨

- **축별 계층 키(keysForAxis)**: Geo면 `["region","subsidiary","division","product_l2","product_l3"]`, Product면 `["division","product_l2","product_l3","region","subsidiary"]`. 현재 드릴 깊이에 따라 **key0**=상위 차원, **key1**=하위 차원을 정하고, 2레벨만 쓰므로 (key0, key1) 한 쌍으로 트리를 만듭니다.
- **행 필터·집계(buildTree)**: **rowMatchesPath**로 path와 일치하는 행만 남긴 뒤, key0 값별로 그룹화해 sales/wifi_sales/connected를 합산하고 **recomputeRates**로 attach_rate·connect_rate를 구합니다. 같은 방식으로 key1 값별로 하위 집계해 노드(name, value, colorValue, displayLabel, pathToNode, isDrillable, children)를 만듭니다. value 내림차순으로 정렬한 뒤 **TopN**개만 두고 나머지는 **Others** 노드 하나로 합칩니다.
- **Null/빈 문자열**: key0/key1 필드가 null 또는 ""인 행은 집계에서 제외해 트리 노드로 노출하지 않습니다.
- **품질 지표**: 리프 레이아웃 `{ x, y, w, h }[]`에서 AR=max(w/h,h/w), 최소변=min(w,h). arP95(AR 95%ile), arMax, minP50(최소변 50%ile), tinyPct(min<10px 비율)를 구하고, GOAL(arP95≤6, arMax≤12, minP50≥18, tinyPct≤15)부터 SOFT·HARD·FAIL 순으로 완화합니다.
- **트리맵 시각**: levels[0]은 upperLabel만, levels[1]은 label 2줄(이름\n메트릭값), overflow "break". path/axis/treeData가 바뀌면 **resize()**와 **notMerge: true**로 옵션을 통째로 갱신해 그리기를 복구합니다.

---

## 5. 모듈·디렉터리 레벨

- **루트(DAS)**: package.json(test, test:treemap-quality, build:dashboard, serve, build-and-test), DAS.code-workspace(멀티루트), AGENTS.md. 빌드·테스트·문서 진입점을 제공합니다.
- **finviz-like-treemap/web**: React 앱. App.jsx(state·fetchData·onChartEvent·레이아웃), api.js(fetchData → 8787/data), treemap/buildTree.js(rows·state → treeData·othersItems), treemap/TreemapChart.jsx(ECharts 옵션·getLeafLayouts·resize), ui/HeaderBar·Controls·RegionBarStrip·OthersPanel. 트리맵 로직은 treemap/, 공통 UI는 ui/입니다.
- **finviz-like-treemap/server**: Express. index.js(앱·cors·listen 8787), routes.js(GET /health, /subsidiaries, /data), data/dummy.json(byDate·meta), data/dim_subsidiary.json(선택). GET /data?dateKey= → { meta, dateKey, rows }가 API 계약입니다.
- **finviz-like-treemap/docs**: 00_SPECIFICATION_LAYERED.md(비전·제약·데이터 차원·레이어 1–4·코드 용어·품질 지표), DEVELOPMENT_RULES.md(구조·데이터 계약·트리맵 규칙·테스트 계약), TEST_RULES.md(E2E 실행·검증·선택자), REFERENCES_TREEMAP_LITERATURE.md(논문 연대기).
- **tests/treemap**: Playwright E2E. quality_runner.spec.ts(axis×size×color 조합·getLeafLayouts·품질 리포트), quality_metrics.ts(지표·acceptance·fail reason), treemap-header-layout.spec.ts(헤더·폰트·Preset), dashboard_tier_evaluation.spec.ts(범례·오버플로우·티어). baseURL 3000, 품질 테스트 시 8787 데이터 API 기동 권장.
- **docs**: ARCHITECTURE.md(시스템·데이터 흐름·알고리즘), MODULES.md(모듈별 역할·입출력·의존성), PROJECT_GUIDE.md(개발·테스트 가이드), CURSOR_EFFICIENCY_GUIDE.md(Cursor 100+ 항목), CURSOR_SUITABILITY_EVALUATION.md(평가 방법·점수 근거), CURSOR_SUITABILITY_SCORE.md(최신 점수·등급), CURSOR_FIT_ASSESSMENT.md(적합성 요약), PROJECT_DESCRIPTION.md(본 문서).

---

## 6. Cursor·규칙·스킬 레벨

- **규칙(.cursor/rules/)**: 파일 패턴(globs)에 따라 적용. das-dashboard-spec-and-skills(명세·문서), finviz-treemap-development(앱·서버), finviz-treemap-testing(테스트), cursor-suitability-indicators(Cursor 적합성 지표 유지). 각 규칙 본문에 “이 작업 시 이 스킬” 표가 있음.
- **스킬(.cursor/skills/)**: dashboard-requirements(요구사항 수집), data-dimensions-spec(데이터 차원 표), dashboard-layered-spec(레이어 0–4 명세), visualization-technique-selection(시각화 기법 선정), literature-based-design(논문·REFERENCES), visualization-dashboard-spec(위 스킬 오케스트레이션), cursor-suitability-evaluation(적합성 평가 실행·점수 기록).
- **명령(.cursor/commands/)**: run-treemap-quality(품질 테스트 실행), build-and-test-dashboard(빌드 후 테스트), review-and-sync-rules(변경 후 규칙·문서 동기화). 채팅에서 `/`로 호출.
- **워크스페이스**: DAS.code-workspace로 루트·web·server·treemap docs·tests·docs를 멀티루트로 열어 에이전트가 한 세션에서 모두 편집 가능하게 함. search.exclude로 node_modules·dist·build 등 검색 제외.

---

## 7. 평가·품질 레벨

- **Cursor 적합성 평가**: docs/CURSOR_SUITABILITY_EVALUATION.md에 5개 영역(규칙 25·스킬 25·문서 25·명령·워크스페이스·인덱싱 15·검증 10)·세부 항목·확인 방법이 정의되어 있고, §0에 “점수 기준이 무엇인지”, “왜 높게 만족하면 잘 만들어진 것으로 보는지” 근거가 적혀 있습니다. 총점 100, 90 이상을 “아주 적합”으로 둡니다.
- **평가 실행**: 스킬 **cursor-suitability-evaluation**이 체크리스트에 따라 점수를 부여하고 docs/CURSOR_SUITABILITY_SCORE.md를 갱신합니다. 규칙 **cursor-suitability-indicators**가 “해당 지표를 만족하도록 유지하라”고 하며, 평가 시 위 스킬 사용을 안내합니다.
- **대시보드 품질**: E2E 품질 러너가 axis×size×color 조합별로 트리맵을 그린 뒤 getLeafLayouts()로 AR·MIN·TINY를 계산해 GOAL/SOFT/HARD/FAIL로 판정하고, reports/treemap/에 JSON·MD 리포트를 남깁니다.

---

## 8. 요약: 한 번에 보는 구조

| 레벨 | 내용 |
|------|------|
| **저장소** | DAS — BI 시각화 대시보드 프로젝트. |
| **제품** | finviz-like-treemap: 트리맵으로 다차원 데이터(위치·제품·시간·메트릭) 탐색·드릴·비교. |
| **시스템** | 브라우저 ↔ React(Vite)·ECharts ↔ Express(8787). 데이터는 JSON, 테스트는 Playwright. |
| **알고리즘** | keysForAxis·rowMatchesPath·2레벨 집계·TopN/Others·품질 지표(AR·MIN·TINY)·acceptance. |
| **모듈** | 루트(스크립트·워크스페이스), web(App·buildTree·TreemapChart·ui), server(routes·data), treemap/docs(명세·규칙), tests/treemap(E2E·품질), docs(아키텍처·가이드·평가). |
| **Cursor** | 규칙 4종(globs·스킬 표), 스킬 7종(명세·평가 포함), 명령 3종, 워크스페이스. |
| **평가** | Cursor 적합성 100점·90+ 아주 적합; 대시보드 품질 GOAL/SOFT/HARD/FAIL. |

이 문서는 상위에서 상세까지 **전부** 한 흐름으로 서술한 설명입니다. 특정 레벨만 보려면 위 섹션 번호로 찾으면 됩니다.
