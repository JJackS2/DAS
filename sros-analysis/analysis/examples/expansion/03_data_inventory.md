# 03 Data Inventory — 예시 가정 하 데이터셋 특성

**참조:** 02_data_contract.md, sql/00_checks.sql.  
**설계:** analysis/design/00_reproducibility_spec.md, design/01_visualization_strategy.md  
**주의:** 아래 수치는 **예시(데이터가 임의로 있다고 가정한 일반적 상태)** 이며, 실제 분석 시 SQL/집계 결과로 교체한다.

---

## 1. 데이터셋 특성 설명 체계 (요약)

| 관점 | 설명 항목 | 본 예시 § |
|------|-----------|-----------|
| 범위·규모 | 행 50,000, 열 9, 시간 2022-01 ~ 2024-06 | §2, §3 |
| 변수 수준 | 변수별 유형·결측·범위 | §4.1 |
| 분포 | n_appliances, region, channel 등 | §4.2 |
| 조건부 요약 | region/channel별 확장률·평균 대수 | §4.3 |
| 연관 구조 | tenure_days vs n_appliances 상관, 세그먼트 차이 | §4.4 |
| 특징 피처 | region, channel, tenure_days | §5 |

---

## 2. 데이터셋 개요 (예시 가정)

- **출처:** expansion_study (02_data_contract §2)
- **행 수:** 50,000 (계정 수)
- **열 수:** 9
- **시간 구간:** first_purchase_date 2022-01-01 ~ 2024-06-30
- **키:** account_id — 유일성 확인됨(예시 가정)

---

## 3. 데이터 품질 요약 (예시 가정)

| 검사 항목 | 결과 | 비고 |
|-----------|------|------|
| 키 유일성 | 통과 | 중복 0건 |
| 결측 by 컬럼 | 0% (모든 필수 컬럼) | 예시는 결측 없음 가정 |
| 날짜 커버리지 | 2022-01-01 ~ 2024-06-30 | 관측 창과 일치 |
| 참조 무결성 | N/A | 단일 테이블 |

---

## 4. 데이터셋 특성 설명 (예시 수치)

### 4.1 변수 목록·유형·결측·범위

| 변수명 | 유형 | 결측률 | 범위/범주 요약 | 비고 |
|--------|------|--------|----------------|------|
| account_id | 범주(식별자) | 0% | 50,000 유일값 | PK |
| signup_date | 날짜 | 0% | 2018-01 ~ 2024-06 | |
| region | 범주 | 0% | KR 40%, NA 25%, EU 20%, APAC 15% | |
| channel | 범주 | 0% | online 50%, retail 30%, both 20% | |
| first_purchase_date | 날짜 | 0% | 2022-01-01 ~ 2024-06-30 | Time origin |
| n_appliances | 연속(정수) | 0% | 1~8, 평균 1.72, SD 1.05 | 결과(횟수) |
| expanded | 이항 | 0% | 0: 65%, 1: 35% | 결과(이항) |
| tenure_days | 연속 | 0% | 90~900, 평균 450, SD 180 | 공변량 |
| cohort_quarter | 범주 | 0% | 2022-Q1~2024-Q2 분포 | |

### 4.2 분포 요약

- **n_appliances:** 평균 1.72, 표준편차 1.05, 25/50/75% = 1, 1, 2. 오른쪽 꼬리(소수 계정이 4대 이상).
- **expanded:** 35% 확장(2대 이상).
- **region:** KR 최빈(40%); **channel:** online 최빈(50%).
- **시각화:** fig1_n_appliances_hist.png (연속형 분포 → 히스토그램), fig2_region_channel_bar.png (범주 빈도 → 막대).

### 4.3 시간·세그먼트별 요약

- **region별 확장률:** KR 32%, NA 38%, EU 36%, APAC 34%. NA가 다소 높음.
- **channel별 확장률:** online 33%, retail 36%, both 40%. both가 가장 높음.
- **cohort_quarter:** 최근 코호트일수록 tenure_days가 짧음(구조적); 평균 n_appliances는 코호트 간 1.5~1.9 수준.
- **시각화:** fig3_expansion_by_region_channel.png (범주 vs 비율 → 막대/박스).

### 4.4 연관 구조

- **tenure_days vs n_appliances:** Pearson r ≈ 0.28 (양의 연관). tenure가 길수록 보유 대수 경향적으로 많음.
- **region–n_appliances:** 그룹 평균 차이 존재(위 §4.3). NA 평균 최고.
- **시각화:** fig4_tenure_vs_n_scatter.png (연속 vs 연속 → 산점도+regplot, ci=95).

---

## 5. 특징 있는 피처 후보 (예시)

### 5.1 정의 (설계 템플릿 design/templates/03_data_inventory.md §5.1 참조)

생략.

### 5.2 특징 피처 후보 목록

| 피처명 | 특징 유형 | 근거 지표 (예시 가정) | 비고 |
|--------|-----------|------------------------|------|
| tenure_days | 연관 | \|r\|≈0.28 vs n_appliances | 확장 횟수와 양의 연관; 04 가설 후보 |
| region | 세그먼트 | 확장률 32%~38%, NA 최고 | 04 가설: 지역별 차이 |
| channel | 세그먼트 | 확장률 33%~40%, both 최고 | 04 가설: 채널별 차이 |
| n_appliances | 분포 | 오른쪽 꼬리, CV 높음 | 결과 변수; Poisson/NB 고려 |

### 5.3 특징 피처 설명 (요약)

- **tenure_days:** 관측 기간이 긴 계정일수록 보유 대수가 많다는 연관. 인과 아님(노출 시간과 혼재).
- **region, channel:** 세그먼트 간 확장률·평균 대수 차이가 있어, 회귀에서 더미로 포함할 후보.

---

## 6. 시각화·산출물 참조 (예시)

| 그림/산출물 | 캡션 요약 | 데이터 특성 → 차트 |
|-------------|-----------|---------------------|
| fig1_n_appliances_hist.png | 계정당 보유 가전 대수 분포 | 연속형 분포 → 히스토그램 |
| fig2_region_channel_bar.png | 지역·채널별 계정 수 | 범주 빈도 → 막대 |
| fig3_expansion_by_region_channel.png | 지역·채널별 확장률 | 범주 vs 비율 → 막대 |
| fig4_tenure_vs_n_scatter.png | 가입기간과 보유 대수 산점도(95% CI 밴드) | 연속 vs 연속 → 산점도+regplot |

---

## 7. 한계·주의

- 예시 수치는 가정이며, 실제 데이터로 대체 필요.
- 관측 종료 시점 단면; 생존/이벤트 시간 미반영.
- 인과 해석 없음(01_charter).

---
*Level 0–1 산출물 (예시). analysis/examples/expansion/.*
