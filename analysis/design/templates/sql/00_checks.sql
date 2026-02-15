-- 00_checks.sql — Data integrity checks
-- 프로젝트: [프로젝트명]
-- 테이블: [테이블명]. 실행 폴더에서 프로젝트/데이터셋/테이블 채울 것.

-- 1) Key uniqueness
-- SELECT key_column, COUNT(*) AS n
-- FROM `project.dataset.table`
-- GROUP BY key_column
-- HAVING COUNT(*) > 1;

-- 2) Missingness by column
-- SELECT
--   COUNT(*) AS total_rows,
--   COUNTIF(col_a IS NULL) AS missing_col_a,
--   ...
-- FROM `project.dataset.table`;

-- 3) Date range coverage
-- SELECT MIN(date_col) AS min_date, MAX(date_col) AS max_date
-- FROM `project.dataset.table`;

-- 4) Referential consistency (if applicable)
-- [JOIN checks]
