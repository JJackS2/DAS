# Advanced Treemap 개발 가이드 — 총정리 (단일 문서)

이 문서는 **현재 구현 상태**, **코드와의 매칭**, **테스트 구조**, **누락·불가 항목**을 한곳에 정리한 문서입니다.  
기존 `development_guide_advanced_treemap.md`, `docs/dashboard_tier_evaluation.md` 및 실제 코드·테스트를 기준으로 작성되었습니다.

---

## 1. 현재 상태 요약

### 1.1 구현된 기능

| 영역 | 내용 | 비고 |
|------|------|------|
| **뷰** | Advanced / Overview 전환, Advanced 시 우측 필터 제거 | `#app.view-advanced`, `#right-column` 숨김 |
| **헤더** | Root Mode(Region/Product), Size, Color, Preset, Area Scale, 품질 배지 | Preset 버튼은 `flex-wrap: nowrap`으로 한 줄 고정 |
| **트리맵** | ECharts treemap, 6축 계층, Region-first / Product-first | `renderTreemapV4()` |
| **라벨** | 2-pass: `__minSide` 기반 **제품명 + 숫자(B/M/K) + 비율** 항상 3줄 형식, 비율 소수점 1자리 | `labelFormatter`에서 `fmtCompact` + `toFixed(1)+'%'` |
| **숫자 포맷** | 박스 내: B/G/M/K(`fmtCompact`), 비율: 소수점 1자리 | 1e9→B, 1e6→M, 1e3→K |
| **범례** | Advanced에서는 **ECharts visualMap 1개만** 표시, HTML 범례(`#treemap-legend`) 숨김 | `#app.view-advanced .treemap-legend-mini { display: none }` |
| **설명** | 드래그·리사이즈 가능 팝업(`#treemap-desc-popup`), **접기 시 76×76px(약 2cm)** | `.collapsed` 클래스, `#treemap-desc-toggle` 클릭 |
| **인터랙션** | 노드 클릭 줌인, breadcrumb 줌아웃, 휠 스크롤(roam: true) | ECharts 옵션 |
| **품질** | AR P95, MIN P50, TINY%, fallback ladder(Step 0~4), 배지 OK/WARN/FAIL | `__TREEMAP_DEBUG__`, quality_runner |
| **데이터** | 연결률·설치률 0~100% 분포 조정(smartRatio/connRatio) | `buildRawData()` |

### 1.2 테스트가 여러 번 필요한 이유

테스트는 **목적별로 나뉘어** 있어서, 수정 후에는 아래 세 가지를 모두 돌리는 것이 좋습니다.

| 테스트 | 목적 | 언제 필요 |
|--------|------|-----------|
| **quality_runner.spec.ts** | Root×Size×Color **조합별** 품질 지표(AR, MIN, TINY) 및 fallback 적용 검증 | 레이아웃·튜닝·데이터 변경 시 |
| **treemap-header-layout.spec.ts** | 헤더 **가로 오버플로우 없음**, Preset 버튼 **한 줄 유지**(flex-wrap: nowrap), 컨트롤 존재 여부 | 헤더/ Preset CSS·구조 변경 시 |
| **dashboard_tier_evaluation.spec.ts** | 탑티어 평가 항목(A3 범례 1개, B1/B3 오버플로우, C1 roam, D2 설명, E1 품질 배지) | UI·범례·설명·품질 배지 변경 시 |

- **품질**: 조합이 많아서(2×4×2) 한 번에 여러 케이스를 돌리는 quality_runner가 필요합니다.
- **헤더**: 레이아웃·Preset이 깨지지 않았는지 전용 테스트로 검증합니다.
- **탑티어**: 사용자 관점의 “한 화면에서의 완성도”를 평가 항목대로 검증합니다.

따라서 **코드/스타일 한 번 수정할 때마다** 위 세 스펙을 순서대로 실행하는 것이 권장됩니다.

