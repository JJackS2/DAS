# 07 Decision Log — 예시 분석

**참조:** 05_model_grid.md, 06_evaluation_matrix.md, rules R0–R2.  
**설계:** analysis/design/00_reproducibility_spec.md

---

## Level 2 결정

| 결정 | 내용 | 근거 |
|------|------|------|
| 확장 여부 모델 | Logit(expanded) 사용 | 결과 이항; design/00_reproducibility_spec §2.3 |
| 확장 횟수 모델 | Poisson 먼저 적합, 과분산 확인 | §2.4 |
| 공변량 | region, channel, tenure_days | 04 가설·03 특징 피처 후보 |

---

## Level 3 결정

| 결정 | 내용 | 근거 |
|------|------|------|
| 확장 횟수 최종 모델 | Negative Binomial (M3) 선택 | 06_evaluation_matrix: ΔAIC, 과분산으로 Poisson 부적합 |
| 로버스트니스 | (예시) tenure_days 로그 스케일 대입 시 계수 방향 동일·크기 유사 | 대체 사양 1회 |
| 다중검정 | 본 예시에서는 미적용 | 가설족 명시적 정의 후 필요 시 BH/Bonferroni |

---

## Phase Lock

- Level 0: 02_data_contract, sql/00_checks, 03_data_inventory §2–§3 완료 후 Level 1 진입.
- Level 1: 03 §4–§5, 04_hypothesis_tree 완료 후 Level 2 진입.
- Level 2: M1·M2 적합, 06_evaluation_matrix 초안 후 Level 3 진입.
- Level 3: M3 채택·로버스트니스 요약 후 Level 4/5 진입.
- Level 5: 08_results_report 최종화.

---
*예시 분석. analysis/examples/expansion/.*
