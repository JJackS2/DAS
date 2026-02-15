# 08 Results Report — Samsung Account Appliance Expansion (예시)

**프로젝트:** Samsung 계정 기반 가전 확장 연관 요인 탐색 (예시)  
**보고 일자:** 2025-02-15  
**분석 Level:** Level 0–5 예시 완료  
**재현 환경:** Python 3.10+, `analysis/design/requirements-analysis.txt` (예시는 가정 데이터; pip-freeze는 실제 실행 시 실행 폴더에 보관)  
**품질 기준:** design/08_report_quality_rubric.md (이상적 시나리오 — 100점 구조 적용)

---

# 서론 (Introduction)

## 1. 요약 (Executive Summary)

- **연구 목적:** 첫 구매 계정 집단에서, 확장 여부(2대 이상 보유) 및 확장 횟수(보유 대수)에 지역(region), 채널(channel), 가입기간(tenure_days)이 어떻게 **연관**되는지 탐색한다.  
  - **근거:** 01_charter (분석명·연구 질문·범위).
- **연구 질문:** RQ1) 확장 여부(expanded)에 region, channel, tenure_days가 연관되는가? RQ2) 확장 횟수(n_appliances)에 동일 변수들이 연관되는가?  
  - **근거:** 01_charter, 04_hypothesis_tree (연구 질문·가설 H1–H6).
- **데이터 범위·결과 정의:** 시간 기준은 계정별 첫 가전 구매일(first_purchase_date); 관측 창 2022-01-01 ~ 2024-06-30; 결과 변수는 expanded(이항), n_appliances(횟수), 관측 종료 시점 2024-06-30 기준.  
  - **근거:** 02_data_contract §1·§3·§4.
- **주요 결과 (점추정 + 95% CI):**  
  - 확장 여부(로지스틱): region_NA 오즈비 1.28 (95% CI 1.18–1.39), channel_both 1.35 (1.26–1.45), tenure_days 100일당 1.08 (1.05–1.11). AUC 0.62 (0.61–0.63).  
  - 확장 횟수(NB): region_NA rate ratio 1.15 (1.08–1.22), channel_both 1.18 (1.11–1.25), tenure_days 100일당 1.06 (1.04–1.08).  
  - **근거:** 06_evaluation_matrix (M1 Logit·M3 NB 추정 및 진단).
- **해석 원칙:** 연관(association)만 기술하며, 인과 해석은 하지 않는다.  
  - **근거:** 01_charter (인과 미허용).

---

# 본론 (Body)

## 2. 데이터 및 계약 (Data & Contract)

- **시간 기준:** 계정별 첫 가전 구매일(first_purchase_date).  
  - **근거:** 02_data_contract §3.
- **관측 창:** 2022-01-01 ~ 2024-06-30 (첫 구매가 이 구간 내인 계정만 포함).  
  - **근거:** 02_data_contract §3.
- **결과 변수·측정 규칙:** (1) expanded = I(n_appliances ≥ 2), (2) n_appliances; 관측 종료 시점 2024-06-30 기준, 동일 계정·동일 cutoff.  
  - **근거:** 02_data_contract §4.
- **데이터 한계:** 단면 가정; 생존/센서링 미반영; 지역·채널 외 미관측 요인 가능; 예시는 가정 수치 사용.  
  - **근거:** 02_data_contract §6, 03_data_inventory §7.

## 3. 가설 및 분석 선택 (Hypotheses & Analysis Choice)

- **가설 요약:** H1–H3(확장 여부에 region, channel, tenure_days 연관), H4–H6(확장 횟수에 동일).  
  - **근거:** 04_hypothesis_tree (가설 트리 표·특징 피처 근거 03 §5.2).
- **선택한 분석:** 확장 여부 → 로지스틱 회귀; 확장 횟수 → Poisson 적합 후 과분산으로 Negative Binomial 채택.  
  - **근거:** rules ANALYSIS TYPE & SELECTION (이항→§2.3, 횟수→§2.4), design/00_reproducibility_spec §2.3·§2.4.
- **모델 명세:** M1 Logit(expanded ~ region + channel + tenure_days), M2 Poisson → M3 NB(n_appliances ~ 동일 공변량).  
  - **근거:** 05_model_grid (M1·M2·M3 명세·피처 코딩).

## 4. 주요 결과 (Main Results)

### 4.1 기술통계·탐색 (Level 1)
- 계정 50,000; 확장률 35%; n_appliances 평균 1.72 (SD 1.05). region별 확장률 32%~38%(NA 최고), channel별 33%~40%(both 최고). tenure_days와 n_appliances Pearson r ≈ 0.28.  
  - **근거:** 03_data_inventory §4.2·§4.3·§4.4 (분포·세그먼트·연관 구조).
- **시각화:** fig1_n_appliances_hist.png, fig3_expansion_by_region_channel.png, fig4_tenure_vs_n_scatter.png.  
  - **근거:** design/01_visualization_strategy §2.1–2.2.

### 4.2 모델 추정 (Level 2–3)
- **모델 명세:** M1 Logit, M3 NB (공변량: region 더미, channel 더미, tenure_days 연속).  
  - **근거:** 05_model_grid.
- **추정치 (점추정, 95% CI):**  
  - M1: region_NA 1.28 (1.18–1.39), channel_both 1.35 (1.26–1.45), tenure_days(100일) 1.08 (1.05–1.11).  
  - M3: region_NA 1.15 (1.08–1.22), channel_both 1.18 (1.11–1.25), tenure_days(100일) 1.06 (1.04–1.08).  
  - **근거:** 06_evaluation_matrix §1·§2 (주요 계수·M3 주요 추정).
