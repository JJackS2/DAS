# DAS

DAS 루트 저장소. 하위 프로젝트별로 폴더가 분리되어 있으며, **각 폴더마다 독립적인 `.cursor`** 를 사용합니다.

## 폴더 구조

| 폴더 | 설명 |
|------|------|
| **sros-analysis** | 기존 분석 프로젝트. `analysis`(설계·예시·문서) + 자체 `.cursor`(rules, skills, subagents). |
| **dashboard_demo** | 대시보드 프로젝트. Connection Conversion 명세용 자체 `.cursor`(rules) + `agent.md`. |

## .cursor를 독립적으로 쓰는 방법

- **루트(DAS)에는 `.cursor`가 없습니다.** 프로젝트별 규칙이 섞이지 않도록 제거해 두었습니다.
- **분석 작업 시:** `sros-analysis` 폴더를 Cursor **워크스페이스로 열기** → `sros-analysis/.cursor` 적용 (SROS Kernel, 통계 엔진 등).
- **대시보드 작업 시:** `dashboard_demo` 폴더를 Cursor **워크스페이스로 열기** → `dashboard_demo/.cursor` 적용 (Connection Conversion 체크리스트·레이아웃 가드 등).

같은 리포지토리 안에서 프로젝트만 바꿔 가며 쓸 때는, 열어 둔 워크스페이스를 해당 하위 폴더로 바꾸면 해당 폴더의 `.cursor`가 적용됩니다.
