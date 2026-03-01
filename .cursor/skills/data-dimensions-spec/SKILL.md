---
name: data-dimensions-spec
description: Defines and documents data dimensions for BI dashboards: location hierarchy, product hierarchy, time, metrics (size/color). Use when "데이터 차원 명시", "차원 표 작성", or specifying fixed/option dimensions.
---

# 데이터 차원 명시

## 명세에 넣을 내용

- **데이터 차원 표**:
  - 위치 계층 (키 순서, 축 이름)
  - 제품 계층 (키 순서, 축 이름)
  - 시간 (파라미터/필드)
  - 메트릭 (size, color 집합)
- **고정/옵션 문구**: "현재 이 수준으로 고정", "데이터셋 구조 제안은 옵션", "현재 범위는 이 데이터 구성에서 분석 지원" 등 명시.

## 선행

요구사항은 **dashboard-requirements** 로 수집한 뒤, 여기서 표와 문구로 명세(§0.6 등)에 반영한다.

## 참조

- **예시**: `finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md` §0.6