- **진단:** M1 VIF < 3, 수렴 정상; M1 AUC 0.62 (0.61–0.63).  
  - **근거:** 06_evaluation_matrix §1.
- **시각화:** fig5_coef_logit.png, fig6_coef_nb.png (계수 + 95% CI).  
  - **근거:** design/01_visualization_strategy §2.3.

### 4.3 모델 비교·로버스트니스 (Level 3)
- M2(Poisson) vs M3(NB): ΔAIC = M2−M3 > 0 → M3 선호. 계수·CI는 M3 기준 보고.  
  - **근거:** 06_evaluation_matrix §2·§3.
- 로버스트니스: tenure_days 로그 스케일 대입 시 계수 방향 동일·크기 유사.  
  - **근거:** 07_decision_log (Level 3 결정).
- **시각화:** 모델별 AIC/BIC 막대 — 01_visualization_strategy §2.3.

## 5. 그림 목록 (Figures)

| 번호 | 파일명/위치 | 캡션 | 데이터 특성 → 차트 유형 |
|------|-------------|------|--------------------------|
| 1 | fig1_n_appliances_hist.png | 계정당 보유 가전 대수 분포 | 연속형 분포 → 히스토그램 |
| 2 | fig2_region_channel_bar.png | 지역·채널별 계정 수 | 범주 빈도 → 막대 |
| 3 | fig3_expansion_by_region_channel.png | 지역·채널별 확장률 | 범주 vs 비율 → 막대 |
| 4 | fig4_tenure_vs_n_scatter.png | 가입기간과 보유 대수 (95% CI 밴드) | 연속 vs 연속 → 산점도+regplot |
| 5 | fig5_coef_logit.png | 확장 여부 로지스틱 계수(오즈비) 및 95% CI | 계수±CI → 계수 플롯 |
| 6 | fig6_coef_nb.png | 확장 횟수 NB rate ratio 및 95% CI | 계수±CI → 계수 플롯 |

## 6. 식별 가능성·가정·한계 (Identifiability, Assumptions, Limitations)

- **식별 가능 vs 비식별:** 관측된 region, channel, tenure_days에 대한 연관은 데이터만으로 추정 가능. 선택·혼동으로 인한 편향은 미조정.  
  - **근거:** 02_data_contract §6, 03_data_inventory §7.
- **가정:** 로지스틱 — 로그 오즈의 선형성; NB — 과분산 모수화 적절. 독립 관측(계정 단위).  
  - **근거:** 05_model_grid, 06_evaluation_matrix 진단.
- **구조적 한계:** 단면·관측 데이터; 인과 해석 불가; 지역/채널 이외 요인(소득, 프로모션 등) 미관측.  
  - **근거:** 02_data_contract §6, 03_data_inventory §7.
- **인과 해석:** 01_charter에서 미허용. 본 보고서는 연관만 서술.  
  - **근거:** 01_charter.

## 7. 재현성 (Reproducibility)

- **환경:** Python 3.10+, 패키지: analysis/design/requirements-analysis.txt. 실제 실행 시 실행 폴더에 `pip-freeze.txt` 보관.  
- **랜덤 시드:** 42 (train_test_split, CV 등) — design/00_reproducibility_spec §4.  
- **코드/스크립트:** 예시는 가정 데이터이므로 실제 분석 시 스크립트/노트북 경로 명시.  
- **함수·파라미터:** design/00_reproducibility_spec 준수 (Logit disp=0, GLM family=Poisson(), NB loglike_method='nb2' 등).

---

# 결론 (Conclusion)

## 8. 결론 및 다음 단계 (Conclusions & Next Steps)

- **결론:**  
  - 06_evaluation_matrix에 따르면, 확장 여부(로지스틱)에서 NA 지역이 KR 대비 오즈비 1.28 (95% CI 1.18–1.39), both 채널이 online 대비 1.35 (1.26–1.45), tenure_days 100일당 1.08 (1.05–1.11)로 추정되었다. 확장 횟수(NB)에서는 region_NA 1.15 (1.08–1.22), channel_both 1.18 (1.11–1.25), tenure_days 100일당 1.06 (1.04–1.08)로 방향이 유사하였다.  
  - 02_data_contract §6·03_data_inventory §7에 명시된 한계(단면, 미관측 요인) 내에서, 위 연관은 인과가 아닌 **연관**으로만 해석한다(01_charter).
- **다음 옵션 (구체적):**  
  - **A)** 실제 데이터로 02_data_contract·03_data_inventory를 채운 뒤, 동일 모델(05_model_grid)로 재추정하고 06·08을 갱신한다.  
  - **B)** 코호트·시간 구간 세분화 또는 생존 분석(시간-이벤트)을 04 가설 확장 후 05_model_grid에 반영하여 검토한다.  
  - **C)** 인과 추론이 필요하면 실험·IV 등 별도 설계를 01_charter에 명시한 뒤 진행한다.

---

## 9. 참고 문서 (References)

- 01_charter, 02_data_contract, 03_data_inventory, 04_hypothesis_tree, 05_model_grid, 06_evaluation_matrix, 07_decision_log (본 예시 폴더).
- analysis/design/00_reproducibility_spec, analysis/design/01_visualization_strategy, analysis/design/08_report_quality_rubric.

---
*Level 5 산출물 (예시). 이상적 시나리오 — 서론·본론·결론 명료, 모든 주장에 근거(문서+절) 표기. 수치는 예시 가정이며 실제 분석 시 증거(스키마/SQL/집계·모델 출력)로 교체 (rules R1).*
