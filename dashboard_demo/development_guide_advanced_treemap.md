아래는 **Advanced Treemap “Version 5” 단일 지시문**이다.
라이트 테마(흰 배경) + Finviz 스타일 Diverging(빨강↔초록) + **SOFT PASS 허용 / GOAL 목표** + **원클릭 Autopilot(자동 반복 튜닝/검증/리포트/스크린샷)**까지 전부 포함한다.

---

# Advanced Treemap v5 — One-Click Autopilot Spec (Light + Diverging + SOFT Pass, GOAL Target)

## 0) 목표(고정)

* Advanced 페이지에서 Treemap을 **Finviz 수준의 비교 UX**로 구현한다.
* Treemap은 “패턴/상대규모” 전달, 숫자/설명은 “Hover 카드 + Right Panel”에서 읽는다.
* 사용자는 **한 번의 실행**으로 자동 튜닝/검증 루프를 돌려 최종 PASS 상태의 결과물을 얻는다.

---

## 1) 브라우저/테마/색상 정책(고정)

### 1.1 지원 브라우저(고정)

* 테스트/최적화 기준: **Chrome Stable**
* 자동 검증: Playwright **chromium** 고정

### 1.2 테마(고정)

* **Light theme** (배경 흰색)
* Advanced 캔버스/패널 배경은 단색(그라데이션/필터 금지)

### 1.3 색상 규칙(Finviz Diverging, 고정)

* Diverging: **Red ↔ Green**
* 색상은 오직 **visualMap**만 담당한다.
* `levels` 및 `data.itemStyle`에서 **색상 관련 속성 금지**:

  * 금지: `color`, `colorAlpha`, `colorSaturation`, `opacity` 변경, `emphasis.itemStyle.color`, 그림자, 그라데이션
  * 허용: `borderWidth`, `borderColor`, `gapWidth`만

---

## 2) 정보 구조(계층/루트 모드)

### 2.1 표준 필드명(고정)

* `region`
* `subsidiary`
* `product_group` (L1)
* `product2` (L2)
* `product3` (L3)

### 2.2 Root Mode 2종(고정)

* **Region-first**: `Global > region > subsidiary > product_group > product2 > product3`
* **Product-first**: `Global > product_group > product2 > product3 > region > subsidiary`
* country 축은 제거한다(집계/표기/필터 모두 제외)

---

## 3) Metric 정의(Area vs Color)

### 3.1 Size Metric(Area 후보, 4개 고정)

* `sales_count`
* `smart_sales_count`
* `connected_count`
* `device_count`

### 3.2 Color Metric(비율 후보, 2개 고정)

* `installation_rate_pct = smart_sales_count / sales_count * 100`
* `connection_rate_pct = connected_count / smart_sales_count * 100`

규칙:

* 0으로 나누기 → 0
* 0~100 clamp

### 3.3 기본 설정(초기값)

* Root Mode: `Region-first`
* Size Metric: `sales_count`
* Color Metric: `connection_rate_pct`

---

## 4) UI 레이아웃 (One-screen layout, 픽셀 규칙)

### 4.1 3영역 고정

1. **Top Control Bar**
2. **Main Treemap Canvas**
3. **Right Side Panel (Collapsible Drawer)**

### 4.2 기본 픽셀 값(초기 노브)

* Top bar height: **56px**
* Right panel width: **360px**
* Right panel collapsed width: **48px**
* Canvas padding: **12px**
* gapWidth: **2px**
* borderWidth: default **1**, highlight **3**, selected **4**
* Font:

  * base: **12px**
  * label: **11px**
  * line-height: **13px**

### 4.3 Top Control Bar 구성(고정)

* Root Mode toggle (Region-first / Product-first)
* Size Metric selector (4개)
* Color Metric selector (2개)
* Preset buttons (최소 4개)
* AreaScale badge (none / √ / log1p)
* Quality badge (OK / WARN / FAIL) + 적용된 fallback 요약 문자열

### 4.4 Right Panel 구성(고정)

* Breadcrumb path
* Selected node metrics:

  * actualValue(선택 Size)
  * installation_rate_pct / connection_rate_pct
  * parent share(옵션)
