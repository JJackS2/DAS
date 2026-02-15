# 08 Results Report — [프로젝트명]

**프로젝트:** _[이름]_  
**보고 일자:** _[YYYY-MM-DD]_  
**분석 Level:** _[0–5]_  
**재현 환경:** Python _[버전]_, _[pip-freeze 경로]_

---

## 1. 요약 (Executive Summary)

- **연구 목적:** _[1–2문장]_  
- **주요 결과:** _[점추정 + 95% CI 등]_  
- **해석상 주의:** _[인과 여부, 01_charter]_  

---

## 2. 데이터 및 계약 (Data & Contract)

- **시간 기준:** _[02_data_contract]_  
- **관측 창:** _[ ]_  
- **결과 변수:** _[ ]_  
- **데이터 한계:** _[ ]_  

---

## 3. 가설 및 분석 선택 (Hypotheses & Analysis Choice)

- **가설 트리:** 04_hypothesis_tree.md  
- **선택한 분석:** _[ ]_  
- **선택 근거:** _[rules ANALYSIS TYPE & SELECTION]_  
- **모델 그리드:** 05_model_grid.md  

---

## 4. 주요 결과 (Main Results)

### 4.1 기술통계·탐색 (Level 1)
- _[요약 수치]_  
- **시각화:** _[파일명]_ — _[01_visualization_strategy]_  

### 4.2 모델 추정 (Level 2–3)
- **모델 명세:** _[05 참조]_  
- **추정치:** _[계수/오즈비/HR + 95% CI]_  
- **진단:** _[VIF, AUC 등]_  
- **시각화:** _[계수 플롯 등]_  

### 4.3 모델 비교·로버스트니스 (Level 3)
- _[LRT/ΔAIC, 로버스트니스]_  
- **시각화:** _[ ]_  

---

## 5. 그림 목록 (Figures)

| 번호 | 파일명 | 캡션 | 데이터 특성 → 차트 |
|------|--------|------|---------------------|
| 1 | _[ ]_ | _[ ]_ | _[ ]_ |

---

## 6. 식별 가능성·가정·한계 (Identifiability, Assumptions, Limitations)

- **식별 가능 vs 비식별:** _[ ]_  
- **가정:** _[ ]_  
- **구조적 한계:** _[ ]_  
- **인과 해석:** _[01_charter]_  

---

## 7. 재현성 (Reproducibility)

- **환경:** _[Python, pip-freeze]_  
- **랜덤 시드:** _[42, design/00_reproducibility_spec §3]_  
- **코드/스크립트:** _[경로]_  
- **함수·파라미터:** design/00_reproducibility_spec 준수 여부  

---

## 8. 결론 및 다음 단계 (Conclusions & Next Steps)

- **결론:** _[2–3문장]_  
- **다음 옵션:** A) _[ ]_ B) _[ ]_ C) _[ ]_  

---

## 9. 참고 문서 (References)

- 01_charter.md, 02_data_contract.md, 03_data_inventory.md, 04–07, design/00_reproducibility_spec.md, design/01_visualization_strategy.md  

---
*Level 5 산출물. 설계 템플릿. 모든 수치는 증거 또는 UNKNOWN (rules R1).*
