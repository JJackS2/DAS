# 05 Model Grid — 예시 분석

**참조:** 04_hypothesis_tree.md, 02_data_contract.md, analysis/design/00_reproducibility_spec.md.

---

## Estimand 정의

| Estimand | 결과 변수 | 모델 클래스 | 참조 |
|----------|-----------|-------------|------|
| 확장 여부에 대한 region/channel/tenure 연관 | expanded (0/1) | 로지스틱 회귀 | §2.3 |
| 확장 횟수에 대한 region/channel/tenure 연관 | n_appliances (count) | Poisson GLM → 필요 시 NB | §2.4 |

---

## 모델 명세 (예시)

### M1: Logit(expanded)

- **결과:** expanded (이항).
- **공변량:** region (더미: 기준 KR), channel (더미: 기준 online), tenure_days (연속).
- **함수:** statsmodels.discrete.discrete_model.Logit(y, X).fit(disp=0).
- **산출:** 계수(로그 오즈), 오즈비, 95% CI; AUC.

### M2: Poisson(n_appliances)

- **결과:** n_appliances (횟수, ≥1).
- **공변량:** 동일(region, channel, tenure_days).
- **함수:** statsmodels.genmod.generalized_linear_model.GLM(y, X, family=Poisson()).fit()
- **산출:** 계수(로그 rate), rate ratio, 95% CI.
- **과분산:** 잔차로 점검; 과분산 시 NegativeBinomial(loglike_method='nb2') 적용(Level 3).

### M3 (선택): NegativeBinomial(n_appliances)

- M2 대비 과분산 보정용. 06_evaluation_matrix에서 M2 vs M3 비교(ΔAIC, LRT 가능 시).

---

## 피처 코딩 (예시)

- region: KR=기준, NA, EU, APAC 더미 3개.
- channel: online=기준, retail, both 더미 2개.
- tenure_days: 연속(표준화 optional; 해석 시 원 단위 명시).

---
*Level 2–3 산출물 (예시). analysis/examples/expansion/.*
