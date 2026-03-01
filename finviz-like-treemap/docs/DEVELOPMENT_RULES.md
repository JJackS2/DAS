# finviz-like-treemap 개발 규칙

이 문서는 **대시보드**(finviz-like-treemap) 개발 시 준수할 구조, 네이밍, 데이터 계약, 트리맵 규칙을 정의합니다. 대시보드는 **비즈니스 인텔리전스(BI)용 시각화**이며, **트리맵을 사용한 다차원 데이터 분석**(위치 계층·제품 계층·시간·메트릭)을 지원합니다. 데이터 차원은 현재 수준으로 고정되어 있고, 데이터셋 구조 제안은 옵션입니다. 상세는 `00_SPECIFICATION_LAYERED.md` §0.0, §0.6 참조.

---

## 1. 프로젝트 구조

```
finviz-like-treemap/
├── server/          # Express API (데이터 제공)
│   └── src/
│       ├── index.js
│       ├── routes.js
│       └── data/
├── web/             # React + Vite 프론트엔드
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   ├── treemap/       # 트리맵 로직
│   │   │   ├── buildTree.js
│   │   │   └── TreemapChart.jsx
│   │   └── ui/            # 공통 UI
│   │       ├── HeaderBar.jsx
│   │       ├── Controls.jsx
│   │       ├── RegionBarStrip.jsx
│   │       └── OthersPanel.jsx
│   ├── index.html
│   └── vite.config.js
└── docs/
    ├── DEVELOPMENT_RULES.md  # 본 문서
    └── TEST_RULES.md
```

- **server**: 더미/실데이터 API, 포트 8787.
- **web**: React 18, Vite 5, ECharts 5. 빌드 결과는 `web/dist`.

---

## 2. 기술 스택 및 코딩 스타일

- **React**: 함수 컴포넌트, Hooks만 사용.
- **모듈**: ES modules. 확장자 `.js` / `.jsx` 명시.
- **스타일**: 인라인 `style={{}}` 또는 동일 레포 내 CSS. 외부 UI 프레임워크 비사용.
- **네이밍**:
  - 컴포넌트: PascalCase.
  - 파일: 컴포넌트는 PascalCase (예: `TreemapChart.jsx`), 유틸/로직은 camelCase (예: `buildTree.js`).
  - props/state: camelCase.
  - 상수: UPPER_SNAKE 또는 METRIC_LABELS 같은 객체.

---

## 3. 데이터 계약

### 3.1 API 응답 (server)

- **GET /data?dateKey=...**
  - `{ meta: { availableDates, metrics, defaultSize, defaultColor, topNDefault }, dateKey, rows }`
  - `rows`: 배열, 각 행은 `region`, `subsidiary`, `division`, `product_l2`, `product_l3`, `sales`, `wifi_sales`, `connected` 등 포함.

### 3.2 App state

- `state`: `{ dateKey, axis, path, sizeMetric, colorMetric, topN }`
  - `axis`: `"geo"` | `"product"` (드릴 축).
  - `path`: 현재 드릴 경로 배열 (예: `["Asia", "SAPL"]`).
  - `sizeMetric` / `colorMetric`: buildTree 및 ECharts에서 사용하는 메트릭 키.

### 3.3 트리 데이터 (buildTree)

- `buildTreemapChildren(rows, state)` → `{ treeData, isLeaf, othersItems }`
- 노드: `name`, `value`, `metrics`, `colorValue`, `tooltipHtml`, `displayLabel`, `pathToNode`, `isDrillable`, `children`(선택).
- `displayLabel`: 화면 라벨 문자열 (예: `"Asia 1.2M"`, `"SAPL 0.5M"`). **법인 박스는 "이름 + 공백 + 메트릭값"** 형태로 두 줄 표시용으로 파싱됨.

---

## 4. 트리맵 시각화 규칙

- **계층**: 2레벨 트리 (상위: 지역/제품군 등, 하위: 법인/제품 등). `leafDepth: 2`.
- **글로벌(path.length === 0)**:
  - 상단 **RegionBarStrip** 표시 (지역별 막대 + 요약값).
  - 트리맵 **levels[0]**: 지역(상위) — **upperLabel**로 지역 타이틀 표시 (배경색·폰트·높이 명시).
  - 트리맵 **levels[1]**: 법인(리프) — **label** 2줄: 1줄=이름, 2줄=메트릭.
- **색상**: rate 메트릭은 0~1 정규화 후 red–gray–green; volume 메트릭은 0~1 정규화 후 blue 계열. `visualMap` formatter에서만 실제 값(%, K/M/B) 표시.
- **클릭**: 노드 클릭 시 `onChartEvent({ type: "node", name, path })` 또는 `{ type: "others", othersItems }`. 한 레벨씩만 드릴.

---

## 5. 테스트 계약 (E2E)

- **컨테이너**: 트리맵을 감싼 영역에 `id="treemap-container"` 또는 동일 역할의 data-testid 제공.
- **디버그 API**: `window.__TREEMAP_DEBUG__` (선택)
  - `chart`: ECharts 인스턴스.
  - `getLeafLayouts()`: `{ x, y, w, h }[]` — 리프 노드의 레이아웃 배열. 품질 테스트에서 사용.
- **컨트롤**: Axis(Geo/Product), Size, Color, TopN, Back 등은 테스트에서 선택 가능한 id 또는 data-testid 유지.

---

## 6. 반복 규칙

1. **개발** → 위 규칙에 따라 구현/수정.
2. **검증** → 로컬에서 빌드·실행으로 동작 확인. (데이터 필요 시 `finviz-like-treemap/server` 8787 기동.)
3. **테스트 수행** → `TEST_RULES.md` 및 프로젝트 루트 `npm run test` / `npm run test:treemap-quality` 실행. 품질 테스트는 데이터 API(8787) 기동 시 유의미한 결과.
4. **결과 피드백 반영** → 실패 원인 수정, 필요 시 규칙 보완.
5. **문서 업데이트** → 변경된 계약·선택자는 DEVELOPMENT_RULES.md / TEST_RULES.md 반영.
6. **테스트 재수행** → 3~5 반복 until 통과.
