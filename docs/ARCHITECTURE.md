# DAS 프로젝트 아키텍처 및 알고리즘

프로젝트 전체에 적용되는 **아키텍처**, **데이터 흐름**, **핵심 알고리즘**을 정리한 문서입니다. Cursor 등 도구가 코드베이스를 이해하고 일관되게 수정할 때 참조합니다.

---

## 1. 시스템 개요

DAS는 **BI(비즈니스 인텔리전스) 시각화 대시보드**를 제공하는 저장소입니다. 핵심 산출물은 **finviz-like-treemap**으로, **트리맵**을 이용한 **다차원 데이터**(위치·제품·시간·메트릭) 분석을 지원합니다.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 사용자 브라우저                                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  React App (Vite, port 3000 또는 dev server)                       │  │
│  │  - App.jsx: state, fetchData, onChartEvent, Controls/HeaderBar    │  │
│  │  - buildTree: rows → treeData (2레벨, TopN, Others)               │  │
│  │  - TreemapChart.jsx: ECharts treemap, visualMap, getLeafLayouts  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│     │ GET /data?dateKey=...                                              │
│     ▼                                                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Data API (Express, port 8787)                                     │  │
│  │  - GET /data → { meta, dateKey, rows }                             │  │
│  │  - GET /subsidiaries, GET /health                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **프론트**: React 18, Vite 5, ECharts 5. 단일 트리맵 뷰, 2레벨 고정, Geo/Product 축 전환.
- **백엔드**: Express, CORS 활성화. 정적 JSON(dummy.json, byDate) 기반 응답. 실 DB/스트리밍 없음.
- **테스트**: Playwright E2E, 루트 `tests/treemap/`. 품질 러너는 axis×size×color 조합별로 트리맵 렌더 후 `getLeafLayouts()`로 지표 수집.

---

## 2. 데이터 흐름 (전체)

1. **초기 로드**: App `useEffect` → `fetchData(dateKey)` → GET 8787/data → `setMeta`, `setRows`, `setState(dateKey, sizeMetric, colorMetric, topN)`.
2. **트리 계산**: `rows` + `state(axis, path, sizeMetric, colorMetric, topN)` → `buildTreemapChildren(rows, state)` → `{ treeData, isLeaf, othersItems }`.
3. **렌더**: `treeData` → TreemapChart → ECharts treemap (levels[0] upperLabel, levels[1] label 2줄), visualMap(rate/volume 색상).
4. **상호작용**: 노드 클릭 → `onChartEvent({ type: "node", path })` 또는 `{ type: "others", othersItems }` → `setState(path)` 또는 Others 패널 오픈. Back → `path.slice(0,-1)`.
5. **품질 평가(E2E)**: 브라우저에서 트리맵 렌더 후 `__TREEMAP_DEBUG__.getLeafLayouts()` → `{ x, y, w, h }[]` → `computeQualityFromLayouts` → arP95, arMax, minP50, tinyPct → GOAL/SOFT/HARD/FAIL.

---

## 3. 핵심 알고리즘

### 3.1 축별 계층 키 (keysForAxis)

- **Geo**: `["region", "subsidiary", "division", "product_l2", "product_l3"]`. 트리맵 상위 = 지역(region), 하위 = 법인(subsidiary).
- **Product**: `["division", "product_l2", "product_l3", "region", "subsidiary"]`. 상위 = 제품군(division), 하위 = product_l2.
- **key0 / key1**: 현재 드릴 깊이에 따른 상위·하위 차원. `key0 = getKeyAt(axis, path.length)`, `key1 = getKeyAt(axis, path.length + 1)`. 2레벨만 표시하므로 항상 (key0, key1) 한 쌍으로 트리 구성.

### 3.2 행 필터링 및 2레벨 집계 (buildTree)

