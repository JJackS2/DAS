# finviz-like-treemap 테스트 규칙

대시보드(finviz-like-treemap)에 대한 E2E 테스트 실행 방법, 검증 항목, 선택자/계약을 정의합니다.

---

## 1. 테스트 위치 및 러너

- **위치**: 저장소 루트 `tests/treemap/`
- **러너**: Playwright (`@playwright/test`). Chromium 사용.
- **실행** (프로젝트 루트 `c:\workspace\DAS`):
  - `npm run test` — 전체 Playwright 테스트
  - `npm run test:treemap-quality` — 트리맵 품질 테스트 (조합 순회 + 리포트)
  - `npm run test:treemap-quality:ci` — CI용 (재시도 1회, 서버 매번 기동)

---

## 2. 서버 및 URL

- **baseURL**: `process.env.TREEMAP_BASE_URL || 'http://127.0.0.1:3000'`
- **자동 기동**: `TREEMAP_BASE_URL` 미설정 시 `npm run build:dashboard` 후 `npx serve finviz-like-treemap/web/dist -l 3000` 실행.
- **수동**: `npm run build:dashboard` → `npm run serve` 후 `TREEMAP_BASE_URL` 없이 테스트 실행 시 기동된 서버 재사용.
- **데이터 API (품질/리프 테스트용)**: 트리맵에 노드가 그려지려면 데이터가 필요함. `finviz-like-treemap/server`를 **8787**에서 기동하면 프론트가 `GET http://localhost:8787/data`로 데이터를 가져옴. 품질 테스트(`test:treemap-quality`) 및 리프 레이아웃 수집이 제대로 되려면 서버 기동 권장.
  - 기동: `cd finviz-like-treemap/server && npm run start`
  - (선택) 더미 생성: `npm run gen`

---

## 3. 검증 항목 요약

| 구분 | 내용 |
|------|------|
| **품질(quality_runner)** | Axis × Size × Color 조합별 트리맵 렌더 후 `getLeafLayouts()`로 레이아웃 수집 → AR/MIN/TINY 지표 → GOAL·SOFT·HARD·FAIL 판정, 리포트 저장. |
| **헤더 레이아웃(treemap-header-layout)** | 헤더 가로 오버플로우 없음, 제목·버튼 가시성 및 폰트 9px 이상, 컨트롤 존재, Preset 버튼 한 줄 유지. |
| **대시보드 티어(dashboard_tier_evaluation)** | 색상 범례, 가로 오버플로우, 우측 패널, roam, 설명 문장, 품질 배지 등 (선택 항목). |

---

## 4. 앱이 제공해야 하는 계약

테스트가 통과하려면 대시보드가 아래를 만족해야 합니다.

- **트리맵 컨테이너**: `id="treemap-container"` 또는 `[data-testid="treemap-container"]`로 트리맵 영역 식별 가능.
- **메인 영역**: `id="main-dashboard"` 또는 동일 역할 선택자. 헤더/컨트롤이 이 안에 있음.
- **헤더/컨트롤**:
  - Axis: Geo / Product 선택 가능 (예: `[data-testid="axis-geo"]`, `[data-testid="axis-product"]` 또는 버튼 텍스트).
  - Size / Color: 선택 가능한 버튼 또는 select.
  - Back 버튼.
- **품질 테스트용** (quality_runner):
  - `window.__TREEMAP_DEBUG__.getLeafLayouts()`가 `{ x, y, w, h }[]` 배열 반환 (리프 노드 레이아웃).
  - 트리맵 렌더 완료 후에만 호출 (렌더 대기 후 수집).

---

## 5. 선택자 규칙

- **우선순위**: `data-testid` > `id` > 역할/텍스트.
- **변경 시**: DEVELOPMENT_RULES.md §5 및 본 문서 §4를 함께 수정하고, 테스트 스펙에서 선택자 업데이트 후 재수행.

---

## 6. 반복 절차

1. **테스트 수행** → `npm run test` 또는 `npm run test:treemap-quality`.
2. **실패 분석** → 실패한 스펙·에러 메시지 확인.
3. **원인 반영** → 앱 수정 또는 테스트 규칙/선택자 수정.
4. **문서 업데이트** → DEVELOPMENT_RULES.md / TEST_RULES.md 반영.
5. **테스트 재수행** → 1로 돌아가 통과할 때까지 반복.

---

## 7. 참고

- **품질 러너**: 12조합(axis × size × color) 순회, 조합당 리프 레이아웃 대기 4초. 테스트 타임아웃 180초. 데이터 API(8787) 미기동 시 리프가 없어 모든 조합이 빈 레이아웃이면 `noData`로 통과 처리.
- **Preset**: `#adv-preset-region-sales`는 DOM 존재만 검사(visibility 불필요).
