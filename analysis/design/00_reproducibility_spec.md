# 00 Reproducibility Spec — SROS Analysis

## 1. 개발 환경 명시

| 항목 | 명시 값 | 비고 |
|------|---------|------|
| 언어 | Python 3.10+ | 3.10, 3.11 검증 권장 |
| 패키지 관리 | pip, requirements-analysis.txt | 가상환경 사용 필수 |
| SQL 엔진 | BigQuery (표준 SQL) | 로컬 검증 시 SQLite/duckdb 가능 |

## 2. 라이브러리·함수·주요 파라미터 매핑

### 2.1 기술통계·탐색 (Level 1)

| 목적 | 라이브러리 | 함수 | 주요 파라미터 | 출력 예 |
|------|------------|------|----------------|---------|
| 요약통계 | pandas | `DataFrame.describe(percentiles=[.25,.5,.75], include=..., exclude=...)` | percentiles, include | count, mean, std, min, 25/50/75%, max |
| 결측 집계 | pandas | `DataFrame.isna().sum()` | — | 시리즈(컬럼별 결측 수) |
| 그룹별 요약 | pandas | `DataFrame.groupby(by).agg({col: ['mean','std','count']})` | by, agg | 그룹별 통계 |
| 상관행렬 | pandas | `DataFrame[cols].corr(method='pearson')` | method: pearson \| spearman \| kendall | N×N 상관 |
| 빈도표 | pandas | `Series.value_counts(normalize=..., dropna=...)` | normalize, dropna | 카테고리별 count/비율 |
| 변동계수 (CV) | pandas | `df[col].std() / df[col].mean()` (mean≠0일 때) | — | 연속형 변동 크기 비교 (03_data_inventory §5) |
| 세그먼트별 결측률 | pandas | `df.groupby(seg)[col].apply(lambda x: x.isna().mean())` | seg: 세그먼트 열 | 결측 패턴 (특징 피처 후보) |

### 2.2 연속형 결과 (Level 2–3)

| 목적 | 라이브러리 | 함수 | 주요 파라미터 | 재현 시 고정값 |
|------|------------|------|----------------|----------------|
| OLS 회귀 | statsmodels | `statsmodels.regression.linear_model.OLS(y, X).fit()` | — | X, y 동일 시 동일 결과 |
| 신뢰구간 | statsmodels | `result.conf_int(alpha=0.05)` | alpha=0.05 | 95% CI |
| VIF | statsmodels | `statsmodels.stats.outliers_influence.variance_inflation_factor(X, i)` | i: 변수 인덱스 | — |
| 잔차 정규성 | scipy | `scipy.stats.shapiro(resid)` | — | 샘플 수 제한 있음 |
| 잔차 정규성 (대표본) | scipy | `scipy.stats.normaltest(resid)` | — | — |

### 2.3 이항 결과 (이탈/도입 등)

| 목적 | 라이브러리 | 함수 | 주요 파라미터 | 재현 시 고정값 |
|------|------------|------|----------------|----------------|
| 로지스틱 회귀 | statsmodels | `statsmodels.discrete.discrete_model.Logit(y, X).fit(disp=0)` | disp=0 (출력 억제) | method='newton', maxiter=100 |
| 오즈비·CI | — | `np.exp(result.params)`, `np.exp(result.conf_int())` | — | — |
| AUC | sklearn | `sklearn.metrics.roc_auc_score(y_true, y_pred_proba)` | — | average='macro' 등 명시 |

### 2.4 횟수(Count) 결과 (확장 대수 등)

| 목적 | 라이브러리 | 함수 | 주요 파라미터 | 재현 시 고정값 |
|------|------------|------|----------------|----------------|
| Poisson GLM | statsmodels | `statsmodels.genmod.generalized_linear_model.GLM(y, X, family=Poisson()).fit()` | family=Poisson() | — |
| Negative Binomial | statsmodels | `statsmodels.discrete.discrete_model.NegativeBinomial(y, X, loglike_method='nb2').fit(disp=0)` | loglike_method='nb2' | disp=0 |

### 2.5 생존/시간이벤트 (Time-to-event)

| 목적 | 라이브러리 | 함수 | 주요 파라미터 | 재현 시 고정값 |
|------|------------|------|----------------|----------------|
| Kaplan-Meier | lifelines | `lifelines.KaplanMeierFitter().fit(durations, event_observed)` | — | durations, event_observed 동일 시 동일 |
| Cox PH | lifelines | `lifelines.CoxPHFitter().fit(df, duration_col, event_col)` | duration_col, event_col | penalizer=0.0 명시 |
| Cox 신뢰구간 | lifelines | `model.confidence_interval_` | — | — |

### 2.6 모델 비교·검증 (Level 3–4)

| 목적 | 라이브러리 | 함수 | 주요 파라미터 | 재현 시 고정값 |
|------|------------|------|----------------|----------------|
| LRT (중첩 모델) | statsmodels | `llf_full - llf_restricted` → χ² 자유도로 p-value | — | 동일 fitted 모델 |
| AIC/BIC | statsmodels | `model.aic`, `model.bic` | — | — |
| K-Fold CV | sklearn | `sklearn.model_selection.cross_val_score(estimator, X, y, cv=5, scoring='neg_log_loss')` | cv=5, scoring | random_state=42 (분할 재현) |
| Train/Test 분할 | sklearn | `sklearn.model_selection.train_test_split(..., random_state=42)` | random_state=42 | 반드시 고정 |

## 3. 입력 자료형·형상 요구사항 (Input type requirements)

코드 생성 시 아래를 준수한다. 상세 체크리스트는 `00_code_safeguards.md` §2 참조.

| 함수/용도 | 입력 | 요구사항 |
|-----------|------|----------|
| OLS(y, X) | y | 1차원, shape (n,). 연속형. |
| OLS(y, X) | X | 2차원, shape (n, k). 상수항 필요 시 sm.add_constant(X). |
| Logit(y, X) | y | 1차원, **0과 1만**. |
| Logit(y, X) | X | 2차원 (n, k). |
| GLM(Poisson), NB | y | 1차원, 비음정수(count). |
| GLM, NB | X | 2차원 (n, k). |
| KaplanMeier.fit | durations, event_observed | 1차원; event_observed는 bool 또는 0/1. |
| CoxPHFitter.fit | df, duration_col, event_col | df는 DataFrame; duration_col, event_col은 컬럼명 **문자열**. |
| train_test_split, cross_val_score, KFold | — | `random_state=42` 필수. |

## 4. 랜덤 시드 정책

- **전역:** 분석 스크립트 상단에서 `np.random.seed(42)`, `random.seed(42)` 설정.
- **sklearn:** `random_state=42` (또는 본 문서에 명시한 값) 사용.
- **train_test_split / KFold / StratifiedKFold:** 동일 seed 사용.

## 5. 버전 기록

- 실행 폴더에 `pip-freeze.txt` 를 Level 0 완료 시점 및 주요 변경 후 보관.
- 08_results_report.md "재현 환경" 절에서 Python 버전 + pip-freeze.txt 경로 명시.

---
*rules/skills/subagent에서 "재현성" 참조 시 기준. 설계 문서(analysis/design/).*