- **rowMatchesPath(row, axis, path)**: row의 `keysForAxis(axis)[0..path.length-1]` 값이 `path`와 순서대로 일치하는지 검사. 일치하는 행만 사용.
- **레벨 0 집계**: `key0` 값별로 그룹화, 각 그룹에 대해 sales/wifi_sales/connected 합산, `recomputeRates`로 attach_rate·connect_rate 계산.
- **레벨 1 집계**: 각 key0 그룹 내에서 `key1` 값별로 동일하게 집계. 노드: `name`, `value`(sizeMetric), `colorValue`(colorMetric), `displayLabel`(이름 + 메트릭값), `pathToNode`, `isDrillable`, `children`.
- **TopN 및 Others**: 상위 레벨(key0) 항목을 value 내림차순 정렬 후 상위 `topN`개만 유지, 나머지는 하나의 “Others” 노드로 합산. Others의 children은 리프만 평탄화해 othersItems로 전달(Others 클릭 시 패널용).

### 3.3 Null/빈 문자열 처리

- **집계 제외**: `key0`/`key1`에 해당하는 필드가 `null` 또는 `""`인 행은 해당 레벨 그룹에 넣지 않음(트리 노드로 노출하지 않음). 명세 §3.2, TBD-3.1.

### 3.4 품질 지표 (quality_metrics.ts)

- **입력**: 리프 노드의 레이아웃 배열 `{ x, y, w, h }[]` (픽셀).
- **AR (Aspect Ratio)**: 각 박스에 대해 `max(w/h, h/w)`. **arP95**: AR 값의 95%ile. **arMax**: 최대 AR.
- **MIN (최소 변)**: 각 박스 `min(w, h)`. **minP50**: 최소변의 50%ile.
- **TINY**: `min(w,h) < 10` 인 박스 비율(%).
- **Acceptance**: GOAL(arP95≤6, arMax≤12, minP50≥18, tinyPct≤15) → SOFT → HARD → FAIL. `getAcceptance()`, `getFailReason()`, `getRecommendedAction()`.

### 3.5 트리맵 시각 옵션 (ECharts)

- **levels[0]**: 상위. upperLabel 표시(지역명 등), label 숨김. itemStyle.borderWidth 2.
- **levels[1]**: 리프. upperLabel 숨김, label 2줄(이름\n메트릭값), overflow "break".
- **visualMap**: rate 메트릭 0–1 → red–gray–green; volume 메트릭 → blue 계열. formatter에서만 %/K/M/B 표시.
- **path/axis/treeData 변경 시**: resize() 및 opts.notMerge: true로 전체 옵션 갱신하여 그리기 복구.

---

## 4. 경계 및 의존성

| 경계 | 내용 |
|------|------|
| **프론트–API** | fetch(`http://localhost:8787/data...`). 계약: meta, dateKey, rows. row 스키마: region, subsidiary, division, product_l2, product_l3, sales, wifi_sales, connected. |
| **App – buildTree** | (rows, state) → buildTreemapChildren → treeData, othersItems. state: dateKey, axis, path, sizeMetric, colorMetric, topN. |
| **TreemapChart – ECharts** | treeData → series[0].data(트리 구조), levels, visualMap. 디버그: __TREEMAP_DEBUG__.getLeafLayouts() = 리프 레이아웃 배열. |
| **E2E – 앱** | id/data-testid, __TREEMAP_DEBUG__ 계약. TEST_RULES §4, DEVELOPMENT_RULES §5. |

---

## 5. 문서와의 대응

| 문서 | 역할 |
|------|------|
| **00_SPECIFICATION_LAYERED.md** | 비전·제약·데이터 차원·레이어 1–4·코드 레벨 용어·품질 지표·DOM 계약 |
| **DEVELOPMENT_RULES.md** | 프로젝트 구조·데이터 계약·트리맵 규칙·테스트 계약 |
| **TEST_RULES.md** | E2E 실행·검증 항목·선택자·품질 러너 |
| **REFERENCES_TREEMAP_LITERATURE.md** | 트리맵 논문 연대기·본 프로젝트 반영 |
| **본 문서 (ARCHITECTURE.md)** | 시스템 개요·데이터 흐름·핵심 알고리즘·경계 |

모듈별 상세(파일 단위 역할·입출력·의존성)는 **MODULES.md**를 참조합니다.
