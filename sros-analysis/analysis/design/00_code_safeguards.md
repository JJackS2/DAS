# 00 Code & Query Safeguards — 자료형·파라미터 안전장치

**목적:** 실제 쿼리(SQL)와 파이썬 코드가 **자료형·함수 파라미터·스키마**를 올바르게 사용하도록 제약을 명시한다. 에이전트·LLM(gpt-oss 등)이 코드를 생성할 때 단일 출처(single source of truth)를 참조해 오입력을 방지한다.

---

## 1. SQL (BigQuery 표준 SQL) 안전장치

### 1.1 스키마 단일 출처
- **테이블명·컬럼명·자료형**은 **실행 폴더의 02_data_contract.md §2 Minimal Schema** 에만 근거한다.
- 02_data_contract에 없는 테이블·컬럼을 **생성하지 않는다**. 필요한 컬럼이 계약에 없으면 먼저 02를 수정한 뒤 쿼리 작성.
- **자료형:** BigQuery 표준 타입만 사용. 예: `INT64`, `FLOAT64`, `DATE`, `DATETIME`, `STRING`, `BOOL`. 계약의 Type 열과 일치시킨다.

### 1.2 쿼리 작성 전 체크리스트 (에이전트/LLM)
1. 실행 폴더의 **02_data_contract.md** 를 읽고, 사용할 **테이블명·키·Required Columns·Type** 을 나열한다.
2. `sql/00_checks.sql` 또는 추출 쿼리에서 **위 목록에 있는 컬럼만** 참조한다.
3. 집계/조건에 쓸 컬럼이 날짜면 `DATE`/`DATETIME` 로 비교; 숫자면 `INT64`/`FLOAT64` 연산. 타입 혼동(문자열로 날짜 비교 등)을 하지 않는다.

### 1.3 예시(expansion) 대응
- 예: `expansion_study`, `account_id`, `signup_date`, `region`, `channel`, `first_purchase_date`, `n_appliances`, `expanded`, `tenure_days`, `cohort_quarter`. Type은 02_data_contract 표와 동일하게.

---

## 2. Python 안전장치

### 2.1 함수·파라미터 단일 출처
- **라이브러리·함수·주요 파라미터**는 **analysis/design/00_reproducibility_spec.md** 에만 근거한다.
- 명세에 없는 함수·파라미터를 **사용하지 않는다**. 새로 쓸 경우 Level 4 이상에서 명세에 추가한 뒤 사용.
- **랜덤을 쓰는 모든 호출**에는 `random_state=42`(또는 명세 §3에 명시한 값)를 **반드시** 넣는다.

### 2.2 입력 자료형·형상 요구사항 (00_reproducibility_spec과 일치)

코드 생성 시 아래를 준수한다. 명세에 상세 타입이 없으면 여기를 따른다.

| 용도 | 변수 | 요구사항 |
|------|------|----------|
| OLS | y | 1차원 array-like (shape (n,)). 연속형. |
| OLS | X | 2차원 array-like (shape (n, k)). 상수항 포함 시 `sm.add_constant(X)` 사용. |
| Logit | y | 1차원, **0과 1만** 포함. 그 외 값이 있으면 필터링 또는 에러. |
| Logit | X | 2차원 (n, k). 상수항 포함 가능. |
| GLM Poisson / NB | y | 1차원, **비음정수** (count). |
| GLM Poisson / NB | X | 2차원 (n, k). |
| KaplanMeier.fit | durations | 1차원, 양수. |
| KaplanMeier.fit | event_observed | 1차원, bool 또는 0/1. |
| CoxPHFitter.fit | df | DataFrame. duration_col, event_col 에 해당하는 컬럼명을 **문자열**로 전달. |
| CoxPHFitter.fit | duration_col, event_col | 02_data_contract 또는 df 컬럼명과 **완전 일치**하는 문자열. |
| train_test_split | ... | `random_state=42` 필수. |
| cross_val_score | ... | `cv` 객체에 `random_state=42` 또는 분할 재현 가능한 방식 사용. |

- **pandas:** `describe`, `groupby`, `corr` 등에 넘기는 열 이름은 **실제 DataFrame 컬럼명과 문자열로 일치**. 02_data_contract 또는 로드한 데이터의 `df.columns` 기준.

### 2.3 코드 생성 전 체크리스트 (에이전트/LLM)
1. 사용할 **모델/함수**에 해당하는 **00_reproducibility_spec** 절(§2.1~§2.6)을 확인한다.
2. **함수 시그니처와 필수 파라미터**를 명세 표에서 그대로 따른다 (예: `disp=0`, `loglike_method='nb2'`, `alpha=0.05`, `random_state=42`).
3. **y, X(또는 durations, event_observed)** 의 형상·타입을 위 표에 맞춘다. 필요 시 `df[col].astype(...)` 또는 `np.asarray(...)` 로 명시적 변환.
4. sklearn 호출 시 `random_state=42` 를 누락하지 않는다.

---

## 3. 에이전트·LLM(gpt-oss 등) 최적화 요약

- **단일 출처:** SQL → 실행 폴더 **02_data_contract**. Python → **00_reproducibility_spec** (+ 본 문서 입력 타입 표).
- **명시적 바인딩:** 쿼리/코드 생성 전에 "이번에 사용할 테이블/컬럼 목록", "이번에 사용할 함수/파라미터 목록"을 한 번 나열한 뒤 생성하면 오입력이 줄어든다.
- **타입·파라미터 고정:** 위 표와 명세에 적힌 파라미터만 사용. 임의로 이름·타입을 지어내지 않는다.
- **규칙과의 연결:** R6(재현성), R1(증거)와 맞춰, 생성된 코드는 명세·계약과 1:1로 대응 가능해야 한다.

---
*설계 문서. rules R8, skills CODE GENERATION SAFEGUARDS, subagent "Before generating code"에서 참조.*
