# 예시: Samsung 계정 가전 확장 (expansion)

**설계와 분리:** 이 폴더는 **예시 실행**만 포함합니다.  
**설계(템플릿·재현성·시각화 전략)** 는 `analysis/design/` 에 있습니다.

---

## 처음 읽는 분께

- **사전 지식 없이** “무엇을 수행하는지”, “어떤 순서로 읽으면 되는지”를 알고 싶다면 → **00_reader_guide.md** 부터 보세요.  
- 전체 **Level 0~5 절차** 요약 → `analysis/design/00_process_overview.md`  
- **용어**(오즈비, rate ratio, AIC, Phase lock 등) → `analysis/design/glossary.md`

---

## 목적

예시 주제에 대한 스키마를 정의하고, "데이터가 임의로 있다고 가정한 일반적 상태"에서 Level 0부터 최종 보고서(08)까지 진행한 **결과를 파일로 남긴** 데모.

---

## 예시 주제

- **Samsung 계정 기반 가전 확장:** 첫 구매 계정이 2대 이상 보유(확장 여부) 또는 보유 대수(확장 횟수)에 지역·채널·가입기간이 어떻게 연관되는가?
- **인과:** 미허용. 연관(association)만 기술.

---

## 예시 스키마 요약

- **테이블:** `expansion_study` (계정 1행)
- **키:** account_id
- **주요 컬럼:** signup_date, region, channel, first_purchase_date, n_appliances, expanded, tenure_days, cohort_quarter
- **결과 변수:** expanded (이항), n_appliances (횟수)
- **시간 기준:** first_purchase_date

상세: `02_data_contract.md`, `sql/00_checks.sql`

---

## 산출물 목록 (순서대로)

| 단계 | 파일 | 설명 |
|------|------|------|
| Charter | 01_charter.md | 예시 주제·인과 미허용 |
| Level 0 | 02_data_contract.md | 예시 스키마·계약 |
| Level 0 | sql/00_checks.sql | 무결성 검사 쿼리 |
| Level 0–1 | 03_data_inventory.md | 데이터 특성·특징 피처 (예시 가정 수치) |
| Level 1 | 04_hypothesis_tree.md | 가설 H1–H6 |
| Level 2 | 05_model_grid.md | M1 Logit, M2 Poisson, M3 NB |
| Level 2–3 | 06_evaluation_matrix.md | AUC, 오즈비/rate ratio, ΔAIC |
| Level 3 | 07_decision_log.md | 모델 선택·로버스트니스 결정 |
| Level 5 | 08_results_report.md | **최종 보고서** |

---

## 설계 참조

- **재현성·함수·파라미터:** `analysis/design/00_reproducibility_spec.md`
- **시각화 전략:** `analysis/design/01_visualization_strategy.md`
- **새 분석 시작:** `analysis/design/templates/` 를 새 실행 폴더로 복사한 뒤 채우기.
