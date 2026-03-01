# DAS 대시보드 — 계층별 명세 (처음부터 재계획)

**목적**: 최고 수준의 데이터 분석 대시보드, 탑티어 논문 수준 시각화, 누구나 쉽게 사용 가능한 대시보드를 위한 **상세 필수 기술 사항**과 **불명확·미진·TBD** 항목을 큰 레벨에서 작은 레벨로 구체화한다.  
시각적 결정을 위한 그림/코드 스케치, 라이브러리 제약, 구현 정확성 평가 요소, 코드 레벨 용어를 포함한다.

---

## 0.0 시각화 대시보드의 위치: BI·다차원 분석

- **비즈니스 인텔리전스(BI)용 시각화**: 본 대시보드는 **비즈니스 인텔리전스를 위한 시각화** 대시보드이며, 26년 최신까지의 논문 흐름(트리맵 taxonomy·literacy·레이아웃 안정성 등)에 맞춰 설계된다.
- **트리맵을 사용한 다차원 데이터 분석**: 분석 대상은 **다차원** 데이터이다. 다차원인 이유는 다음이 동시에 사용되기 때문이다.
  - **위치 정보에 대한 계층 구조**: region → subsidiary (→ division 등). 축 선택 시 **Geo**.
  - **제품에 대한 계층 구조**: division → product_l2 → product_l3 (→ region, subsidiary). 축 선택 시 **Product**.
  - **시간 지표**: 기간(날짜/월 등)으로 데이터를 슬라이스. `dateKey`로 선택.
  - **메트릭**: 위 차원들 위에서 **sales, wifi_sales, connected, attach_rate, connect_rate** 등을 집계·비교·색상·면적으로 분석.
- **데이터 차원의 범위**:
  - **현재까지 데이터에 대한 차원은 이 수준으로 고정**되어 있다.
  - 개선을 위해 **데이터셋 구조에 대한 제안**은 가능하나 **옵션**이다.
  - **현재 목표**는 **이 데이터 구성에서 분석을 지원하기 위한 대시보드 구성**이다.

---

## 레이어 0 — 비전·목표·제약

### 0.1 목표 (Goals)

| ID | 목표 | 구체화 수준 | 결정 |
|----|------|-------------|------|
| G1 | **최고 수준 데이터 분석 대시보드** | 데이터 계층(지역→법인→제품) 탐색, 메트릭 비교, 한 화면에서 구조·규모·비율 동시 인지 | **기준**: 현재 정의한 품질 지표(AR/MIN/TINY) + 가로 오버플로우 없음 + 2줄 레이블 충족 |
| G2 | **탑티어 논문 수준 시각화** | 트리맵 기반 공간 채우기, 색상으로 연속/비율 인코딩, 레이블·계층 명시, 재현 가능한 색상 스케일 | **참조**: Shneiderman 트리맵; 색상은 내부 가이드(rate=diverging, volume=sequential) |
| G3 | **누구나 쉽게 사용** | 최소 클릭으로 드릴/백, 명확한 축(Axis) 전환, 레이블 2줄(이름+값), 가로 오버플로우 없음 | 유지 |

### 0.2 제약 (Constraints)

| ID | 제약 | 출처/비고 | 결정 |
|----|------|-----------|------|
| C1 | **단일 트리맵 뷰** | 한 화면에 하나의 트리맵; 멀티 차트/대시보드 그리드 미지원 | 유지 |
| C2 | **2레벨 트리** | 항상 상위 1레벨 + 하위 1레벨(리프). `leafDepth: 2` 고정 | 유지 |
| C3 | **드릴 한 단계** | 클릭 시 한 레벨만 진입; path는 순차 배열로 관리 | 유지 |
| C4 | **지역(Geo) / 제품(Product) 축** | 두 축만 지원. `axis`: `"geo"` \| `"product"` | 유지 |
| C5 | **고정 메트릭 집합** | size: sales, wifi_sales, connected; color: attach_rate, connect_rate | **확장 경로 열어 둠**: 추후 서버/스키마 변경으로 메트릭 추가 가능하도록 설계 |
| C6 | **외부 UI 프레임워크 미사용** | 인라인 스타일 또는 레포 내 CSS만 사용 | **강화**: CSS-in-JS·Tailwind 미사용. 인라인 `style` + 레포 내 순수 CSS만 |

### 0.3 비목표 (Out of Scope) — 명시적 제한

