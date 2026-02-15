# Analysis — 설계(Design) vs 예시(Examples)

**설계**와 **예시**를 명시적으로 분리합니다.

---

## 구조

| 구분 | 경로 | 설명 |
|------|------|------|
| **설계** | `analysis/design/` | 재현성 명세, 시각화 전략, **템플릿**(02~08, sql). 주제·데이터 무관. |
| **예시** | `analysis/examples/<주제>/` | 특정 주제에 대한 채워진 산출물(01~08, sql). 설계를 적용한 1회 실행. |

- **설계 문서:** `design/README.md`, `design/00_reproducibility_spec.md`, `design/01_visualization_strategy.md`, `design/requirements-analysis.txt`, `design/templates/`
- **예시 실행:** `examples/expansion/` (Samsung 계정 가전 확장)

---

## 새 분석 시작

1. `analysis/design/templates/` 내용을 새 실행 폴더로 복사 (예: `analysis/runs/<프로젝트명>` 또는 `examples/<새주제>`).
2. 해당 폴더에 `01_charter.md` 작성.
3. 02_data_contract.md ~ 08_results_report.md, sql/00_checks.sql 를 채우며 Level 0→5 진행.
4. 재현성·시각화는 `analysis/design/` 문서를 참조.

---

## Rules / Skills / Subagent 참조

- **설계(명세·템플릿):** `analysis/design/` 경로 사용.
- **실행별 산출물(02~08):** 해당 실행 폴더(예: `analysis/examples/expansion/`, `analysis/runs/<이름>`) 참조.