* Same-level Top 10 / Bottom 10 표(정렬 기준 고정: **actualValue desc/asc**)
* Quality summary(현재 케이스 acceptance + 핵심 지표)

---

## 5) Treemap 렌더링 설계(ECharts 유지)

### 5.1 노드 데이터 스키마(고정)

각 노드에 다음 필드를 반드시 포함:

* `name`
* `value` = layout_value (면적 계산용)
* `actualValue` = actual_value (표기/정렬/패널용)
* `colorValue` = 선택 Color Metric (0~100)
* `level` (1~6)
* `isOther` (boolean)
* `children[]`
* (2-pass 라벨용) `__minSide` (optional)

표기(라벨/툴팁/패널)는 **actualValue + colorValue만** 사용.

### 5.2 AreaScale(레이아웃 값 분리)

* none: `layout_value = actualValue`
* sqrt: `layout_value = sqrt(actualValue)`
* log1p: `layout_value = log1p(actualValue)`

### 5.3 TopN+Other (과밀 방지)

* leaf cap 기본 250, TopN 200
* 강화 단계: leaf cap 150, TopN 120
* Other는 `isOther=true` 집계 노드로 표시(leaf 아님)

---

## 6) 라벨/툴팁/인터랙션(Finviz UX)

### 6.1 라벨 규칙(2-pass 기반, 고정)

라벨은 leaf rect 크기에 따라 표시한다. 기준은 `__minSide`.

* Large: `__minSide >= 44` → `name + actualValue + %`
* Medium: `__minSide >= 28` → `name + %`
* Small: `__minSide >= 18` → `%` 또는 숨김(초기 정책: 숨김)
* Tiny: `< 18` → 숨김

### 6.2 Tooltip(고정)

hover 시 tooltip에는:

* name
* actualValue(선택 Size)
* installation_rate_pct, connection_rate_pct
* rank in level(옵션)

툴팁은 confine=true(뷰포트 밖으로 나가지 않음)

### 6.3 인터랙션(고정)

* node click: zoomToNode
* breadcrumb click: zoom out
* 현재 레벨 표시: `Level x / 6`
* Search(선택): 노드명 검색 → highlight + zoom
* Pinboard(선택 기능): hover 카드에서 “Pin” → 최대 5개 고정 비교(우측 패널 상단)

---

## 7) “색상 톤이 달라지는 문제” 방지 규칙(필수 금지 목록)

### 금지(절대)

* `data[i].itemStyle.color` 설정
* `levels[*]`에서 색/알파/채도 관련 설정
* `emphasis.itemStyle.color` 또는 opacity 변경
* shadow/gradient/filter/mix-blend-mode 사용
* 부모 컨테이너에 opacity/filter 적용

### 허용

* borderWidth/borderColor만 조건부 변경(Top/Bottom/Selected 강조)
* background는 단색

---

## 8) 자동 검증 메트릭(“사람에게 올바르게 보이는지”)

### 8.1 Treemap Shape Metrics

* AR = max(w/h, h/w)
* MIN = min(w,h)
* TINY ratio = MIN < 10px

### 8.2 Layout Integrity Metrics

* Overflow-0: 주요 컨테이너가 viewport 밖으로 나가는 픽셀 = 0
* No-overlap: Top/Canvas/Right 영역 겹침 = 0
* Control alignment: top bar 내부 baseline 오차 ≤ 2px

### 8.3 Readability Metrics

* Label-eligible coverage: `MIN >= 28` leaf 중 라벨 표시율 ≥ 90%
* Tiny suppression: `MIN < 18` leaf 라벨 표시율 = 0%
* Tooltip correctness: tooltip 값이 패널 계산 값과 일치

### 8.4 Comparison UX Metrics

* Top10 table correctness: Right panel Top/Bottom 10이 계산 결과와 100% 일치

---

## 9) Acceptance 기준 (GOAL 목표 / SOFT PASS 허용)

### GOAL

* P95(AR) ≤ 6, MAX(AR) ≤ 12
* P50(MIN) ≥ 18px
* TINY ≤ 15%
* Top10 correctness = 100%
* Overflow/Overlap = 0

### SOFT (PASS)

