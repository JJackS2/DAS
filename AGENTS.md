# DAS — 에이전트용 프로젝트 맥락

이 저장소는 **DAS**입니다. 메인 산출물은 **finviz-like-treemap**으로, **BI(비즈니스 인텔리전스)용 트리맵 대시보드**이며, **다차원 데이터**(위치·제품·시간·메트릭) 분석을 지원합니다.

## 기술 스택

- **프론트**: React 18, Vite 5, ECharts 5 (finviz-like-treemap/web).
- **데이터 API**: Express, port 8787 (finviz-like-treemap/server).
- **테스트**: Playwright E2E (tests/treemap), 루트에서 `npm run test`, `npm run test:treemap-quality`, `npm run build-and-test`.

## 규칙·스킬·문서

- **규칙**: `.cursor/rules/` — 파일 패턴(globs)별 적용, 작업 시 사용할 스킬이 규칙 본문에 표로 명시됨.
- **스킬**: `.cursor/skills/` — 대시보드 명세·요구사항·차원·기법·논문·오케스트레이션. 규칙에서 “이 작업 시 이 스킬” 참조.
- **명령**: `.cursor/commands/` — 테스트·빌드·규칙 동기화 등 반복 워크플로. 채팅에서 `/` 로 호출.
- **전체 맥락**: [.cursor/README.md](.cursor/README.md).
- **아키텍처·알고리즘**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **모듈 상세**: [docs/MODULES.md](docs/MODULES.md).
- **개발·테스트 가이드**: [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md).
- **Cursor 적합성 평가 방법**: [docs/CURSOR_SUITABILITY_EVALUATION.md](docs/CURSOR_SUITABILITY_EVALUATION.md).

## 명세·계약

- **계층별 명세**: finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md (비전·제약·데이터 차원·레이어 1–4·코드 용어·품질 지표).
- **개발 규칙**: finviz-like-treemap/docs/DEVELOPMENT_RULES.md (구조·데이터 계약·트리맵 규칙·테스트 계약).
- **테스트 규칙**: finviz-like-treemap/docs/TEST_RULES.md (E2E 실행·검증 항목·선택자).

코드 수정 시 위 명세·계약과 동기화하고, 선택자·id·data-testid 변경 시 DEVELOPMENT_RULES §5와 TEST_RULES §4를 함께 갱신하세요.
