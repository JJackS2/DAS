# 04 Hypothesis Tree — 예시 분석

**참조:** 03_data_inventory.md §5 (특징 피처 후보), 02_data_contract.md (결과 정의).  
**설계:** analysis/design/00_reproducibility_spec.md

---

## 연구 질문

- **RQ1:** 확장 여부(expanded)에 region, channel, tenure_days가 연관되는가?
- **RQ2:** 확장 횟수(n_appliances)에 region, channel, tenure_days가 연관되는가?

(연관만 기술; 인과 아님.)

---

## 가설 트리 (예시)

| ID | 가설 (연관) | 결과 변수 | 예상 방향 (탐색적) | 특징 피처 근거 (03 §5) |
|----|-------------|-----------|--------------------|------------------------|
| H1 | region이 확장 여부와 연관된다 | expanded | NA > KR 등 (세그먼트 차이) | 03 §5.2 region |
| H2 | channel이 확장 여부와 연관된다 | expanded | both > online 등 | 03 §5.2 channel |
| H3 | tenure_days가 확장 여부와 연관된다 | expanded | 양의 연관 | 03 §5.2 tenure_days |
| H4 | region이 확장 횟수와 연관된다 | n_appliances | 세그먼트 평균 차이 | 03 §4.3, §5.2 |
| H5 | channel이 확장 횟수와 연관된다 | n_appliances | both에서 평균 높을 가능성 | 03 §4.3 |
| H6 | tenure_days가 확장 횟수와 연관된다 | n_appliances | 양의 연관 (r≈0.28) | 03 §4.4, §5.2 |

---

## 분석 선택으로의 연결

- **expanded (이항)** → 로지스틱 회귀 (design/00_reproducibility_spec §2.3). H1–H3 검증.
- **n_appliances (횟수)** → Poisson 또는 Negative Binomial GLM (§2.4). H4–H6 검증.

다중검정: 가설족을 "확장 여부 모델 계수" / "확장 횟수 모델 계수"로 나누면, 필요 시 BH/Bonferroni 적용 가능(Level 3+).

---
*Level 1 산출물 (예시). analysis/examples/expansion/.*
