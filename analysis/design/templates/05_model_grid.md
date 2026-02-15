# 05 Model Grid — [프로젝트명]

**참조:** 04_hypothesis_tree.md, 02_data_contract.md, design/00_reproducibility_spec.md.

---

## Estimand 정의

| Estimand | 결과 변수 | 모델 클래스 | 참조 |
|----------|-----------|-------------|------|
| _[설명]_ | _[y]_ | _[OLS/Logit/Poisson/NB/KM/Cox]_ | §2.x |

---

## 모델 명세

### M1: _[모델명]_

- **결과:** _[y]_  
- **공변량:** _[X 목록]_  
- **함수:** _[statsmodels/lifelines 함수]_  
- **산출:** _[계수, CI, AUC 등]_  

### M2, M3 (선택)

- _[대안 모델, 과분산 대비 등]_  

---

## 피처 코딩

- _[더미 기준, 표준화 여부]_  

---
*Level 2–3 산출물. 설계 템플릿.*
