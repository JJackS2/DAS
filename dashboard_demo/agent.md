# Cursor AI Prompt — Connection Conversion Monitoring Dashboard (v10.4)

**우선순위:** 구현·레이아웃·테마는 **.cursor/rules/dashboard-connection-conversion.mdc (통합 규칙)** 을 우선 적용한다. 이 문서와 충돌 시 통합 규칙이 우선이다.

## 목적
“빈 화면/컨텐츠 미작성” 문제를 절대 발생시키지 않도록,
파일/영역을 명확히 분할(단, 배포는 단일 HTML)하고,
각 영역별로 “필수 DOM + 렌더 함수 + 데이터 연결”을 강제한다.
레이아웃 가드/체크리스트까지 포함한 릴리즈를 발행한다.
목적·차원·UX(글로벌/지역/법인/국가, 제품군/제품, 3초 반응, 설명·색상 안내)는 docs/DASHBOARD_GOALS.md 참조.

## 문서 역할 및 인덱스 (제약: 이 구분을 지켜 참조할 것)

- **목적·차원·UX 목표**(글로벌/지역/법인/국가, 제품군/제품 KPI, 사용자 이해 용이, 3초 반응, 설명 제공, 차트 색상 변화 등) → **docs/DASHBOARD_GOALS.md** 참조. "대시보드가 왜 필요한지", "어떤 차원을 다루는지", "UX 목표가 뭔지" 질의·설계 시 **GOALS만** 읽으면 된다.
- **구현·제약·체크리스트**(배포 제약, 섹션 분할, 필수 DOM, R1~R7, L1~L5, Render Guard 등) → **본 문서(agent.md)**. 코드 수정·검증·릴리즈 체크 시 **본 문서만** 적용하면 된다.
- **파일 길이로 인한 잘못된 결과 방지:** 목적/설계 질의 시 GOALS.md, 구현/검증 지시 시 agent.md를 구분해 참조하도록 .cursor 규칙에 명시되어 있다.

---

## INPUT
- 수정 대상: 프로젝트 내 index.html (또는 /mnt/data/test.html)

## 배포 제약 (절대)
- 최종 산출물은 단일 HTML 1개 파일만 허용.
- 단, 내부적으로는 “섹션 분할”을 강제한다:
  - (A) HTML 영역 분할 주석
  - (B) JS 모듈 유사 구조(IIFE/객체)로 기능을 분할
  - (C) 각 모듈은 반드시 render()를 가지고, init()에서 호출되어야 한다.
- 외부 CDN/라이브러리 금지.
- 로컬 file:// 실행 가능해야 함.

---

# 0) 지금 발생한 문제 정의 (반드시 해결)
문제: “대시보드 영역 내 차트 구성/필터 구성 등 컨텐츠가 하나도 작성되지 않는다”
원인 후보(반드시 방지):
- (F1) DOM id 변경/불일치로 render가 실패
- (F2) renderAll() 호출 누락 또는 초기화 순서 오류
- (F3) CSS overflow/height/hidden 때문에 화면에 안 보임
- (F4) JS 에러로 스크립트 중단 (콘솔 에러)
- (F5) Chart SVG가 생성되었지만 width/height=0
- (F6) 모듈 일부만 붙여넣고 “데이터/로직”이 빠짐

해결 원칙(필수):
- “렌더 가드(Render Guard)”를 추가하여,
  초기 렌더 이후 필수 영역이 비어있으면 즉시 화면에 에러 배너 표시 + self-check FAIL.
- 각 영역별로 “필수 DOM 존재”와 “필수 렌더 결과 존재”를 체크한다.

---

# 1) 파일/영역 분할 규칙 (단일 HTML 내부 분할)
아래 주석 구획을 정확히 유지/추가하고, 각 구획별로 코드를 넣어라.
(기존 코드가 있으면 해당 위치로 이동/정리)

[HTML]
<!-- =========================
  SECTION: HEAD (META/CSS)
========================= -->

<!-- =========================
  SECTION: APP SHELL (LAYOUT)
  - left nav
  - topbar
  - main viewport
  - right filters
  - pivot drawer + mask
  - popover + toast
========================= -->

<!-- =========================
  SECTION: TEMPLATES / PLACEHOLDERS
  - empty state containers
  - skeletons
========================= -->

[JS]
<!-- =========================
  SECTION: JS CORE (UTILS/STATE/CACHE)
========================= -->

<!-- =========================
  SECTION: JS DATA (FACT GENERATION OR DATA ADAPTER)
