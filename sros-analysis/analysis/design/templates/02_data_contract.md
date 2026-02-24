# 02 Data Contract — [프로젝트명]

## 1. Scope
- **Analysis target:** _[분석 대상 한 줄]_  
- **Time origin:** _[예: 첫 구매일, 계정 생성일]_  
- **Population:** _[예: 첫 구매가 관측 창 내인 모든 계정]_  

## 2. Minimal Schema (Required Fields)

| Table / Source | Key(s) | Required Columns | Type | Notes |
|----------------|--------|------------------|------|--------|
| _[table name]_ | _[e.g. account_id]_ | _[column list]_ | _[type]_ | _[constraints]_ |

## 3. Time Origin Definition
- **Event defining time zero:** _[TBD]_  
- **Observation window:** _[start]_ ~ _[end]_  

## 4. Outcome Definition
- **Primary outcome:** _[e.g. count, binary, time-to-event]_  
- **Measurement rule:** _[TBD]_  

## 5. Data Integrity Checks (sql/00_checks.sql)
- [ ] Key uniqueness  
- [ ] Missingness by column  
- [ ] Date range coverage  
- [ ] Referential consistency  

## 6. Known Limitations
- _[선택 편향, 측정 오류, 미관측 변수 등]_  

---
*Level 0 산출물. 설계 템플릿 — 실행 폴더에서 채울 것.*
