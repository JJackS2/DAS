# Cursor 적합성 평가 (DAS 프로젝트)

현재 프로젝트가 Cursor에 **얼마나 잘 맞는지**를 정리한 평가입니다. "아주 적합"인가에 대한 결론과, 강점·보완점을 구체적으로 적었습니다.

- **평가 방법·기준·점수**: [CURSOR_SUITABILITY_EVALUATION.md](CURSOR_SUITABILITY_EVALUATION.md) — 평가 영역·세부 항목·점수 산출·등급. **§0**에 “점수 기준이 무엇인지”, “무슨 방법으로 높게 만족하면 잘 만들어진 것으로 보는지” 근거 명시.
- **최신 점수·등급·미달 항목**: [CURSOR_SUITABILITY_SCORE.md](CURSOR_SUITABILITY_SCORE.md) — 영역별 점수, 총점, 개선 권장.
- **아키텍처·알고리즘**: [ARCHITECTURE.md](ARCHITECTURE.md). **모듈 상세**: [MODULES.md](MODULES.md).

### 네 가지 질문에 대한 답

| 질문 | 답 |
|------|----|
| **점수에 대한 기준이 무엇이냐** | 평가 문서 §2의 5개 영역·세부 항목·배점. 출처는 Cursor 공식·Docs·본 프로젝트 효율 가이드의 “제어 가능한” 항목. §0.1에 명시. |
| **무슨 방법으로 해당 점수를 높게 만족하면 잘 만들어졌다고 말하는가** | “잘 만들어진 것”의 정의와 90점 이상을 그렇게 보는 **운영상 기준선**을 평가 문서 §0.2에 적어 두었음. (에이전트가 맥락·워크플로·검증을 갖춘 상태를 90+로 둠.) |
| **평가방법이 스킬로 정의가 된 것이냐** | **예.** `.cursor/skills/cursor-suitability-evaluation` 스킬이 평가 실행 절차(체크리스트→점수→점수 기록)를 정의함. |
| **규칙에 해당 지표를 만족하도록 되어 있는가** | **예.** `.cursor/rules/cursor-suitability-indicators.mdc` 규칙이 “Cursor 적합성 평가 지표를 만족하도록 유지하라”고 하며, 평가 시 **cursor-suitability-evaluation** 스킬 사용을 안내함. |

---

## 결론: **매우 잘 맞는 편. "아주 적합"에 가깝게 만들려면 보완 2–3가지만 적용하면 됨.**

| 구분 | 평가 |
|------|------|
| **전체** | Cursor가 잘 쓰이는 조건(규칙·스킬·명세·테스트·워크플로)을 대부분 갖춤. 이미 "Cursor에 잘 맞는 프로젝트" 수준. |
| **"아주 적합" 여부** | 거의 해당. 다만 **.cursorignore 미적용**, **앱 코드가 TypeScript가 아님**, **검증 가능한 목표(타입/린트)** 보강 시 더 좋음. |

---

## Cursor에 잘 맞는 점 (강점)

### 1. 규칙·스킬·명령이 정리되어 있음

- **규칙**: `.cursor/rules/` 에 3개(.mdc), **파일 패턴(globs)** 으로 명세/개발/테스트 구분, **작업별 사용 스킬** 표로 명시.
- **스킬**: 6개(요구사항·차원·레이어 명세·기법 선정·논문·오케스트레이션). 규칙에서 "이 작업 시 이 스킬" 참조.
- **슬래시 명령**: `.cursor/commands/` 에 테스트·빌드·규칙 동기화 3종. `/` 로 반복 워크플로 지시 가능.

→ Cursor 가이드에서 권하는 **Rules + Skills + Commands** 구조를 이미 따르고 있어, **에이전트가 프로젝트 규칙을 알고 행동하기 좋음.**

### 2. “검증 가능한 목표”가 있음

- **E2E 테스트**: Playwright, `npm run test:treemap-quality`, `build-and-test`.
- **앱–테스트 계약**: `id="treemap-container"`, `data-testid`, `__TREEMAP_DEBUG__.getLeafLayouts()` 등 문서화(DEVELOPMENT_RULES, TEST_RULES).
- **명세**: 00_SPECIFICATION_LAYERED, REFERENCES 등으로 “무엇이 맞는 구현인지” 판단 근거가 있음.

→ Cursor 블로그에서 말하는 **“에이전트는 검증 가능한 목표가 있을 때 가장 잘 동작한다”** 에 맞는 편.

### 3. 워크스페이스·문서로 컨텍스트 제공이 잘 됨

- **DAS.code-workspace**: 멀티루트(루트, web, server, treemap docs, tests, project docs). 에이전트가 한 세션에서 여러 영역 편집 가능.
- **search.exclude**: node_modules, dist, build, coverage, reports 등 제외로, 검색·인덱싱 노이즈 감소.
- **문서**: PROJECT_GUIDE, CURSOR_EFFICIENCY_GUIDE, DEVELOPMENT_RULES, TEST_RULES, .cursor/README 등으로 “어디를 보면 되는지”가 명확함.

→ **컨텍스트를 주었을 때 Cursor가 더 정확하게 동작한다**는 점과 잘 맞음.

