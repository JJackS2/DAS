# 시각화 대시보드 명세 — 참조

## 규칙·스킬 분리

- **규칙**: `.cursor/rules/*.mdc` — 파일별 적용 규칙이며, 각 규칙에 "이 작업 시 사용할 스킬"이 명시되어 있음.
- **스킬**: `.cursor/skills/<이름>/` — 세분화된 워크플로. 전체 워크플로는 **visualization-dashboard-spec**이 나머지 스킬을 순서대로 호출.
- 인덱스: `.cursor/README.md` 참고.

## 이 스킬로 반복하는 방법

1. **스킬 등록**: 이 프로젝트에 `.cursor/skills/visualization-dashboard-spec/` 가 있으면, 해당 프로젝트에서 작업할 때 에이전트가 description 키워드에 따라 스킬을 참조할 수 있다.
2. **명시적 지시**: 아래처럼 요청하면 스킬 워크플로를 따른다.

### 지시 예시 (한국어)

- "시각화 대시보드를 만들기: [원하는 요구사항을 적어 주세요]"
- "다차원 데이터에 맞는 시각화 기법 선정하고 구현까지 구체화해 줘"
- "논문 기반으로 구체화 항목 선정하고 명세에 반영해 줘"
- "BI 대시보드 명세 레이어 0부터 작성해 줘. 데이터 차원은 위치·제품·시간·메트릭이야."

### 지시 예시 (영어)

- "Create a visualization dashboard with layered spec; my multidimensional data has location hierarchy, product hierarchy, time, and metrics."
- "Select visualization technique for my multidimensional data and concretize implementation; use paper-based criteria."

## 본 프로젝트(DAS) 문서 위치

| 문서 | 경로 |
|------|------|
| 계층별 명세 (BI·다차원·데이터 차원·레이어 0–5) | `finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md` |
| 트리맵 논문 참고 문헌 (최신→최초) | `finviz-like-treemap/docs/REFERENCES_TREEMAP_LITERATURE.md` |
| 개발 규칙 | `finviz-like-treemap/docs/DEVELOPMENT_RULES.md` |
| 테스트 규칙 | `finviz-like-treemap/docs/TEST_RULES.md` |
| 문서 인덱스 | `finviz-like-treemap/docs/README.md` |

## 워크플로 요약

1. 요구사항 수집 (목표, 다차원 구성, 차원 고정/옵션)
2. 레이어 0→4 명세 작성 (비전→구현)
3. 다차원에 맞는 시각화 기법 선정 (예: 트리맵)
4. 논문 탐색·연대기·REFERENCES 반영
5. 데이터 차원 표·고정/옵션 문구 명시
6. 구현·테스트 계약·코드 용어 명세와 동기화