- 실시간 스트리밍/WebSocket
- 사용자 인증·권한·멀티테넌시
- 모바일 전용 레이아웃 (반응형은 보조 목표)
- **PDF/이미지 내보내기**: 추후 1단계 확장 후보로만 명시(필수 아님)
- 다국어(i18n) 전면 지원 (레이블은 현재 한/영 혼용 허용)

### 0.4 현재까지 수집된 요구사항 (기존 문서·코드 기반)

- **글로벌 레벨**: 지역 타이틀 표시, 법인 박스 표시, 법인 한 줄 + 메트릭 한 줄(2줄 레이블).
- **지역별 요약**: RegionBarStrip(지역명 + 막대 + 요약값) 유지.
- **지역명 가시성**: upperLabel에 배경색·폰트·높이 명시; formatter에서 빈 문자열 방지.
- **그리기 안정성**: path/axis 변경 시 `resize()` 및 `notMerge: true`로 레이아웃 복구.
- **품질 평가**: 리프 박스 AR(aspect ratio), MIN(최소 변), TINY 비율로 GOAL/SOFT/HARD/FAIL 판정.

### 0.5 트리맵 관련 논문 연대기 (최신 → 최초)

본 대시보드의 트리맵 설계·품질 지표(AR, min side)는 아래 문헌 흐름을 참조한다. **최신부터 최초 논문 순**으로 정리한다.

| 시기 | 논문·저자 | 내용 | 본 프로젝트 반영 |
|------|-----------|------|------------------|
| **2020년대** | Scheibel, Trapp, Limberger, Döllner — *A taxonomy of treemap visualization techniques* (Potsdam, 2020) | 트리맵 기법 분류: Space-filling(TS) ⊂ Containment(TC) ⊂ Implicit Edge(TIE) ⊂ Mapped Tree(TMT). containment 기반 계층 인코딩. | **TS(공간 채우기)** 유형 채택; 상위 레벨 upperLabel로 계층 명시. |
| | Hilbert/Moore treemap 개선 (EuroVis 2021 등) | 시계열·시간 변동 데이터에서 레이아웃 안정성, space-filling curve 연속성. | 동적 데이터(path 변경) 시 resize·notMerge로 복구 정책 참고. |
| | Firat et al. — *Treemap Literacy: A Classroom-Based Investigation* (2020) | 트리맵 해석·구성 능력, 비전문가 장벽, 설계 파라미터가 복잡도에 미치는 영향. | 2줄 레이블·최소 폰트·min side로 가독성 제어. |
| | Map-like vs nested treemap 비교 실험 (arXiv 2019 등) | 중첩 트리맵이 작업 속도·사용성에서 유리하다는 실험 결과. | 2레벨 중첩 트리맵 유지. |
| **2000년대** | Bederson, Shneiderman, Wattenberg — *Ordered Treemap Layouts* (ACM ToG, 2002) | Strip·Pivot 알고리즘; 순서 유지·동적 데이터 안정성·aspect ratio 균형. IEEE VIS Test of Time Award 2021. | ECharts treemap의 기본 레이아웃(순서·비율)에 위 원칙이 반영되어 있음. |
| | Shneiderman, Wattenberg — *Ordered treemap layouts* (IEEE INFOVIS, 2001) | 위 2002 논문의 학회 버전. | 동일. |
| | Bruls, Huizing, van Wijk — *Squarified Treemaps* (Eurographics/IEEE VisSym, 2000) | 사각형에 가깝게 분할하여 종횡비 개선; 가늘고 긴 사각형 완화. | 품질 지표 **arP95, arMax**(aspect ratio)로 평가. |
| **1990년대 (최초)** | Shneiderman — *Tree visualization with tree-maps: A 2-d space-filling approach* (ACM ToG, 1992) | 계층을 2차원 공간 채우기로 표현, 노드 면적이 양적 속성에 비례. HCIL TR 91-03(1991) 확장. | **공간 채우기 트리맵**의 기원; value ∝ 면적, 2레벨 노드·리프 구조. |

- **상세 인용·요약**: `docs/REFERENCES_TREEMAP_LITERATURE.md` 참조.
- **본 프로젝트 위치**: Space-filling treemap(TS), 2레벨 고정, 면적=size 메트릭·색상=color 메트릭, 상위 upperLabel·리프 2줄 레이블, AR·min side·tiny 비율로 품질 판정.

### 0.6 데이터 차원 (고정·옵션 개선)

