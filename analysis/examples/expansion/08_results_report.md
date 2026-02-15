# 08 Results Report — Samsung Account Appliance Expansion (예시)

**프로젝트:** Samsung 계정 기반 가전 확장 연관 요인 탐색 (예시)  
**보고 일자:** 2025-02-15  
**분석 Level:** Level 0–5 예시 완료  
**재현 환경:** Python 3.10+, `analysis/design/requirements-analysis.txt` (예시는 가정 데이터; pip-freeze는 실제 실행 시 실행 폴더에 보관)

---

## 1. 요약 (Executive Summary)

- **연구 목적:** 첫 구매 계정 집단에서 확장 여부(2대 이상 보유) 및 확장 횟수(보유 대수)에 지역(region), 채널(channel), 가입기간(tenure_days)이 어떻게 연관되는지 탐색한다. (예시: 데이터가 임의로 있다고 가정한 일반적 상태.)
- **주요 결과:** (예시 가정) (1) 확장 여부: NA 지역이 KR 대비 오즈비 1.28 (95% CI 1.18–1.39), both 채널이 online 대비 1.35 (1.26–1.45), tenure_days 100일 증가 시 오즈비 1.08 (1.05–1.11). AUC 0.62 (0.61–0.63). (2) 확장 횟수: Negative Binomial 모델에서 방향 유사; region_NA rate ratio 1.15 (1.08–1.22), channel_both 1.18 (1.11–1.25), tenure_days 100일당 1.06 (1.04–1.08).
- **해석상 주의:** 인과 해석 미허용(01_charter). 연관(association)만 기술. 관측 데이터 한계·혼동 가능성 있음.

---

## 2. 데이터 및 계약 (Data & Contract)

- **시간 기준(Time origin):** 계정별 첫 가전 구매일(first_purchase_date). (02_data_contract §3.)
- **관측 창:** 2022-01-01 ~ 2024-06-30 (첫 구매가 이 구간 내인 계정).
- **결과 변수(Outcome):** (1) expanded = I(n_appliances ≥ 2), (2) n_appliances; 관측 종료 시점(2024-06-30) 기준.
- **데이터 한계:** 예시 스키마·가정 수치 사용. 단면 가정; 생존/센서링 미반영. 지역·채널 외 미관측 요인 가능. (02_data_contract §6, 03_data_inventory §7.)

---

## 3. 가설 및 분석 선택 (Hypotheses & Analysis Choice)

- **가설 트리 참조:** 04_hypothesis_tree.md (H1–H6).
- **선택한 분석:** (1) 확장 여부 → 로지스틱 회귀. (2) 확장 횟수 → Poisson 후 과분산으로 Negative Binomial.
- **선택 근거:** 결과 변수 유형(이항/횟수)에 따른 rules ANALYSIS TYPE & SELECTION; design/00_reproducibility_spec §2.3, §2.4.
- **모델 그리드 참조:** 05_model_grid.md (M1 Logit, M2 Poisson, M3 NB).

---

## 4. 주요 결과 (Main Results)

### 4.1 기술통계·탐색 (Level 1)

- (예시) 계정 50,000; 확장률 35%; n_appliances 평균 1.72 (SD 1.05). region별 확장률 32%~38%(NA 최고), channel별 33%~40%(both 최고). tenure_days와 n_appliances Pearson r ≈ 0.28.
- **시각화:** fig1_n_appliances_hist.png (연속형 분포 → 히스토그램), fig3_expansion_by_region_channel.png (범주 vs 비율 → 막대), fig4_tenure_vs_n_scatter.png (연속 vs 연속 → 산점도+regplot). (design/01_visualization_strategy §2.1–2.2.)

### 4.2 모델 추정 (Level 2–3)

- **모델 명세:** M1 Logit(expanded ~ region + channel + tenure_days), M3 NB(n_appliances ~ region + channel + tenure_days). (05_model_grid.)
- **추정치:** 06_evaluation_matrix 요약 — M1 오즈비(95% CI): region_NA 1.28 (1.18–1.39), channel_both 1.35 (1.26–1.45), tenure_days(100일) 1.08 (1.05–1.11). M3 rate ratio(95% CI): region_NA 1.15 (1.08–1.22), channel_both 1.18 (1.11–1.25), tenure_days(100일) 1.06 (1.04–1.08).
- **진단:** M1 VIF < 3; M1 AUC 0.62 (0.61–0.63). M2 Poisson 대비 M3 NB ΔAIC로 NB 채택.
- **시각화:** 계수 플롯(오즈비/rate ratio + 95% CI) — design/01_visualization_strategy §2.3.

