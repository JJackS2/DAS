# Skill: Statistical Analysis Engine

## Purpose
Perform structured statistical analysis for Samsung account-based appliance expansion with **reproducible** code and **strategy-driven** visualization.

## REFERENCE DOCUMENTS (필수 참조) — 설계 vs 예시 분리

| 문서 | 용도 |
|------|------|
| `analysis/design/00_process_overview.md` | Level 0~5 절차 한 페이지 요약 — 초심자·독자 가이드용 |
| `analysis/design/00_reproducibility_spec.md` | 라이브러리·함수·파라미터·랜덤시드 — 모든 분석 코드는 여기 명시된 것만 사용 |
| `analysis/design/01_visualization_strategy.md` | 데이터 특성 → 차트 유형 → 라이브러리/함수 — 모든 시각화는 여기 따라 수행 |
| `analysis/design/glossary.md` | 핵심 용어 1줄 정의 (estimand, OR, AIC, Phase lock 등) — 보고·예시 설명 시 참조 |
| `analysis/design/templates/08_results_report.md` | 최종 보고서 **템플릿** — Level 5 산출물 형식 |
| **실행 폴더** (예: `analysis/examples/expansion/`, `analysis/runs/<이름>`) | 01_charter, 02~08, sql — 해당 분석의 채워진 산출물. **권장:** 00_reader_guide.md 또는 README에 수행 절차 요약을 두어 초심자가 따라가기 쉽게 함. |

## CORE CAPABILITIES & SELECTION (무엇을 할 수 있는지, 어떻게 선택하는지)

### 1. 데이터 이해 및 데이터셋 특성 설명 (Level 0–1)
- **가능한 작업:** 테이블/키/시간 기준 식별, 결측·중복·커버리지 점검, **데이터셋 특성 설명**, **특징 있는 피처 후보 도출**.
- **선택 기준:** 실행 폴더의 02_data_contract.md 스키마가 정해지면, design/00_reproducibility_spec §2.1의 pandas 함수만 사용 (describe, isna().sum(), groupby.agg, corr, value_counts, CV·세그먼트별 결측률).
- **산출물:** 실행 폴더의 **03_data_inventory.md** (데이터 특성 설명 + 특징 피처 후보 §5), sql/00_checks.sql 결과. 템플릿: design/templates/03_data_inventory.md.
- **데이터 특성 설명 구조:** 03_data_inventory §1 표대로 — 범위·규모 → 변수 수준 → 분포 → 조건부 요약 → 연관 구조 → 특징 피처. 모든 수치는 증거 또는 UNKNOWN.
- **특징 피처 도출:** 03_data_inventory §5 — "특징 있음" 5가지 유형(연관/세그먼트 차이/변동/결측/분포)에 따라 후보 목록 표를 채우고, 근거 지표(상관, groupby 차이, CV, 결측률, 시각화)를 명시.

### 2. 기술통계·탐색 (Level 1)
- **가능한 작업:** 조건부 요약, 시계열 추이, 세그먼트 비교.
- **선택 기준:** 결과 변수가 연속/범주/비율/시간 중 무엇인지에 따라 design/01_visualization_strategy §2.1–2.2에서 차트 유형 선택 (히스토그램, KDE, 막대, 산점도, 박스, 시계열 라인).
- **라이브러리:** pandas (집계), matplotlib/seaborn (시각화). 함수·파라미터는 design/00_reproducibility_spec §2.1 및 design/01_visualization_strategy 표에 명시된 것만 사용.

### 3. 베이스라인 모델 (Level 2)
- **가능한 작업:** OLS, 로지스틱, Poisson/NB, Kaplan-Meier, Cox PH.
- **선택 기준 (주제/결과 변수):**
  - 연속형 결과 → OLS (00_reproducibility_spec §2.2).
  - 이항 결과(도입/이탈 등) → 로지스틱 (§2.3).
  - 횟수(확장 대수 등) → Poisson 또는 NB (§2.4).
  - 시간-이벤트 → KM + Cox (§2.5).
- **필수:** 추정치 + 95% CI; 사용한 함수·파라미터를 스크립트 또는 05_model_grid.md에 기록.

### 4. 모델 비교 (Level 3)
- **가능한 작업:** LRT, ΔAIC/ΔBIC, K-Fold CV, VIF.
- **선택 기준:** 중첩 모델이면 LRT; 비중첩이면 AIC/BIC; 예측 성능이면 CV (scoring 명시). 함수·파라미터는 00_reproducibility_spec §2.6, 랜덤시드 §3 준수.

### 5. 로버스트니스 (Level 3–4)
- **가능한 작업:** 대체 사양, 영향력 관측치 제외, 부트스트랩, 다른 시간 구간.
- **선택 기준:** 05_model_grid.md에 명시한 estimand에 맞춰 1–2가지만 적용하고, 07_decision_log.md에 요약.

### 6. 다중검정 보정 (Level 3+)
- **가능한 작업:** 가설족 정의 후 BH 또는 Bonferroni.
- **선택 기준:** 04_hypothesis_tree.md에서 가설족을 정의한 경우에만 적용.

### 7. 보고 (전 단계)
- **가능한 작업:** 식별 가능 vs 비식별, 가정, 구조적 한계 서술.
- **선택 기준:** design/templates/08_results_report.md 템플릿 구조에 맞춰. 초심자용 독자 가이드는 REFERENCE DOCUMENTS 표의 실행 폴더 권장 참조. (최종 보고서는 실행 폴더 08에 작성) “해석 가능 범위”와 “한계”를 명시.

## TOOL USAGE POLICY (명시적 매핑)

- **BigQuery:** 추출·집계·피처 생성만. 모델 fitting은 Python. 사용 SQL은 프로젝트/데이터셋/테이블 명시.
- **Python:** analysis/design/00_reproducibility_spec.md에 나열된 라이브러리·함수·주요 파라미터만 사용. 미명시 라이브러리는 Level 4 이상에서만 design/00_reproducibility_spec에 추가한 뒤 사용.
- **시각화:** analysis/design/01_visualization_strategy.md의 “데이터 특성 → 차트 → 라이브러리/함수” 표를 따름. 모든 그림에 제목·축 레이블·범례(필요 시)·캡션 보완.

## DECISION TREE PRINCIPLE

순서 고정: **Estimand → Model Class (재현성 명세 참조) → Diagnostics → Robustness → Interpretation → Visualization (전략 문서 참조).**  
이 순서를 바꾸지 않는다.

## SELF-CHECK BEFORE OUTPUT

- [ ] 사용한 모든 함수·파라미터가 analysis/design/00_reproducibility_spec에 있는가?
- [ ] 그림이 analysis/design/01_visualization_strategy의 권장 차트+라이브러리와 일치하는가?
- [ ] 랜덤이 사용된 곳에 random_state/seed가 명시되어 있는가?