| 차원 | 설명 | 현재 수준 | 비고 |
|------|------|-----------|------|
| **위치 계층** | region → subsidiary → (division, product_l2, product_l3) | `keysForAxis("geo")` 순서로 고정 | Geo 축 선택 시 트리맵에 반영 |
| **제품 계층** | division → product_l2 → product_l3 → region → subsidiary | `keysForAxis("product")` 순서로 고정 | Product 축 선택 시 트리맵에 반영 |
| **시간** | dateKey(예: 2026-01)로 기간 슬라이스 | API `GET /data?dateKey=...` | 메트릭 집계의 시간 범위 |
| **메트릭** | size: sales, wifi_sales, connected; color: attach_rate, connect_rate | 고정 (확장 경로 열어 둠) | 면적·색상 인코딩 |

- **데이터셋 구조 제안**: 개선을 위해 스키마·계층·메트릭 추가 등 **데이터셋 구조에 대한 제안이 가능**하나 **옵션**이다. 현재는 위 데이터 구성으로 **분석을 지원하는 대시보드 구성**이 범위이다.

---

## 레이어 1 — 제품·UX

### 1.1 사용자 시나리오 (필수)

| 시나리오 | 단계 | 필수 동작 |
|----------|------|------------|
| S1 | 초기 로드 | Date 선택, Axis(Geo/Product), Size/Color 메트릭 선택 가능. 트리맵 및 RegionBarStrip(글로벌 시) 표시 |
| S2 | 드릴다운 | 노드 클릭 → path 갱신 → 해당 하위 트리만 2레벨로 재표시 |
| S3 | 백 | Back 클릭 → path 한 단계 제거 → 상위 뷰 복원 |
| S4 | Others | TopN 초과 구간 클릭 시 Others 패널 오픈, 항목 선택 시 해당 노드로 드릴 |

### 1.2 화면 구성 (필수 요소)

- **상단**: GLOBAL 요약(매출·연결 등) + Date/Axis/Size/Color/TopN/Back 컨트롤 + Breadcrumb.
- **중단(글로벌 시)**: RegionBarStrip(지역 막대 + 지역별 요약값).
- **메인**: 트리맵(지역 upperLabel + 리프 2줄 레이블) + 색상 범례(visualMap).
- **기타**: Others 패널(모달/드로어).

### 1.3 결정 사항 (레이어 1) — TBD 해소

| ID | 내용 | 결정 |
|----|------|------|
| TBD-1.1 | **타깃 사용자** | **1순위: 내부 분석가.** 용어는 region/subsidiary/메트릭명 유지, 한글 라벨은 보조(탑재율·연결률 등). |
| TBD-1.2 | **접근성** | **현재 WCAG 미적용.** 목표만 명시; 추후 키보드 탭·엔터로 드릴/백 가능하게 확장. 스크린 리더 요약 문장은 추후. |
| TBD-1.3 | **반응형** | **최소 뷰포트 1024px.** 그 이하는 "데스크톱에서 이용해 주세요" 안내 메시지 표시. |
| TBD-1.4 | **에러·빈 상태** | **API 실패**: 한 줄 문구 + 재시도 버튼, 헤더 아래 전체 영역. **데이터 0건**: "이 기간/조건에 데이터가 없습니다" + 날짜/필터 변경 유도. |
| TBD-1.5 | **로딩** | **초기 로딩**: "Loading..." 텍스트 유지. **드릴/백**: 로컬 state만 사용하므로 별도 로딩 없이 즉시 전환. |

---

## 레이어 2 — 시각화 설계

### 2.1 시각화 기법 (적용된 것)

| 기법 | 구현 | 논문/참고 |
|------|------|-----------|
| **공간 채우기 트리맵** | ECharts treemap, value로 면적 비율 | §0.5 연대기: Shneiderman (1992), Bruls et al. squarified (2000), Ordered (2001–2002) |
| **색상 인코딩** | 연속형 visualMap; 비율(rate) 0–1 → red–gray–green, 볼륨 → blue 계열 | 시각적 대비·색맹 고려 권장 |
| **계층 표시** | levels[0] upperLabel(지역), levels[1] label(리프) | Taxonomy(2020) TS/TC, 상위 레벨 라벨로 맥락 제공 |
| **2줄 레이블** | `이름\n메트릭값` (overflow: break) | Treemap literacy(2020) 가독성·정보 밀도 균형 |

### 2.2 색상·레이블 규칙 (필수)

