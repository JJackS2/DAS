# 설계 (Design) — SROS 분석 프레임워크

이 폴더는 **재사용 가능한 설계·명세·템플릿**만 포함합니다.  
**구체적인 예시(데이터, 스키마, 수치)** 는 `analysis/examples/` 아래 별도 폴더에 있습니다.

---

## 설계 vs 예시 (명시적 분리)

| 구분 | 위치 | 내용 |
|------|------|------|
| **설계** | `analysis/design/` | 재현성 명세, 시각화 전략, **템플릿**(02~08, sql). 주제·데이터 무관. |
| **예시** | `analysis/examples/<주제>/` | 특정 주제(예: expansion)에 대한 채워진 산출물. 설계를 적용한 1회 실행. |

- **새 분석 시작:** `design/templates/` 를 실행 폴더(예: `analysis/runs/<프로젝트명>` 또는 `examples/<새주제>`)로 복사한 뒤 채운다.
- **참조:** rules, skills, subagent는 **설계** 문서를 `analysis/design/` 경로로 참조한다. 실행별 02~08은 해당 **실행 폴더**를 참조한다.

---

## 설계 폴더 구조

```
analysis/design/
├── README.md                    # 본 문서
├── 00_process_overview.md       # Level 0~5 절차 한 페이지 요약 (초심자·독자 가이드용)
├── 00_reproducibility_spec.md   # 재현성 명세 (함수·파라미터·시드)
├── 01_visualization_strategy.md # 시각화 전략 (데이터→차트→라이브러리)
├── glossary.md                  # 핵심 용어 1줄 정의 (estimand, OR, AIC, Phase lock 등)
├── requirements-analysis.txt    # Python 패키지 버전
└── templates/                   # 실행 시 복사할 템플릿
    ├── 01_charter.md            # 주제·연구질문·인과 허용 여부 (최소 필드)
    ├── 02_data_contract.md
    ├── 03_data_inventory.md
    ├── 04_hypothesis_tree.md
    ├── 05_model_grid.md
    ├── 06_evaluation_matrix.md
    ├── 07_decision_log.md
    ├── 08_results_report.md
    └── sql/
        └── 00_checks.sql
```

- **독자 가이드 권장:** 실행·예시 폴더에 **00_reader_guide.md** 또는 README 내 **수행 절차 요약**을 두면, 사전 지식이 없는 독자도 "무엇을 수행하는지"를 따라가기 쉽다. 내용은 `00_process_overview.md`, `glossary.md`를 참조해 채울 수 있다.
