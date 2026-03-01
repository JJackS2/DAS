# DAS 프로젝트 Cursor 설정

규칙(Rules)과 스킬(Skills)을 **분리 저장**하며, 규칙에서 사용할 스킬을 명시한다.

- **Cursor 사용 효율 가이드**(100+ 항목, 카테고리별): [docs/CURSOR_EFFICIENCY_GUIDE.md](../docs/CURSOR_EFFICIENCY_GUIDE.md)
- **프로젝트 개발·테스트 가이드**(리팩터링 전후 비교·사용법): [docs/PROJECT_GUIDE.md](../docs/PROJECT_GUIDE.md)
- **아키텍처·알고리즘**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | **모듈 상세**: [docs/MODULES.md](../docs/MODULES.md)
- **Cursor 적합성 평가 방법·점수**: [docs/CURSOR_SUITABILITY_EVALUATION.md](../docs/CURSOR_SUITABILITY_EVALUATION.md) | [docs/CURSOR_SUITABILITY_SCORE.md](../docs/CURSOR_SUITABILITY_SCORE.md)

---

## 슬래시 명령 (`.cursor/commands/`)

| 명령 파일 | 용도 |
|-----------|------|
| **run-treemap-quality.md** | 트리맵 품질 테스트 실행 (`npm run test:treemap-quality`) |
| **build-and-test-dashboard.md** | 빌드 후 품질 테스트 전체 플로우 |
| **review-and-sync-rules.md** | 변경 후 규칙·문서 동기화 및 테스트 재실행 |

채팅에서 `/` 입력 시 위 명령을 선택해 에이전트에 실행·동기화를 지시할 수 있음.

---

## 워크스페이스

- **DAS.code-workspace**: 멀티루트 워크스페이스(DAS root, Dashboard, Data API, Treemap docs, E2E tests, Project docs). `cursor DAS.code-workspace`로 열면 에이전트가 여러 폴더를 한 세션에서 편집 가능.

---

## 규칙 (Rules) — `.cursor/rules/`

**역할**: 특정 파일/작업 시 항상 적용할 **준수 사항**과 **어떤 스킬을 쓸지** 안내.

| 파일 | 적용 대상 (globs) | 요약 |
|------|-------------------|------|
| **das-dashboard-spec-and-skills.mdc** | `finviz-like-treemap/docs/**/*.md` | 명세·문서 작업 시 적용 규칙 및 **작업별 사용 스킬** 표 |
| **finviz-treemap-development.mdc** | `finviz-like-treemap/web/**/*`, `finviz-like-treemap/server/**/*` | 앱·서버 개발 규칙 요약, 명세 변경 시 사용 스킬 |
| **finviz-treemap-testing.mdc** | `tests/treemap/**/*` | E2E 테스트 규칙 요약, 품질/논문 반영 시 사용 스킬 |
| **cursor-suitability-indicators.mdc** | `.cursor/**`, `docs/CURSOR_*.md`, `docs/ARCHITECTURE.md`, `docs/MODULES.md`, `AGENTS.md` 등 | **Cursor 적합성 평가 지표**를 만족하도록 유지; 평가 시 스킬 cursor-suitability-evaluation 사용 |

---

## 스킬 (Skills) — `.cursor/skills/`

**역할**: **재사용 가능한 워크플로·절차**. 규칙에서 "이 작업 시 이 스킬 사용"으로 참조됨.

### 세분화된 스킬 (단일 책임)

| 스킬 폴더 | 용도 |
|-----------|------|
| **dashboard-requirements** | 요구사항 수집 (목표, 다차원 구성, 차원 고정/옵션) |
| **data-dimensions-spec** | 데이터 차원 표·고정/옵션 문구 명세 반영 |
| **dashboard-layered-spec** | 레이어 0–4 계층별 명세 작성·갱신 |
| **visualization-technique-selection** | 다차원 데이터에 맞는 시각화 기법 선정 (예: 트리맵) |
| **literature-based-design** | 논문 연대기·REFERENCES·품질 지표 명세 반영 |

### 오케스트레이션 스킬 (전체 워크플로)

| 스킬 폴더 | 용도 |
|-----------|------|
| **visualization-dashboard-spec** | 위 5개 스킬을 순서대로 쓰는 전체 대시보드 명세 워크플로 |
| **cursor-suitability-evaluation** | Cursor 적합성 평가 실행(규칙·스킬·문서·명령·검증 체크 → 점수·등급 → CURSOR_SUITABILITY_SCORE.md 갱신). 평가 **방법이 스킬로 정의**됨 |

---

## 사용 방법

- **명세/문서 작업**: `finviz-like-treemap/docs/` 파일을 열고 작업하면 **das-dashboard-spec-and-skills** 규칙이 적용되며, 규칙 안의 표에 따라 해당 작업에 맞는 스킬을 사용하면 됨.
- **개발**: `finviz-like-treemap/web` 또는 `server` 코드 작업 시 **finviz-treemap-development** 규칙 적용; 명세/차원/기법 변경 시 해당 규칙에 적힌 스킬 참조.
- **테스트**: `tests/treemap/` 작업 시 **finviz-treemap-testing** 규칙 적용; 품질·논문 반영 시 규칙에 적힌 스킬 참조.
- **한 번에 전체 워크플로**: "시각화 대시보드 만들기", "논문 기반 구체화해 줘" 등으로 지시하면 **visualization-dashboard-spec** 스킬이 세부 스킬을 순서대로 호출.