---

## 2. 파일·코드 매칭

### 2.1 대시보드(프론트)

| 파일 | 역할 | 코드 매칭 |
|------|------|-----------|
| `dashboard_demo/index.html` | Advanced 영역, 헤더(Root/Size/Color/Preset), 트리맵 컨테이너, 설명 팝업, 범례 div | `#main-advanced`, `#adv-rootmode-toggle`, `#adv-preset-*`, `#treemap-desc-popup`, `#treemap-legend` |
| `dashboard_demo/css/dashboard.css` | 헤더·Preset 한 줄 고정, 트리맵·범례·팝업·접기(76px) 스타일 | `.treemap-preset-inline`, `.treemap-preset-btns`(nowrap), `.treemap-desc-popup.collapsed`, `#app.view-advanced .treemap-legend-mini` |
| `dashboard_demo/js/app.js` | 트리맵 v4 렌더, 라벨 포맷터(B/M/K+비율), `fmtCompact`/`fmtNum`/`fmtPct`, `buildRawData`, baseOption(visualMap, levels, breadcrumb), 설명 팝업 드래그/리사이즈/접기 | `renderTreemapV4`, `labelFormatter`, `initTreemapDescPopup`, `__TREEMAP_DEBUG__` |

### 2.2 테스트

| 파일 | 역할 | 검증 내용 |
|------|------|-----------|
| `tests/treemap/quality_runner.spec.ts` | 조합별 품질 + fallback | 케이스 순회, leaf rect, AR/MIN/TINY, 리포트 생성 |
| `tests/treemap/quality_metrics.ts` | 지표 계산 | AR, MIN, TINY, GOAL/SOFT/HARD/FAIL |
| `tests/treemap/quality_report.ts` | 리포트 출력 | JSON/MD, fail_reason, recommended_action |
| `tests/treemap/treemap-header-layout.spec.ts` | 헤더 레이아웃 | 오버플로우 없음, Preset nowrap, 버튼 4개 이상 |
| `tests/treemap/dashboard_tier_evaluation.spec.ts` | 탑티어 평가 | A3 범례 1개(ECharts visualMap), B1/B3, C1 roam, D2 설명, E1 배지 |

### 2.3 문서

| 파일 | 역할 |
|------|------|
| `dashboard_demo/development_guide_advanced_treemap.md` | v4.0~v4.3 설계 명세(요구사항, fallback, 옵션 Diff, 라벨 규칙) |
| `dashboard_demo/docs/dashboard_tier_evaluation.md` | 탑티어 평가 항목, 배점, 스크린샷 체크리스트 |
| `dashboard_demo/DEVELOPMENT_GUIDE_CONSOLIDATED.md` | 본 문서(현재 상태·코드·테스트·누락 총정리) |

---

## 3. 코드와 매칭되는 항목

- **헤더 Preset**: `.treemap-preset-inline` / `.treemap-preset-btns`에 `flex-wrap: nowrap`, Preset 버튼 `flex-shrink: 0` → 테스트: `treemap-header-layout.spec.ts`의 “Preset 버튼 그룹이 한 줄로 유지”.
- **범례 1개**: Advanced에서 HTML 범례 숨김, ECharts `visualMap`만 사용 → 테스트: `dashboard_tier_evaluation.spec.ts`의 A3(visualMap 0~100 존재, HTML 범례 비가시).
- **설명창 접기**: `.treemap-desc-popup.collapsed` 시 76×76px, 토글 `#treemap-desc-toggle` → 문서/체크리스트와 일치.
- **박스 숫자 B/G/M/K**: `fmtCompact` 사용, 1e9→B, 1e6→M, 1e3→K → 라벨 formatter와 일치.
- **비율 소수점 1자리**: `Number(d.colorValue).toFixed(1) + '%'` → 라벨·툴팁 일치.
- **라벨 일관성**: 모든 구간에서 `이름 + '\n' + num + '\n' + pct` (작은 셀은 이름만 shorten) → `labelFormatter`와 일치.
- **품질/디버그**: `__TREEMAP_DEBUG__.getLeafLayouts`, `getTopBottom`, `getCase`, 품질 배지 → quality_runner·탑티어 평가와 연동.

