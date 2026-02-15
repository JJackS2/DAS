# 02 Data Contract — Samsung Account Appliance Expansion

## 1. Scope
- **Analysis target:** Samsung account-based appliance expansion
- **Time origin:** _[TBD: e.g. first account creation, first purchase]_
- **Population:** _[TBD: e.g. all accounts with ≥1 appliance]_

## 2. Minimal Schema (Required Fields)

| Table / Source | Key(s) | Required Columns | Type | Notes |
|----------------|--------|------------------|------|--------|
| _[table name]_ | _[e.g. account_id]_ | _[column list]_ | _[type]_ | _[constraints]_ |

## 3. Time Origin Definition
- **Event defining time zero:** _[TBD]_
- **Observation window:** _[start]_ ~ _[end]_

## 4. Outcome Definition
- **Primary outcome:** _[e.g. count of additional appliances, time to next purchase]_
- **Measurement rule:** _[TBD]_

## 5. Data Integrity Checks (sql/00_checks.sql)
- [ ] Key uniqueness
- [ ] Missingness by column
- [ ] Date range coverage
- [ ] Referential consistency

## 6. Known Limitations
- _[List any known data gaps or constraints]_

---
*Level 0 artifact. Update after running sql/00_checks.sql and completing 03_data_inventory.md.*