### 4.3 모델 비교·로버스트니스 (Level 3)

- M2(Poisson) vs M3(NB): ΔAIC > 0 → M3 선호. (06_evaluation_matrix.)
- 로버스트니스: tenure_days 로그 스케일 대입 시 방향 동일·크기 유사 (07_decision_log).
- **시각화:** 모델별 AIC/BIC 막대 (§2.3).

---

## 5. 그림 목록 (Figures)

| 번호 | 파일명/위치 | 캡션 | 데이터 특성 → 차트 유형 |
|------|-------------|------|--------------------------|
| 1 | fig1_n_appliances_hist.png | 계정당 보유 가전 대수 분포 | 연속형 분포 → 히스토그램 |
| 2 | fig2_region_channel_bar.png | 지역·채널별 계정 수 | 범주 빈도 → 막대 |
| 3 | fig3_expansion_by_region_channel.png | 지역·채널별 확장률 | 범주 vs 비율 → 막대 |
| 4 | fig4_tenure_vs_n_scatter.png | 가입기간과 보유 대수 (95% CI 밴드) | 연속 vs 연속 → 산점도+regplot |
| 5 | fig5_coef_logit.png | 확장 여부 로지스틱 회귀 계수(오즈비) 및 95% CI | 계수±CI → 계수 플롯 |
| 6 | fig6_coef_nb.png | 확장 횟수 NB 모델 rate ratio 및 95% CI | 계수±CI → 계수 플롯 |

---

## 6. 식별 가능성·가정·한계 (Identifiability, Assumptions, Limitations)

- **식별 가능 vs 비식별:** 관측된 region, channel, tenure_days에 대한 연관은 데이터만으로 추정 가능. 선택·혼동으로 인한 편향은 미조정.
- **가정:** 로지스틱 — 로그 오즈의 선형성; NB — 과분산 모수화 적절. 독립 관측(계정 단위).
- **구조적 한계:** 단면·관측 데이터; 인과 해석 불가. 지역/채널 이외 요인(소득, 프로모션 등) 미관측.
- **인과 해석:** 01_charter에서 미허용. 본 보고서는 연관만 서술.

---

## 7. 재현성 (Reproducibility)

- **환경:** Python 3.10+, 패키지: analysis/design/requirements-analysis.txt. 실제 실행 시 실행 폴더에 `pip-freeze.txt` 보관.
- **랜덤 시드:** 42 (train_test_split, CV 등; design/00_reproducibility_spec §3).
- **코드/스크립트:** 예시는 가정 데이터이므로 실제 분석 시 스크립트/노트북 경로 명시.
- **함수·파라미터:** analysis/design/00_reproducibility_spec.md 준수(Logit disp=0, GLM family=Poisson(), NB loglike_method='nb2' 등).

---

## 8. 결론 및 다음 단계 (Conclusions & Next Steps)

- **결론:** (예시 가정 하) NA 지역·both 채널·긴 tenure_days가 확장 여부 및 확장 횟수와 양의 연관을 보였다. 불확실성(95% CI)은 모든 추정에 포함. 인과가 아닌 연관으로 해석한다.
- **다음 옵션:**  
  - A) 실제 데이터로 02_data_contract·03_data_inventory 재작성 후 동일 모델 재추정.  
  - B) 코호트·시간 구간 세분화 또는 생존 분석(시간-이벤트) 검토.  
  - C) 인과 추론이 필요 시 실험·IV 등 별도 설계.

---

## 9. 참고 문서 (References)

- 01_charter.md ~ 07_decision_log.md (본 예시 폴더)
- analysis/design/00_reproducibility_spec.md  
- analysis/design/01_visualization_strategy.md  

---
*Level 5 산출물 (예시). 수치는 예시 가정이며, 실제 분석 시 증거(스키마/SQL/집계·모델 출력)로 교체할 것 (rules R1). analysis/examples/expansion/.*