* P95(AR) ≤ 8, MAX(AR) ≤ 16
* P50(MIN) ≥ 14px
* TINY ≤ 25%
* Top10 correctness = 100%
* Overflow/Overlap = 0

### HARD (WARN-LOW)

* P95(AR) ≤ 10, MAX(AR) ≤ 20
* P50(MIN) ≥ 12px
* TINY ≤ 35%
* Top10 correctness = 100%
* Overflow/Overlap = 0

FAIL

* HARD 미달 또는 Top10 mismatch 또는 Overflow/Overlap 발생

최종 정책:

* 자동 루프는 **SOFT 이상이면 PASS로 종료**
* UI에는 GOAL/SOFT/HARD/FAIL을 모두 표시(OK/WARN/FAIL)

---

## 10) 자동 튜닝(fallback ladder, 케이스별)

케이스 조합:

* Root 2 × Size 4 × Color 2 = 16 cases

skew 판정:

* skew_ratio = p99 / max(p50,1)

  * <20: areaScale none
  * 20~100: areaScale sqrt
  * ≥100: areaScale log1p

### Step 0 (Baseline)

* areaScale = skew 판정 결과
* leafDepth=6
* visibleMin=8
* childrenVisibleMin=8
* grouping off (leaf ≤ 250이면)

### Step 1 (visibleMin 강화)

* visibleMin=10, childrenVisibleMin=10

### Step 2 (TopN+Other)

* leafCap=250, topN=200
* visibleMin=12, childrenVisibleMin=12

### Step 3 (강화 + depth 컷)

* leafCap=150, topN=120
* leafDepth=5
* visibleMin=14, childrenVisibleMin=14

### Step 3b (조건부 leafDepth=4)

* 조건: TINY>35% 또는 P50(MIN)<12 → leafDepth=4

전체 FAIL 조건:

* Step 3b까지 적용해도 FAIL인 케이스가 10% 초과 → “ECharts 한계”로 리포트에 표시

---

## 11) ECharts 옵션 고정(색/그라데이션 금지 포함)

### 11.1 baseOption 필수 구조

* series:

  * type=treemap, nodeClick=zoomToNode, sort=desc
  * visibleMin/childrenVisibleMin/leafDepth/levels
  * emphasis: border만 변경, color 변경 금지
* visualMap:

  * type=continuous, min=0, max=100
  * diverging palette(빨강↔초록)
  * dimension은 `colorValue`를 참조하도록 고정

### 11.2 levels 템플릿(레이아웃만)

* L1~L3: borderWidth 2, gapWidth 2, upperLabel.show=true
* L4~L6: borderWidth 1, gapWidth 1, upperLabel.show=false
* levels에서 색상 관련 옵션은 넣지 않는다.

---

## 12) 2-pass 라벨 파이프라인(표준)

* Pass 1: 라벨 최소/오프 → 렌더 → leaf rect 수집 → minSide 계산
* Pass 2: leaf data에 `__minSide` 주입 → label.formatter가 __minSide 규칙으로 최종 라벨 출력

---

## 13) Debug Hook(테스트/자동화 필수)

`window.__TREEMAP_DEBUG__` 제공(고정):

* `chart`
* `getCase()`
* `getLeafLayouts()` → [{x,y,w,h,name,level,actualValue,colorValue,isOther,path}]
* `getTopBottom(level,n)` → 계산 결과
* `lastRenderAt`

Leaf rect 추출:

* Path A: seriesModel.getData().getItemLayout(i)
* Path B: render 시점 캐시 `leafLayoutsCache`

---

## 14) 자동 검증/리포트(Playwright, chromium 고정)

### 14.1 파일 구조(고정 제안)

* `treemap_tuning.json` (노브 저장)
* `dashboard_demo/js/advanced_treemap.js` (렌더/튜닝 적용/디버그 훅)
* `tests/treemap/quality_runner.spec.ts`
* `tests/treemap/quality_metrics.ts`
* `tests/treemap/quality_report.ts`
* `reports/treemap_quality_report.json`
* `reports/treemap_quality_report.md`
* `reports/screenshots/*.png` (옵션)

### 14.2 리포트 JSON 스키마(고정)