========================= -->

<!-- =========================
  SECTION: JS MODULE: LAYOUT_GUARDS
  - L1~L5
  - measurement + toast + banner
========================= -->

<!-- =========================
  SECTION: JS MODULE: CONTROLS (SELECTS/SEGS/SEARCH)
========================= -->

<!-- =========================
  SECTION: JS MODULE: METRICS (KPI + breakdown + cohort + pivot)
========================= -->

<!-- =========================
  SECTION: JS MODULE: CHARTS (SVG rendering)
========================= -->

<!-- =========================
  SECTION: JS MODULE: RENDER (renderAll orchestration)
========================= -->

<!-- =========================
  SECTION: JS MODULE: SELF_CHECK (R1~R7 + L1~L5 + Render Guard)
========================= -->

<!-- =========================
  SECTION: JS INIT (boot sequence)
========================= -->

---

# 2) “영역별 필수 컨텐츠” 명세 (빈 화면 방지)
각 영역은 아래 필수 DOM과 렌더 결과를 반드시 가져야 하며,
하나라도 없으면 “Render Guard FAIL”로 간주한다.

## 2.1 Main / Selection 영역
필수 DOM id:
- contextLine
- filterSummary
- chips (최소 3개 chip이 생성되어야 함: Geo/Product/Time)
필수 렌더 결과:
- chips children count >= 3
- contextLine textContent length > 10

## 2.2 KPI Strip
필수 DOM id:
- kpiConnRate, kpiSales, kpiConnected
- kpiSmartConnRate, kpiSmartConnected, kpiSmartSales
- unkPct, unkSales, unkBar
필수 렌더 결과:
- KPI 값이 “—”가 아니어야 함 (숫자/퍼센트 표기)

## 2.3 Monitor / Charts
필수 DOM id:
- cohortSvg
- geoSvg
- prodSvg
- attrSvg (있으면 렌더, 없으면 탭 전환으로 대체 가능)
필수 렌더 결과:
- 각 SVG innerHTML length > 50
- cohortSvg 내 polyline 최소 1개
- geo/prod/attr SVG 내 rect 최소 1개

## 2.4 Filters Panel (Right)
필수 DOM id:
- geoSearch, prodSearch, attrSearch
- geoResults, prodResults, attrResults
필수 렌더 결과:
- collapseBtn 동작
- 검색 입력 시 results box가 표시(display:block) 가능

## 2.5 Pivot Drawer
필수 DOM id:
- pivotDrawer, mask
- pivotTable, pivotInfo
- selfCheckBtn, checkCard, checkList
필수 렌더 결과:
- pivotTable thead/tbody/tfoot가 존재
- totals row 존재
- Self-check 클릭 시 PASS/FAIL 카드 생성

---

# 3) “표기 규칙” (수치/단위, 메트릭별 색상)
## 3.1 모든 차트 데이터 라벨은 단위 포함
- conn_rate / smart_conn_rate: “64.4%” 형태
- sales / connected / smart_sales / smart_connected / unknown_sales: “162,936” 형태
차트 위 또는 막대 위에 표시(최소 1개는 반드시 표시):
- bar top label: formatted metric
- line end label: formatted metric

## 3.2 메트릭별 색상 매핑 (고정)
아래 매핑을 구현하고, 선택한 metric에 따라:
- KPI 강조색
- 막대 fill
- 라인 stroke
가 바뀌어야 한다.

COLOR_MAP:
- conn_rate:        #1428A0 (blue)
- smart_conn_rate:  #7C3AED (violet)
- sales:            #0F766E (teal)
- connected:        #B45309 (amber/brown)
- smart_sales:      #2563EB (indigo-ish)
(색상은 위 hex를 그대로 사용)

구현 규칙:
- state.metric 변경 시 setThemeByMetric(metric)을 호출
- CSS 변수로 적용: --metricColor, --metricColorSoft
- rect fill/stroke는 var(--metricColor) 기반

---

# 4) 클릭 UX 개선 (팝업 반복 피로 해결)
“항상 팝업 질문”을 없애고, 아래 우선순위를 강제한다.

## 4.1 Smart Click Mode (기본)
- 기본 동작: Click = Filter
- Shift+Click = Drill
- DoubleClick = Drill
- 우측 상단에 힌트 텍스트: “Click: Filter · Shift/Double: Drill”
- Popover는 “도움말 버튼(?)” 또는 “첫 1회만” 표시 옵션으로 제한한다.

