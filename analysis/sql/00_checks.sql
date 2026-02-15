-- 00_checks.sql — Data integrity checks for Samsung account expansion
-- Run against BigQuery (or your warehouse). Fill project/dataset/table placeholders.

-- 1) Key uniqueness
-- SELECT key_column, COUNT(*) AS n
-- FROM `project.dataset.table`
-- GROUP BY key_column
-- HAVING COUNT(*) > 1;

-- 2) Missingness by column
-- SELECT
--   COUNT(*) AS total_rows,
--   COUNTIF(col_a IS NULL) AS missing_col_a,
--   COUNTIF(col_b IS NULL) AS missing_col_b
-- FROM `project.dataset.table`;

-- 3) Date range coverage
-- SELECT MIN(date_col) AS min_date, MAX(date_col) AS max_date
-- FROM `project.dataset.table`;

-- 4) Referential consistency (if applicable)
-- [Add JOIN checks between tables]