* case별:

  * rootMode/sizeMetric/colorMetric
  * final knobs(areaScale/topN/leafCap/leafDepth/visibleMin)
  * metrics(p95_ar/max_ar/p50_min/tiny_ratio/overflow/overlap)
  * acceptance(GOAL/SOFT/HARD/FAIL)
  * fail_reason / recommended_action
* summary:

  * soft_pass 이상 비율
  * fail 비율
  * overall_pass(bool)

---

## 15) One-click Autopilot 실행(사용자 1회 실행)

### 15.1 명령(고정)

* `npm run autopilot:treemap`

### 15.2 동작(고정)

1. tuning.json 로드(없으면 기본값 생성)
2. dev server 실행/확인
3. 16 케이스 순회:

   * UI로 Root/Size/Color 설정
   * 2-pass 렌더 완료 대기
   * 품질 측정
   * FAIL이면 fallback ladder 적용(노브 업데이트) 후 재측정
4. 모든 케이스가 SOFT 이상이면 종료(PASS)
5. reports + screenshots 저장
6. 최종 tuning.json 저장(다음부터 더 빠르게 PASS)

---

## 16) 구현 금지/주의사항(정확도 확보)

* 색상은 visualMap만. data/levels/emphasis에서 색 변경 금지.
* border/gap 두께는 px 고정 값만 사용(비율/반응형으로 border 굵기 바꾸지 않음)
* CSS zoom 금지
* canvas/컨테이너에 filter/opacity/mix-blend-mode 금지
* dropdown이 화면 밖으로 나가면 FAIL(overflow-0)

---

## 17) Deliverables(최종 산출물)

* Advanced 페이지 UI/treemap 완성(One-screen)
* tuning knobs 파일
* Playwright 품질검사
* autopilot 명령(한 번 실행)
* reports(json/md) + 스크린샷

---

## 18) Cursor AI 작업 지시(실행형)

* 기존 Advanced treemap 구현을 유지하되, v5 스펙에 맞게:

  1. UI 레이아웃(Top/Canvas/Right) 고정 및 overflow/overlap 0 달성
  2. Root Mode 2종 hierarchy 재집계 구현
  3. Size/Color metric 전환 구현(4×2)
  4. visualMap diverging 고정(색상 단일 책임) + 색상 금지 규칙 준수
  5. 2-pass 라벨 파이프라인 구현(__minSide 기반)
  6. Right panel Top/Bottom 표 구현(정렬 기준 actualValue, 계산 일치 100%)
  7. window.**TREEMAP_DEBUG** 제공(leaf rect/케이스/TopBottom)
  8. Playwright 품질검사(지표+acceptance+리포트+스크린샷)
  9. autopilot 스크립트 구현(FAIL 케이스 fallback ladder 자동 적용, SOFT PASS 시 종료)
  10. Chrome 기준으로만 최적화/테스트

---

## 19) 단계별 수행 및 스크린샷 평가(실행형)

* **순서**: 1단계 → 기준 검증(테스트/스크린샷) → 만족 시 다음 단계, 불만족 시 수정 후 재평가 → 완벽 종료까지 반복.
* **1단계**: UI 레이아웃(Top 56px, Right 360px, Canvas padding 12px) + overflow/overlap 0 → `npm run test -- tests/treemap/treemap-header-layout.spec.ts` 및 `dashboard_tier_evaluation.spec.ts` B1/B3.
* **2단계**: Root Mode 2종 + Size 4×Color 2 전환 → Preset/컨트롤 존재 테스트로 검증.
* **3단계**: visualMap diverging(빨강↔초록) + data/levels 색상 금지 → A3 범례 테스트, 시각 확인.
* **4단계**: 2-pass 라벨(__minSide 44/28/18) + Right Panel Top/Bottom actualValue 정렬 → 품질 배지·패널 표시 테스트.
* **5단계**: __TREEMAP_DEBUG__ + Playwright 품질검사 + autopilot → `npm run autopilot:treemap` 한 번 실행으로 전체 검증·리포트 생성. FAIL >10% 시 리포트 참고 후 fallback 튜닝.
* **스크린샷**: `npm run test:screenshot` 후 `reports/screenshots/` 확인하여 시각 기준 만족 여부 판단.

---