- **Rate 메트릭**: 0~1 정규화 저장, formatter에서만 % 표시. 색상: red(#b71c1c) – gray(#f5f5f5) – green(#1b5e20).
- **Volume 메트릭**: 0~1 정규화, formatter에서 K/M/B. 색상: #e3f2fd – #1565c0.
- **upperLabel**: 배경 #cbd5e1, 글자 #0f172a, height ≥ 36px, 빈 문자열 시 "(No name)" 폴백.

### 2.3 결정 사항 (레이어 2) — TBD 해소

| ID | 내용 | 결정 |
|----|------|------|
| TBD-2.1 | **색상 스케일** | **참조 논문 없음.** 내부 가이드로 고정: rate=diverging(빨–회–초), volume=sequential(파랑). |
| TBD-2.2 | **폰트·가독성** | **리프 박스 최소 폰트 9px**(테스트와 동일). **min side < 18px이면 라벨 숨김** 규칙 명세. |
| TBD-2.3 | **애니메이션** | **드릴/백 시 애니메이션 없음.** |
| TBD-2.4 | **색맹** | **현재 미검증.** 추후 색맹 시뮬레이션 후 팔레트 조정 가능. |

---

## 레이어 3 — 기술·라이브러리·계약

### 3.1 라이브러리 제약 (필수)

| 영역 | 제약 | 버전·비고 |
|------|------|------------|
| **차트** | ECharts | 5.x. treemap 타입, visualMap, levels, upperLabel/label formatter 사용 |
| **프론트** | React | 18.x. 함수 컴포넌트 + Hooks만 |
| **빌드** | Vite | 5.x. ES modules |
| **E2E** | Playwright | @playwright/test, Chromium |

### 3.2 데이터 계약

- **API**: `GET /data?dateKey=...` → `{ meta: { availableDates, metrics, defaultSize, defaultColor, topNDefault }, dateKey, rows }`.
- **row 스키마**: `region`, `subsidiary`, `division`, `product_l2`, `product_l3`, `sales`, `wifi_sales`, `connected`. **Null/빈 문자열**: key 필드(region, subsidiary 등)가 null/빈 문자열인 행은 집계에서 **제외**(트리 노드로 노출하지 않음).
- **트리 노드**: `name`, `value`, `metrics`, `colorValue`, `tooltipHtml`, `displayLabel`, `pathToNode`, `isDrillable`, `children`.

### 3.3 품질 평가 (구현 정확성)

| 지표 | 정의 | 목표(GOAL) | 판정 |
|------|------|------------|------|
| **arP95** | 리프 박스 종횡비(AR) 95%ile | ≤ 6 | ASPECT_RATIO |
| **arMax** | 리프 AR 최대 | ≤ 12 | |
| **minP50** | 리프 최소변(px) 50%ile | ≥ 18 | MIN_SIDE_TOO_LOW |
| **tinyPct** | 최소변 &lt; 10px인 비율(%) | ≤ 15 | TINY_TOO_MANY |

- **Acceptance**: GOAL → SOFT → HARD → FAIL 순으로 완화. 코드: `quality_metrics.ts`의 `getAcceptance`, `getFailReason`, `getRecommendedAction`.

### 3.4 결정 사항 (레이어 3) — TBD 해소

| ID | 내용 | 결정 |
|----|------|------|
| TBD-3.1 | **row Null/빈 문자열** | key 필드 null/빈 문자열인 행은 **집계 제외**(트리에 노드로 노출하지 않음). |
| TBD-3.2 | **메트릭 확장** | **필수 수정 순서**: server 스키마(rows 필드) → buildTree `aggInit`/`recomputeRates` → `METRIC_LABELS`(Controls) → (선택) quality_runner 조합. |
| TBD-3.3 | **ECharts 버전** | **최소 버전 `^5.6.0`** 명시. 호환성은 동일 major 내에서 보장 목표. |

---

## 레이어 4 — 구현·코드 레벨

### 4.1 상태·데이터 흐름 (용어)

- **state**: `{ dateKey, axis, path, sizeMetric, colorMetric, topN }`.
  - `path`: 드릴 경로 배열, 예: `["Asia", "SAPL"]`.
  - `axis`: `"geo"` \| `"product"`.
- **keysForAxis(axis)**: geo → `["region","subsidiary","division","product_l2","product_l3"]`; product → `["division","product_l2","product_l3","region","subsidiary"]`.
- **key0 / key1**: `getKeyAt(axis, path.length)`, `getKeyAt(axis, path.length + 1)`. 트리 상위/하위 차원.

### 4.2 트리맵 옵션 (ECharts)

- **levels[0]**: 상위(지역/제품군 등). `upperLabel.show: true`, `label.show: false`, `itemStyle.borderWidth: 2`.
- **levels[1]**: 리프. `upperLabel.show: false`, `label.show: true`, `label.overflow: "break"`, formatter: `name + "\n" + rest`(displayLabel 파싱).
- **displayLabel**: `"이름 메트릭값"` (공백 1개). 파싱: `full.startsWith(name) ? full.slice(name.length).trim() : full` → 두 번째 줄.

### 4.3 DOM·테스트 계약

- **id**: `#main-dashboard`, `#treemap-container`, `#adv-rootmode-toggle`, `#adv-size-metric-select`, `#adv-color-metric-select`, `#adv-preset-region-sales`.
- **data-testid**: `dashboard`, `treemap-container`, `axis-geo`, `axis-product`.
- **클래스**: `.treemap-header`, `.treemap-header-title`, `.treemap-axis-btn`, `.treemap-preset-inline`, `.treemap-preset-btns`.
- **window.__TREEMAP_DEBUG__**: `chart`, `getLeafLayouts()` → `{ x, y, w, h }[]`.

### 4.4 안정성 (그리기 복구)

- path/axis/treeData.length 변경 시 150ms 후 `chart.resize()`.
- ReactECharts `opts={{ notMerge: true }}`로 옵션 전부 교체.

### 4.5 결정 사항 (레이어 4) — TBD 해소

| ID | 내용 | 결정 |
|----|------|------|
| TBD-4.1 | **에러 바운더리** | **현재 미적용.** 추후 트리맵 영역만 Error Boundary 적용 검토. |
| TBD-4.2 | **getLeafLayouts 캐시** | **표준: ECharts `finished` 이벤트 기반 캐시.** 매 호출 시 재계산 금지(성능). |
| TBD-4.3 | **키 전략** | **path 기반 key 미사용.** `notMerge: true` + `resize()`만 사용으로 고정. |

---

## 레이어 5 — 시각적 결정·스케치 (참고)

아래는 레이아웃/비율을 코드로 표현한 스케치이다. 실제 픽셀은 CSS/테마에서 조정.

```
┌─────────────────────────────────────────────────────────────────┐
│ GLOBAL   Sales: 1.6B   WiFi: 812.9M   Connected: 399.6M   ...   │  ← HeaderBar
├─────────────────────────────────────────────────────────────────┤
│ Date [2026-01]  Axis [Geo][Product]  Size [Sales][...]  Color... │  ← Controls
│ Breadcrumb: Global > ...   (Axis=geo, TopN=50)                   │
├─────────────────────────────────────────────────────────────────┤
│ Region   [Asia] [North America] [Korea] [Europe] ...            │  ← RegionBarStrip (path.length===0)
│          Asia 485.6M   North America 305.8M   ...               │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐│
│ │  Asia 485.6M  │  North America ...  │  (upperLabel)           ││
│ │ ┌─────┬─────┐ │ ┌─────┬─────┐      │                         ││
│ │ │SAPL │SSEC │ │ │ ... │     │      │  ← levels[1] 박스       ││
│ │ │46.8%│51.5%│ │ │     │     │      │    1줄: 이름 2줄: 메트릭 ││
│ │ └─────┴─────┘ │ └─────┴─────┘      │                         ││
│ └──────────────────────────────────────────────────────────────┘│
│  [색상 범례 0% — 100%]                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 문서·평가와의 매핑

| 문서 | 대응 레이어 |
|------|-------------|
| `DEVELOPMENT_RULES.md` | 레이어 3·4 (구조, 데이터 계약, 트리맵 규칙, 테스트 계약) |
| `TEST_RULES.md` | 레이어 3·4 (실행, 검증 항목, 선택자, 품질 러너) |
| `quality_metrics.ts` | 레이어 3 (품질 지표·acceptance·fail reason) |
| 본 명세 `00_SPECIFICATION_LAYERED.md` | 레이어 0~5 통합, TBD 목록 |

---

## 다음 단계 (권장)

1. ~~**TBD 해소**~~: 레이어 1~4 TBD는 위 "결정 사항" 표에 반영 완료.
2. **시각적 스케치 확정**: 레이아웃/컴포넌트 치수·간격을 픽셀 또는 rem으로 고정하고 DESIGN_TOKENS.md 등으로 분리할지 결정.
3. **평가 확장**: 라벨 가독성(폰트 9px·min side 18px), 색맹 안전성, 접근성(키보드/스크린리더)에 대한 체크리스트 또는 자동화 항목 추가.
4. **코드와 동기화**: state/keys/displayLabel/levels/__TREEMAP_DEBUG__·Null 제외 규칙·메트릭 확장 순서가 이 명세와 일치하는지 정기 검토.