## 4.2 선택지 제공 (필수)
Click mode select는 반드시 3개 옵션 제공:
- Smart (Click=Filter, Shift/Double=Drill)  [DEFAULT]
- Filter only
- Drill only
그리고 Smart가 선택되면 팝업을 띄우지 않는다.

---

# 5) 레이아웃 “깨짐 방지” 조건(요구)
아래 조건을 코드에 “명시적 체크”로 요구(런타임 측정):
- C1: body/documentElement에 수평 스크롤 금지
- C2: topbar와 main이 overlap 금지
- C3: main viewport가 height=0이 되면 FAIL
- C4: right panel collapse/expand 후에도 C1~C3 유지
- C5: 각 panel의 min-height:0 적용 확인 (overflow hidden으로 컨텐츠 삭제 금지)

FAIL 시 동작:
- 화면 상단에 빨간 “LAYOUT/RENDER FAIL” 배너 표시(닫기 불가)
- toast에도 오류 표시
- self-check에 FAIL 기록

---

# 6) 구현 강제 방식(매우 중요)
Cursor는 “섹션별로 쪼개다가 일부를 누락”하는 실수를 자주 한다.
이를 방지하기 위해 아래를 강제한다.

## 6.1 renderAll() 단일 오케스트레이터 강제
- renderAll()은 반드시 아래 순서로 호출:
  1) Controls.render()
  2) KPI.render()
  3) Charts.renderAll()
  4) Pivot.renderIfOpenOrAlways()
  5) Guards.runAll()
  6) RenderGuard.assertAll()
- init()에서 renderAll()을 반드시 1회 호출하고,
  이벤트 핸들러에서 상태 변경 시 renderAll() 재호출

## 6.2 “DOM ID 계약” 강제
- 모든 DOM id는 상단에 const DOM = { ... }로 선언
- querySelector 실패 시 즉시 throw 하지 말고,
  RenderGuard에 누적 후 FAIL 처리(배너 표시)

## 6.3 “에러 안전 실행” 강제
- window.onerror / unhandledrejection 핸들러 추가
- 에러 발생 시:
  - banner 표시
  - toast 표시
  - self-check FAIL에 기록

---

# 7) 산출물 (필수)
## 7.1 v10.4 단일 HTML 발행
- title: Connection Conversion Monitoring (v10.4)
- 상단에 주석:
  Updated: v10.4 — sectioned modules + render guard + metric theme + smart click + checklist validated

## 7.2 HTML 끝에 “Release Checklist” 주석
- R1~R7 PASS/FAIL
- L1~L5 PASS/FAIL
- Render Guard PASS/FAIL
- Evidence: runtime validated/DOM counts etc.

## 7.3 “Confirmed Prompts Included” 주석
- P1~P5 (이전 확정 프롬프트) 포함 여부
- + 본 문서에서 추가된 확정 프롬프트:
  - P6: Section partition rules
  - P7: Area mandatory content spec
  - P8: Metric theme rules
  - P9: Smart click UX rules
  - P10: Render Guard rules
- 각 프롬프트가 코드의 어느 섹션에 반영됐는지 근거를 남긴다.

---

# 8) 작업 지시 (Cursor에게)
1) /mnt/data/test.html을 열어 현재 컨텐츠 미작성 원인을 먼저 찾는다(F1~F6 중 무엇인지).
2) 위 섹션 분할 규칙대로 코드를 재배치/복구한다.
3) Render Guard + Layout Guards를 구현한다.
4) 수치 라벨(단위 포함)과 metric theme(색상)을 적용한다.
5) Smart click을 기본으로 설정하고 팝업 반복을 제거한다.
6) self-check를 확장해 Render/Guards까지 PASS/FAIL로 표시한다.
7) 최종 파일을 저장하고, HTML 말미에 Release Checklist + Confirmed Prompts 주석을 넣는다.

---

# Acceptance (반드시 만족)
- 페이지를 열었을 때 “빈 화면/차트 없음/칩 없음” 현상이 절대 없어야 한다.
- Charts/KPI/Filters/Pivot이 모두 실제로 렌더된다.
- Self-check에서 최소 항목:
  - DOM 계약 OK
  - KPI not placeholder OK
  - SVG rendered OK
  - No horizontal overflow OK
  - KPI totals == Pivot totals OK
  를 PASS로 만든다.
- 레이아웃이 깨지면 즉시 배너+FAIL로 확인 가능해야 한다.