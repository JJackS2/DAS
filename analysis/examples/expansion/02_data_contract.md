# 02 Data Contract — Samsung Account Appliance Expansion (예시 스키마)

## 1. Scope
- **Analysis target:** Samsung account-based appliance expansion (첫 구매 후 추가 가전 보유)
- **Time origin:** 계정별 **첫 가전 구매일** (first_purchase_date)
- **Population:** 첫 가전 구매가 관측 창 내에 있고, 관측 종료 시점 기준 1대 이상 보유한 모든 계정

## 2. Minimal Schema (Required Fields) — 예시

단일 분석용 계정 수준 테이블을 가정한다.

| Table / Source | Key(s) | Required Columns | Type | Notes |
|----------------|--------|------------------|------|--------|
| expansion_study | account_id | account_id | STRING | PK, 1 row per account |
| ↑ | ↑ | signup_date | DATE | 계정 가입일 |
| ↑ | ↑ | region | STRING | KR, NA, EU, APAC |
| ↑ | ↑ | channel | STRING | online, retail, both |
| ↑ | ↑ | first_purchase_date | DATE | **Time origin** |
| ↑ | ↑ | n_appliances | INT64 | 관측 종료 시점 보유 대수 (≥1) |
| ↑ | ↑ | expanded | INT64 | 1 if n_appliances≥2 else 0 |
| ↑ | ↑ | tenure_days | INT64 | first_purchase ~ 관측 종료일(또는 마지막 이벤트) 일수 |
| ↑ | ↑ | cohort_quarter | STRING | first_purchase_date 기준 분기, e.g. 2022-Q1 |

**가정:** 데이터는 이미 위 형태로 집계된 분석용 테이블이며, 관측 종료일(cutoff)은 2024-06-30으로 통일.

## 3. Time Origin Definition
- **Event defining time zero:** first_purchase_date (해당 계정의 첫 가전 구매일)
- **Observation window:** 2022-01-01 ~ 2024-06-30 (첫 구매가 이 구간 내인 계정만 포함)

## 4. Outcome Definition
- **Primary outcome (이항):** expanded = I(n_appliances ≥ 2). 측정: 관측 종료 시점(2024-06-30) 기준.
- **Primary outcome (횟수):** n_appliances (1, 2, 3, …). 동일 시점 기준.
- **Measurement rule:** 동일 계정·동일 cutoff; censoring은 고려하지 않은 단면 가정.

## 5. Data Integrity Checks (sql/00_checks.sql)
- [x] Key uniqueness (account_id)
- [x] Missingness by column
- [x] Date range coverage (first_purchase_date, signup_date)
- [x] Referential consistency (N/A — 단일 테이블)

## 6. Known Limitations (예시)
- 관측 종료 시점 단면이라 생존/이벤트 시간 구조는 반영하지 않음(예시 단순화).
- 지역·채널은 관측된 값만 사용; 미관측 혼동요인 존재 가능.
- 본 스키마는 **예시용**이며, 실제 데이터는 프로젝트에 맞게 수정한다.

---
*Level 0 artifact. 예시 — analysis/examples/expansion/.*
