# 대시보드 문서 인덱스

## 읽기 순서 (처음부터 재계획 시)

1. **00_SPECIFICATION_LAYERED.md** — 계층별 명세 (비전 → 제품 → 시각화 → 기술 → 구현).  
   요구사항·제약·TBD·코드 레벨 용어·평가 기준·시각 스케치 포함.
2. **DEVELOPMENT_RULES.md** — 개발 시 준수할 구조, 스타일, 데이터 계약, 트리맵 규칙.
3. **TEST_RULES.md** — E2E 테스트 실행 방법, 검증 항목, 앱–테스트 계약.

## 문서 역할

| 문서 | 역할 |
|------|------|
| 00_SPECIFICATION_LAYERED | BI·다차원 분석 위치(§0.0); 데이터 차원 고정·옵션(§0.6); 필수 기술 사항; §0.5 트리맵 논문 연대기 |
| REFERENCES_TREEMAP_LITERATURE | 트리맵 관련 논문 참고 문헌 (최신→최초), 인용·요약·본 프로젝트 매핑 |
| DEVELOPMENT_RULES | 일상 개발·검증 시 참조하는 규칙 |
| TEST_RULES | 테스트 수행·선택자·품질 러너 규칙 |

## 프로젝트 수준 문서 (저장소 루트 docs/)

- **아키텍처·알고리즘**: [../../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — 시스템 개요·데이터 흐름·buildTree·품질 지표.
- **모듈 상세**: [../../docs/MODULES.md](../../docs/MODULES.md) — web/server/treemap/tests 역할·입출력·의존성.