### 4. 도메인 워크플로가 스킬로 패키징됨

- 시각화 대시보드 명세(요구사항 → 차원 → 레이어 → 기법 → 논문)가 **visualization-dashboard-spec** 와 세부 스킬로 정의됨.
- “시각화 대시보드 만들기”, “논문 기반 구체화” 같은 지시만으로 동일 절차 반복 가능.

→ **도메인 특화 워크플로**를 Cursor가 재사용하기 좋은 형태로 갖춤.

---

## “아주 적합”까지 가려면 보완하면 좋은 점

### 1. .cursorignore 적용 (인덱싱·성능)

- **현재**: 루트에 `.cursorignore` 없음. PROJECT_GUIDE에 “권장 템플릿”만 있고 수동 추가 안내.
- **영향**: node_modules·dist·build·reports 등이 인덱싱/검색되면 속도·정확도가 떨어질 수 있음.
- **보완**: 루트에 `.cursorignore` 생성 후, PROJECT_GUIDE §2.3 템플릿 내용 적용.  
→ 이거 하나만 해도 **Cursor에 아주 적합한 쪽**에 더 가까워짐.

### 2. 앱 코드가 JavaScript만 사용 (타입·린트 신호)

- **현재**: finviz-like-treemap/web 은 **JS/JSX** (TypeScript 아님). 테스트는 TypeScript.
- **Cursor 관점**: “타입·린터·테스트로 올바름을 알려 주는 프로젝트”가 에이전트 품질에 유리하다고 안내함.
- **보완(선택)**:
  - 점진적 **TypeScript 도입**(예: `api.js` → `api.ts`, JSDoc 타입부터 적용) 또는
  - **ESLint** 등 린트 규칙을 명시하고, 규칙/스킬에 “변경 후 린트 실행”을 넣기.  
→ 필수는 아니지만 하면 **“아주 적합”** 평가가 더 설득력 있음.

### 3. 루트 레벨 “한 줄 맥락” (선택)

- **현재**: 규칙은 모두 `.cursor/rules/` 의 파일 패턴으로 적용. 루트에 `.cursorrules` 또는 `AGENTS.md` 는 없음.
- **보완(선택)**: 루트에 `AGENTS.md` 한 페이지로 “이 저장소는 DAS이며, 메인은 finviz-like-treemap BI 대시보드. 규칙·스킬은 .cursor/ 참고.” 정도만 적어 두면, 저장소만 열었을 때도 에이전트가 맥락을 잡기 조금 더 수월함.

---

## 상세 사용을 위한 구성 여부 및 내부 품질

- **구성 여부**: [CURSOR_SUITABILITY_EVALUATION.md](CURSOR_SUITABILITY_EVALUATION.md) §2의 5개 영역(규칙·스킬·문서·명령·검증)에 따라 체크리스트로 확인. 최신 결과는 [CURSOR_SUITABILITY_SCORE.md](CURSOR_SUITABILITY_SCORE.md)의 “구성 여부 요약” 표 참고.
- **내부 품질 평가**: 동일 평가서의 세부 항목(globs·스킬 명시·description 품질·단일 책임·아키텍처·모듈 설명·알고리즘·계약 등)으로 “상세하게 사용하기에 충분한지” 판단. 점수 90+ 이면 “아주 적합” 수준으로 작성된 것으로 간주.
- **평가 방법**: 수동 체크리스트(§4.1) + 영역별 점수 부여(§3) + 등급(§3). 정기 재평가 권장.

## 요약 표

| 항목 | 상태 | 비고 |
|------|------|------|
| 규칙(Rules) | ✅ 잘 갖춤 | 3개, globs·스킬 명시 |
| 스킬(Skills) | ✅ 잘 갖춤 | 6개, 오케스트레이션 포함 |
| 슬래시 명령 | ✅ 잘 갖춤 | 3개 |
| 워크스페이스 | ✅ 적용됨 | DAS.code-workspace, search.exclude |
| 명세·계약 문서 | ✅ 잘 갖춤 | DEVELOPMENT_RULES, TEST_RULES, 명세 |
| 아키텍처·알고리즘·모듈 문서 | ✅ 구성됨 | ARCHITECTURE.md, MODULES.md |
| 평가 방법·점수 | ✅ 구성됨 | CURSOR_SUITABILITY_EVALUATION, CURSOR_SUITABILITY_SCORE |
| E2E·검증 가능 목표 | ✅ 잘 갖춤 | Playwright, build-and-test |
| 루트 맥락(AGENTS.md) | ✅ 구성됨 | 프로젝트·규칙·문서 경로 안내 |
| .cursorignore | ⚠️ 미적용 | 수동 추가 권장 |
| 타입/린트 신호 | ⚠️ 선택 보강 | TS 또는 ESLint 명시 |

---

## 한 문장 답변

- **“현재 프로젝트가 Cursor에 아주 적합한가?”**  
  → **이미 Cursor에 매우 잘 맞는 편이고, .cursorignore 적용과 (원하면) 타입/린트·루트 맥락만 보완하면 “아주 적합”이라고 보기 좋은 수준입니다.**
