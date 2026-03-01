---
name: dashboard-requirements
description: Collects requirements for BI visualization dashboards: goals, multidimensional data structure (location/product hierarchy, time, metrics), and dimension fix/option decisions. Use when gathering "요구사항 수집", "다차원 데이터 구성", or dashboard requirements before specification.
---

# 대시보드 요구사항 수집

명세 작성 전에 사용자에게 확인하거나 대화에서 추출할 항목.

## 수집 항목

- **목표**: 최고 수준 분석 / 탑티어 시각화 / 쉬운 사용 중 우선순위
- **다차원 데이터 구성**
  - **위치(공간) 계층**: 예) region → subsidiary
  - **제품(또는 도메인) 계층**: 예) division → product_l2 → product_l3
  - **시간**: 기간/날짜 (예: dateKey)
  - **메트릭**: 면적·색상에 쓸 지표 (sales, rate 등)
- **데이터 차원**: 현재 수준 고정 vs 확장 가능. 데이터셋 구조 제안을 옵션으로 둘지 결정

## 다음 단계

수집 결과를 **dashboard-layered-spec**, **data-dimensions-spec** 등으로 이어서 명세에 반영한다.
