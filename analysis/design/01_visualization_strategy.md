# 01 Visualization Strategy — 결과 설명 및 시각화

## 1. 결과 설명 전략 (Explanation Strategy)

- **원칙:** 분석 단계별로 "무엇을 묻고, 무엇을 본 다음, 어떤 결론을 내리는지"를 한 줄로 정리한다.
- **구성:** (1) 질문 → (2) 데이터/모델 요약 → (3) 시각화로 증거 제시 → (4) 불확실성(CI/구간) 표시 → (5) 한 문장 해석.
- **일관성:** Level 1은 기술통계+분포, Level 2–3은 모델 추정+진단, Level 4–5는 비교·안정성·한계를 시각화로 보완.

## 2. 데이터 특성 → 차트 유형 → 라이브러리 매핑

### 2.1 단일 변수 (Univariate)

| 데이터 특성 | 목적 | 권장 차트 | 라이브러리 | 함수/API 예시 | 비고 |
|-------------|------|-----------|------------|----------------|------|
| 연속형 분포 | 분포 형태, 이상치 | 히스토그램 | matplotlib | `plt.hist(x, bins=..., edgecolor='k', alpha=0.7)` | bins 수는 재현성 명세 또는 데이터 규모에 따라 명시 |
| 연속형 분포 | 비교용 분포 | KDE | seaborn | `sns.kdeplot(data=df, x='col', hue='segment')` | hue로 세그먼트 구분 |
| 이산/범주 | 빈도 | 막대 그래프 (Bar) | matplotlib | `plt.bar(categories, counts)` | 세로 막대, 범례 필수 |
| 비율/구성 | 부분-전체 | 막대(누적) 또는 파이(소수 범주만) | matplotlib | `plt.bar(..., stacked=True)` | 파이는 3–5 범주 이하 권장 |

### 2.2 이변량 (Bivariate)

| 데이터 특성 | 목적 | 권장 차트 | 라이브러리 | 함수/API 예시 | 비고 |
|-------------|------|-----------|------------|----------------|------|
| 연속 vs 연속 | 연관성 | 산점도 | matplotlib | `plt.scatter(x, y, alpha=0.5)` | 샘플 많으면 alpha 낮춤 |
| 연속 vs 연속 + 추세 | 추세선 | 산점도 + 회귀선 | seaborn | `sns.regplot(x, y, data=df, ci=95)` | ci=95로 95% CI 밴드 |
| 범주 vs 연속 | 그룹 비교 | 박스플롯 | seaborn | `sns.boxplot(data=df, x='cat', y='cont')` | 이상치 규칙 명시(기본 IQR) |
| 범주 vs 연속 | 분포 비교 | 바이올린/박스 | seaborn | `sns.violinplot(data=df, x='cat', y='cont')` | 그룹 수 적을 때 |
| 시간 vs 연속/비율 | 시계열 추이 | 시계열 라인 | matplotlib | `plt.plot(dates, values)` | x축 날짜 포맷 명시 |
| 시간 vs 수준 + 구간 | 추이+불확실성 | 라인 + shaded CI | matplotlib | `plt.fill_between(x, lo, hi, alpha=0.3)` | lo/hi = CI 하한/상한 |

### 2.3 다변량·모델 결과 (Multivariate / Model Output)

| 데이터 특성 | 목적 | 권장 차트 | 라이브러리 | 함수/API 예시 | 비고 |
|-------------|------|-----------|------------|----------------|------|
| 계수 ± CI | 회귀 계수 비교 | 계수 플롯 (forest plot 스타일) | matplotlib | 수평 막대 + errorbar 또는 `plt.errorbar(x=coef, y=names, xerr=half_ci)` | 95% CI 필수 |
| 생존 곡선 | KM 곡선 | 단계 함수 | lifelines | `model.plot_survival_function()` | matplotlib 백엔드, 제목/축 레이블 추가 |
| 모델 비교 (AIC/BIC 등) | 모델 선택 증거 | 막대 또는 표 | matplotlib + pandas | `plt.bar(model_names, aic_values)` | 06_evaluation_matrix와 연동 |
| 혼동/성능 | 분류 성능 | AUC 곡선 | sklearn + matplotlib | `sklearn.metrics.RocCurveDisplay.from_predictions(...)` | 범례, AUC 값 표기 |

### 2.4 제한 사항

- **시각화만으로 인과 주장 금지.** R4 준수.
- 색상: 색맹 친화 패턴 권장; 파일 저장 시 `fig.savefig(..., dpi=150)` 등 해상도 명시.

## 3. 단계별 시각화 체크리스트

| Level | 최소 1개 이상 권장 | 참조 절 |
|-------|--------------------|---------|
| Level 1 | 분포(히스토그램/KDE 또는 박스), 시계열 또는 세그먼트 비교 | §2.1, §2.2 |
| Level 2 | 추정 계수 + 95% CI, 또는 생존 곡선 | §2.3 |
| Level 3 | 모델 비교(AIC/BIC/성능), 로버스트니스 요약 | §2.3 |
| Level 4 | 추가 사양 비교, 정규화 경로 등 (필요 시) | §2.3 |
| Level 5 | 08_results_report.md에 사용된 그림 목록 + 캡션 | 본 문서 전반 |

---
*Rules R7에서 참조. 설계 문서(analysis/design/).*