---

## 4. 매칭 안 되는 항목·누락

| 항목 | 문서/가이드 | 현재 코드 | 조치 |
|------|-------------|-----------|------|
| 라벨 “Small/Tiny에서 숨김” | v4.3: `__minSide < 18` → `""` | 현재는 모든 구간에서 3줄(이름+숫자+비율) 표시 | 의도적으로 “항상 세 줄”로 통일함. 문서는 “항상 제품명+숫자+비율” 요구사항에 맞춰 갱신 가능. |
| visualMap 위치 | 가이드 baseOption: `left: "center", bottom: 8` | 실제 옵션은 구현에서 right/bottom 등 다를 수 있음 | ECharts 쪽 옵션과 가이드 스니펫 동기화 필요 시 점검. |
| D2 “좌측 서술형 설명” | 탑티어: “좌측 하단” | 설명은 팝업(`#treemap-desc-popup`)으로 이동, 위치 가변 | 테스트는 `#left-treemap-desc` 가시성·길이로 검증 중. “좌측 고정”이 아닌 “설명 텍스트 존재”로 해석됨. |
| 스크린샷 체크리스트 | dashboard_tier_evaluation.md §4 | 수동 체크리스트 | 자동 테스트로 모두 커버되지는 않음. 수정 후 수동 확인 보완. |

---

## 5. 논리적으로 개발 불가·제한 사항

- **ECharts 라벨 영역**: 셀이 매우 작을 때(minSide 매우 작음) 3줄 전체가 물리적으로 들어가지 않을 수 있음. 이 경우 `overflow: 'truncate'` 등으로 잘리며, “완전히 동일한 픽셀 수준 표시”는 불가에 가깝습니다.
- **품질 FAIL 비율**: 데이터/해상도에 따라 Step 4까지 적용해도 FAIL이 10% 초과할 수 있음. 가이드의 “FAIL 조합 ≤ 10%”는 목표이며, 미달 시 D3 전환 검토 등이 문서화되어 있음.
- **범례 “2개”**: 이전에는 HTML 범례 + ECharts visualMap이 동시에 보일 수 있었음. 현재는 Advanced에서 HTML을 숨겨 **1개만** 보이도록 수정됨.

---

## 6. 테스트 실행 방법

```bash
# 품질(조합별) + 헤더 레이아웃 + 탑티어 평가 한 번에
npm run test -- tests/treemap/

# 개별
npm run test:treemap-quality
npm run test -- tests/treemap/treemap-header-layout.spec.ts
npm run test -- tests/treemap/dashboard_tier_evaluation.spec.ts
```

스크린샷 저장(선택):

```powershell
$env:CAPTURE_SCREENSHOTS="1"; npm run test -- tests/treemap/dashboard_tier_evaluation.spec.ts --grep "screenshot"
```

---

## 7. 수정 후 권장 순서

1. **코드/스타일 수정**
2. **테스트 3종 실행**: `npm run test -- tests/treemap/`
3. **실패 시**: 해당 스펙(quality / header / tier)과 위 매칭 표를 보고 원인 확인
4. **필요 시**: 스크린샷 촬영 후 `dashboard_tier_evaluation.md` 체크리스트로 수동 확인
5. **문서 반영**: 동작이 바뀐 경우 이 총정리 문서나 기존 가이드의 해당 절 업데이트

---

*이 문서는 `development_guide_advanced_treemap.md`, `docs/dashboard_tier_evaluation.md` 및 현재 코드·테스트 기준으로 작성되었으며, 구현 변경 시 함께 갱신하는 것을 권장합니다.*
