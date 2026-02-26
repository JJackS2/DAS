# 탑티어 대시보드 평가 항목 및 반복 검증 가이드

## 1. 평가 항목 (전세계 탑티어 수준 기준)

### A. 정보 계층 및 가독성 (Information Hierarchy & Clarity)
| 항목 | 기준 | 배점 | 비고 |
|------|------|------|------|
| A1 | 계층 레이블(Global, 지역/제품군, 법인 등)이 모든 레벨에서 식별 가능 | 15 | upperLabel/breadcrumb |
| A2 | 박스 내 제품명·수치가 잘리지 않고 최소한 약어/숫자로 표시 | 15 | 작은 박스도 이름 또는 % |
| A3 | 색상 범례가 메트릭(0~100%)을 명확히 전달 | 5 | 우하단, 최소 규모 |

### B. 시각적 설계 (Visual Design)
| 항목 | 기준 | 배점 | 비고 |
|------|------|------|------|
| B1 | 한 화면 내 가로/세로 오버플로우 없음 | 10 | scrollWidth ≤ clientWidth |
| B2 | 상단 컨트롤 바가 주어진 높이 내에서 줄바꿈·폰트 조절로 수용 | 10 | 48px 내, wrap |
| B3 | 트리맵이 사용 가능한 캔버스 영역을 최대한 사용 | 10 | main 확장, 필터 제거 시 |

### C. 상호작용 (Interactivity)
| 항목 | 기준 | 배점 | 비고 |
|------|------|------|------|
| C1 | 휠 스크롤(확대/축소) 정상 동작 | 10 | roam: true |
| C2 | 노드 클릭 시 줌인, breadcrumb 클릭 시 줌아웃 | 5 | zoomToNode |
| C3 | 컨트롤(Root Mode, Size, Color, Preset) 변경 시 즉시 반영 | 5 | 재렌더 |

### D. 데이터 및 설명 (Data & Narrative)
| 항목 | 기준 | 배점 | 비고 |
|------|------|------|------|
| D1 | 연결률·설치률 수치가 색상 구간(저~고)에 다양하게 분포 | 5 | 데이터셋 조정 |
| D2 | 좌측 서술형 설명으로 "가장 큰 항목"을 문장으로 안내 | 5 | 개조식 지양 |

### E. 자동 검증 및 품질 (Automation & Quality)
| 항목 | 기준 | 배점 | 비고 |
|------|------|------|------|
| E1 | 품질 지표(AR, MIN, TINY) 자동 계산 및 배지 표시 | 3 | GOAL/SOFT/HARD/FAIL |
| E2 | Playwright로 레이아웃·품질 검증 자동화 | 2 | test:treemap-quality |

**총 배점: 100**

---

## 2. 현재 상태 평가 (초기 스코어카드)

| 영역 | 항목 | 달성 | 점수 | 조치 |
|------|------|------|------|------|
| A | A1 계층 레이블 | △ | 8/15 | upperLabel L1~L5 활성, 폰트 확대·대비 강화 |
| A | A2 박스 내 제품명 | △ | 7/15 | 작은 박스 라벨 폰트·줄임 처리 강화 |
| A | A3 색상 범례 | ○ | 5/5 | 우하단 미니 범례 적용 |
| B | B1 오버플로우 없음 | ○ | 10/10 | view-advanced 시 우측 제거 |
| B | B2 상단 바 레이아웃 | ○ | 10/10 | wrap, 폰트 11px |
| B | B3 트리맵 영역 최대화 | ○ | 10/10 | Advanced에서 필터 제거·확대 |
| C | C1 휠 스크롤 | ○ | 10/10 | roam: true |
| C | C2 클릭 줌 | ○ | 5/5 | zoomToNode |
| C | C3 컨트롤 반영 | ○ | 5/5 | 변경 시 renderTreemapV4 |
| D | D1 데이터 다양화 | ○ | 5/5 | 연결률 20~95% 분포 |
| D | D2 서술형 설명 | △ | 3/5 | 문장 다듬기·컨텍스트 반영 |
| E | E1 품질 배지 | ○ | 3/3 | 적용 |
| E | E2 자동 테스트 | ○ | 2/2 | quality_runner, header layout |

**총점 목표: 90+ (탑티어)** · **보완 후 목표: 90+**

(보완 내용: A1 upperLabel 배경·패딩, A2 라벨 shortenName·작은 박스 % 표시, D2 Root Mode별 서술형 문장)

---

## 3. 부족 항목 보완 설계

- **A1**: levels 상위 레벨 upperLabel에 backgroundColor·padding 추가, fontSize 10 이상 유지.
- **A2**: 라벨 formatter에서 minSide 구간별 rich 스타일(fontSize 8~12) 적용, 작은 박스는 이름 6자+… 또는 %만 표시.
- **D2**: Root Mode에 따라 문장 구성(Region-first: "지역 기준으로 동아시아가 가장 큽니다." / Product-first: "제품군 기준으로 Living이 가장 큽니다.").

---

## 4. 스크린샷 반복 검증 체크리스트

매 수정 후 아래 순서로 스크린샷을 촬영하고 체크한다.

1. **Advanced 진입 직후**
   - [ ] 상단 바 가로 스크롤 없음
   - [ ] 트리맵이 메인 영역 대부분 채움
   - [ ] 좌측 하단에 서술형 설명 2~3문장
   - [ ] 우하단에 세로 색상 범례(0%~100%)

2. **Region-first + sales_count**
   - [ ] "Global" 및 최상위 지역명(동아시아, 북미 등) 보임
   - [ ] 중간 레벨(법인/제품군) 상단 라벨 보임

3. **Product-first + sales_count**
   - [ ] "Global" 및 Living, Air, Kitchen 등 보임
   - [ ] 대부분의 박스에 제품명 또는 % 표시

4. **휠 스크롤**
   - [ ] 휠 다운 시 확대, 휠 업 시 축소

5. **노드 클릭**
   - [ ] 클릭 시 해당 영역으로 줌인
   - [ ] breadcrumb로 상위 이동 가능

---

## 5. 테스트 명령

```bash
# 품질 + 헤더 레이아웃 + 탑티어 평가
npm run test:treemap-quality
npm run test -- tests/treemap/treemap-header-layout.spec.ts
npm run test -- tests/treemap/dashboard_tier_evaluation.spec.ts

# 한 번에 실행
npm run test -- tests/treemap/
```

**스크린샷 저장(반복 검증용):**

```bash
# Windows (PowerShell)
$env:CAPTURE_SCREENSHOTS="1"; npm run test -- tests/treemap/dashboard_tier_evaluation.spec.ts --grep "screenshot"

# 결과: reports/screenshots/advanced-treemap.png
```

수정 후 1) 위 테스트 실행 → 2) 스크린샷 촬영 → 3) 체크리스트(섹션 4)로 확인 → 4) 부족 시 설계·코드 수정 후 반복.
