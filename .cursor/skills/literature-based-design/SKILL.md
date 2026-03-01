---
name: literature-based-design
description: Incorporates visualization/BI literature into specs: chronology (newest to oldest), REFERENCES doc, quality metrics from papers. Use when "논문 기반 구체화", "논문 연대기", or REFERENCES_*.md.
---

# 논문 기반 구체화

## 절차

1. **최신→최초** 순으로 트리맵·BI·다차원 관련 논문 탐색·정리.
2. 명세에 **논문 연대기** 섹션: 시기, 저자, 요약, **본 프로젝트 반영** 열.
3. 별도 `REFERENCES_*.md`에 인용·요약·매핑 표 작성, 명세에서 링크.
4. 품질 지표(AR, min side, tiny 비율)는 Bruls·Ordered 계열과 맞춰 명세·테스트 규칙에 반영.

## 참조

- **예시**: `finviz-like-treemap/docs/REFERENCES_TREEMAP_LITERATURE.md`
- **명세 반영**: 스킬 **dashboard-layered-spec** 레이어 2·3과 연동.
