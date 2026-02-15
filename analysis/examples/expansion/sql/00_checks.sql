-- 00_checks.sql — 예시 스키마(expansion_study) 무결성 검사
-- 프로젝트: Samsung account appliance expansion (예시)
-- 테이블: expansion_study (account_id 1 row)
-- 설계 템플릿: analysis/design/templates/sql/00_checks.sql

-- 1) Key uniqueness
SELECT account_id, COUNT(*) AS n
FROM expansion_study
GROUP BY account_id
HAVING COUNT(*) > 1;
-- Expected: 0 rows.

-- 2) Missingness by column
SELECT
  COUNT(*) AS total_rows,
  COUNTIF(account_id IS NULL)    AS missing_account_id,
  COUNTIF(signup_date IS NULL)   AS missing_signup_date,
  COUNTIF(region IS NULL)        AS missing_region,
  COUNTIF(channel IS NULL)       AS missing_channel,
  COUNTIF(first_purchase_date IS NULL) AS missing_first_purchase_date,
  COUNTIF(n_appliances IS NULL)  AS missing_n_appliances,
  COUNTIF(expanded IS NULL)      AS missing_expanded,
  COUNTIF(tenure_days IS NULL)   AS missing_tenure_days,
  COUNTIF(cohort_quarter IS NULL) AS missing_cohort_quarter
FROM expansion_study;

-- 3) Date range coverage
SELECT
  MIN(first_purchase_date) AS min_first_purchase,
  MAX(first_purchase_date) AS max_first_purchase,
  MIN(signup_date)         AS min_signup,
  MAX(signup_date)         AS max_signup
FROM expansion_study;

-- 4) Outcome range
SELECT
  MIN(n_appliances) AS min_n,
  MAX(n_appliances) AS max_n,
  COUNTIF(expanded = 1) AS n_expanded,
  COUNTIF(expanded = 0) AS n_not_expanded
FROM expansion_study;
