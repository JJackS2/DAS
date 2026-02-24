# 06 Evaluation Matrix — 예시 분석

**참조:** 05_model_grid.md, analysis/design/00_reproducibility_spec.md §2.6.

---

## 1. 확장 여부 모델 (M1 Logit)

| 지표 | 값 (예시 가정) | 비고 |
|------|----------------|------|
| AIC | 52,340 | |
| BIC | 52,410 | |
| AUC | 0.62 (95% CI 0.61–0.63) | train_test_split random_state=42 |
| 주요 계수 (오즈비, 95% CI) | region_NA 1.28 (1.18–1.39), channel_both 1.35 (1.26–1.45), tenure_days(100일) 1.08 (1.05–1.11) | 기준: KR, online |

진단: VIF < 3 (다중공선성 심하지 않음). 수렴 정상.

---

## 2. 확장 횟수 모델 (M2 Poisson vs M3 NB)

| 모델 | AIC | BIC | 비고 |
|------|-----|-----|------|
| M2 Poisson | 128,500 | 128,570 | |
| M3 Negative Binomial | 125,200 | 125,280 | 과분산 반영 |

ΔAIC = M2−M3 > 0 → M3 선호. (예시: NB가 적합도 우수 가정.)

M3 주요 추정 (rate ratio, 95% CI): region_NA 1.15 (1.08–1.22), channel_both 1.18 (1.11–1.25), tenure_days(100일) 1.06 (1.04–1.08).

---

## 3. 모델 비교 요약

- **확장 여부:** M1(Logit) 1개 사양; AUC·계수 CI 보고.
- **확장 횟수:** M2 vs M3 → ΔAIC/ΔBIC로 M3(NB) 선택. 계수·CI는 M3 기준 보고.

---
*Level 2–3 산출물 (예시). analysis/examples/expansion/.*
