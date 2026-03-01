---
name: dashboard-layered-spec
description: Writes or updates layered specification (Layer 0–4) for BI dashboards: vision, product/UX, visualization, technical, implementation. Use when creating "계층별 명세", "레이어 0부터 작성", or 00_SPECIFICATION_LAYERED.md.
---

# 계층별 명세 작성 (레이어 0–4)

큰 레벨에서 작은 레벨 순으로 명세 문서를 작성·갱신한다.

| 레이어 | 내용 | 산출 |
|--------|------|------|
| **0** | 비전·목표·제약·비목표; BI·다차원 분석 위치; 데이터 차원 표(고정·옵션) | §0.0–§0.6 |
| **1** | 제품·UX: 시나리오, 화면 구성, 타깃 사용자, 접근성·반응형·에러·로딩 | 결정 표 |
| **2** | 시각화: 기법 선정, 색상·레이블·폰트·min side·애니메이션 | 기법 표 + 규칙 |
| **3** | 기술: 라이브러리 제약, API·row 스키마, 품질 평가 지표 | 계약 + 품질 표 |
| **4** | 구현: state/key/displayLabel, DOM·테스트 계약, resize·notMerge | 코드 레벨 용어 |

- TBD는 질문으로 해소 후 "결정 사항" 표에 반영.
- 시각적 결정은 ASCII 스케치 또는 코드 스니펫으로 제안.

## 참조

- **기법 선정**: 스킬 **visualization-technique-selection** 사용.
- **데이터 차원 표**: 스킬 **data-dimensions-spec** 사용.
- **예시 문서**: `finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md`
