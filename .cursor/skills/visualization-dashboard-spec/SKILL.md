---
name: visualization-dashboard-spec
description: Orchestrates full BI dashboard spec workflow: requirements → layered spec → visualization technique → literature-based design → data dimensions. Use when "시각화 대시보드 만들기", "다차원 데이터 시각화", "논문 기반 구체화", or full dashboard specification in one go.
---

# 시각화 대시보드 명세 (전체 워크플로)

BI 시각화 대시보드를 **한 번에** 구체화할 때 아래 스킬을 순서대로 적용한다.

## 워크플로와 사용 스킬

| 순서 | 작업 | 사용 스킬 |
|------|------|-----------|
| 1 | 요구사항 수집 | **dashboard-requirements** |
| 2 | 데이터 차원 표·고정/옵션 문구 | **data-dimensions-spec** |
| 3 | 레이어 0–4 명세 작성·갱신 | **dashboard-layered-spec** |
| 4 | 시각화 기법 선정 | **visualization-technique-selection** |
| 5 | 논문 연대기·REFERENCES·품질 지표 | **literature-based-design** |
| 6 | 구현·테스트 계약 명세와 동기화 | 프로젝트 규칙(DEVELOPMENT_RULES, TEST_RULES) 및 해당 규칙에서 명시한 스킬 |

## 지시 예시

- "시각화 대시보드를 만들기: [요구사항]"
- "다차원 데이터에 맞는 시각화 기법 선정하고 구현까지 구체화해 줘"
- "논문 기반으로 구체화 항목 선정하고 명세에 반영해 줘"

## 참조 문서 (이 프로젝트)

- 명세: `finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md`
- 논문: `finviz-like-treemap/docs/REFERENCES_TREEMAP_LITERATURE.md`
- 규칙: `finviz-like-treemap/docs/DEVELOPMENT_RULES.md`, `TEST_RULES.md`
- 상세 절차: [reference.md](reference.md)
