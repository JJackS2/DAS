# 08 Results Report — [프로젝트명]

**프로젝트:** _[이름]_  
**보고 일자:** _[YYYY-MM-DD]_  
**분석 Level:** _[0–5]_  
**재현 환경:** Python _[버전]_, _[pip-freeze 경로]_  
**품질 기준:** design/08_report_quality_rubric.md (100점 목표)

---

# 서론 (Introduction)

## 1. 요약 (Executive Summary)

- **연구 목적:** _[1–2문장]_  
  - **근거:** 01_charter (분석명·연구 질문·범위).
- **연구 질문:** _[RQ1, RQ2 등]_  
  - **근거:** 01_charter, 04_hypothesis_tree.
- **데이터 범위·결과 정의:** _[시간 기준, 관측 창, 결과 변수 한 줄]_  
  - **근거:** 02_data_contract §1·§3·§4.
- **주요 결과 (점추정 + 95% CI):** _[2–4문장]_  
  - **근거:** 06_evaluation_matrix (계수·AUC·ΔAIC 등).
- **해석 원칙:** _[연관만 / 인과 미허용 등]_  
  - **근거:** 01_charter.

---

# 본론 (Body)

## 2. 데이터 및 계약 (Data & Contract)

- **시간 기준:** _[ ]_ → **근거:** 02_data_contract §3.
- **관측 창:** _[ ]_ → **근거:** 02_data_contract §3.
- **결과 변수·측정 규칙:** _[ ]_ → **근거:** 02_data_contract §4.
- **데이터 한계:** _[ ]_ → **근거:** 02_data_contract §6, 03_data_inventory §7.

## 3. 가설 및 분석 선택 (Hypotheses & Analysis Choice)

- **가설 요약:** _[H1–Hk 또는 04 참조]_ → **근거:** 04_hypothesis_tree.
- **선택한 분석:** _[모델명]_ → **근거:** rules ANALYSIS TYPE & SELECTION, 00_reproducibility_spec §2.x.
- **모델 명세:** _[ ]_ → **근거:** 05_model_grid.

## 4. 주요 결과 (Main Results)

### 4.1 기술통계·탐색 (Level 1)
- _[요약 수치]_ → **근거:** 03_data_inventory §4 (또는 집계 출력).
- **시각화:** _[파일명]_ — 01_visualization_strategy §2.1–2.2.

### 4.2 모델 추정 (Level 2–3)
- **모델 명세:** _[ ]_ → **근거:** 05_model_grid.
- **추정치 (점추정, 95% CI):** _[오즈비/rate ratio/계수 등]_ → **근거:** 06_evaluation_matrix.
- **진단:** _[VIF, AUC 등]_ → **근거:** 06_evaluation_matrix.
- **시각화:** _[계수 플롯 등]_ — 01_visualization_strategy §2.3.

### 4.3 모델 비교·로버스트니스 (Level 3)
- _[ΔAIC, LRT, 로버스트니스 요약]_ → **근거:** 06_evaluation_matrix, 07_decision_log.
- **시각화:** _[ ]_

## 5. 그림 목록 (Figures)

| 번호 | 파일명 | 캡션 | 데이터 특성 → 차트 |
|------|--------|------|---------------------|
| 1 | _[ ]_ | _[ ]_ | _[ ]_ |

## 6. 식별 가능성·가정·한계 (Identifiability, Assumptions, Limitations)

- **식별 가능 vs 비식별:** _[ ]_ → **근거:** 02·03 한계.
- **가정:** _[ ]_ (모델별).
- **구조적 한계:** _[ ]_ → **근거:** 02_data_contract §6, 03_data_inventory §7.
- **인과 해석:** _[ ]_ → **근거:** 01_charter.

## 7. 재현성 (Reproducibility)

- **환경:** _[Python, pip-freeze]_  
- **랜덤 시드:** _[42, 00_reproducibility_spec §4]_  
- **코드/스크립트:** _[경로]_  
- **함수·파라미터:** 00_reproducibility_spec 준수 여부

---

# 결론 (Conclusion)

## 8. 결론 및 다음 단계 (Conclusions & Next Steps)

- **결론:** _[2–3문장. 본론 §4·§6의 수치·문서를 직접 인용하여 요약]_  
  - 예: “06_evaluation_matrix에 따르면 … (점추정, 95% CI). 02 §6·03 §7에 명시된 한계 내에서 …”
- **다음 옵션 (구체적):**  
  - A) _[실행 가능한 한 줄]_  
  - B) _[실행 가능한 한 줄]_  
  - C) _[실행 가능한 한 줄]_  

---

## 9. 참고 문서 (References)

- 01_charter, 02_data_contract, 03_data_inventory, 04_hypothesis_tree, 05_model_grid, 06_evaluation_matrix, 07_decision_log.
- design/00_reproducibility_spec, design/01_visualization_strategy, design/08_report_quality_rubric.

---
*Level 5 산출물. 설계 템플릿. 모든 수치는 증거(문서+절) 또는 UNKNOWN (rules R1). 품질: 08_report_quality_rubric 100점 목표.*
