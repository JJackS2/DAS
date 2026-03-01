# Cursor 사용 효율 극대화 가이드

알려진 Cursor 사용 효율 방법론을 **Cursor에서 제어 가능한 카테고리**로 나누어 정리한 문서입니다. 공통적으로 유용한 사용법 위주이며, 본 프로젝트(DAS)의 현재 작업 분야에 맞춰 적용 포인트를 명시했습니다.

---

## 현재 작업 분야 (본 프로젝트 DAS)

| 항목 | 내용 |
|------|------|
| **프로젝트** | DAS — 대시보드·분석 관련 저장소 |
| **주요 산출물** | BI 시각화 대시보드 (finviz-like-treemap): 트리맵 기반 다차원 데이터 분석 |
| **기술 스택** | React 18, Vite 5, ECharts 5 (web); Express (server, 8787); Playwright E2E (tests/treemap) |
| **문서·명세** | 계층별 명세(00_SPECIFICATION_LAYERED.md), 논문 참고(REFERENCES_*.md), DEVELOPMENT_RULES, TEST_RULES |
| **Cursor 설정** | `.cursor/rules/`(규칙 3종), `.cursor/skills/`(스킬 6종), `.cursor/README.md`(인덱스) |
| **적용 포인트** | 명세·문서 편집 시 규칙+스킬 조합, 트리맵 코드·테스트 시 파일 패턴별 규칙, Plan Mode로 다단계 구현 전 계획 수립 |

---

## 카테고리 개요

Cursor에서 제어 가능한 영역을 다음처럼 나눕니다.

| 번호 | 카테고리 | 핵심 제어 수단 |
|------|----------|----------------|
| 1 | 설치·마이그레이션 | 패키지 매니저, VS Code 설정 임포트 |
| 2 | 설정·구성 | Settings, workspace, CLI |
| 3 | 규칙 (Rules) | `.cursor/rules/*.mdc`, User Rules |
| 4 | 스킬 (Skills) | `.cursor/skills/<이름>/SKILL.md` |
| 5 | 인덱싱·성능 | `.cursorignore`, `.cursorindexignore`, `search.exclude` |
| 6 | 단축키·입력 | Composer, Inline Edit, Plan Mode, Tab |
| 7 | 컨텍스트·@ 참조 | @Codebase, @Docs, @Files, @symbol 등 |
| 8 | 에이전트·플랜 | Plan Mode, 플랜 저장, 재시작 전략 |
| 9 | 슬래시 명령·명령 | `.cursor/commands/`, `/` 트리거 |
| 10 | 모델·Max 모드 | 모델 선택, 확장 컨텍스트 |
| 11 | YOLO 모드·자동화 | 터미널 자동 승인 Allow/Deny |
| 12 | 대화·컨텍스트 관리 | 새 대화 vs 계속, @Past Chats |
| 13 | 워크플로 | TDD, 코드베이스 이해, Git, 리뷰 |
| 14 | 확장 | MCP, Hooks, Cloud Agents |
| 15 | 이미지·시각 | 스크린샷, 디자인→코드, 브라우저 |
| 16 | 코드 리뷰·검증 | Review, Bugbot, 인터럽트 |
| 17 | 병렬·클라우드 에이전트 | Worktrees, 다중 모델, Cloud Agents |
| 18 | 디버그 모드 | 재현·가설·계측 |

---

## 1. 설치·마이그레이션

1. 패키지 매니저로 설치해 업데이트를 한 명령으로 수행 (예: `winget install Anysphere.Cursor`, `brew install --cask cursor`).
2. 첫 실행 시 VS Code 설정 임포트: 확장, 키바인딩, 설정, 스니펫을 한 번에 가져오기.
3. Command Palette에서 "Import VS Code Settings" 실행해 놓친 임포트 보완.
4. `cursor` 셸 명령 PATH 설치: Command Palette → "Install 'cursor' command in PATH".
5. 터미널 워크플로: `cursor .`, `cursor src/file.ts:42`, `cursor --diff f1 f2`, `cursor -a ../shared` 등으로 프로젝트/파일 열기.

---

## 2. 설정·구성

6. Cursor Settings에서 Beta/Nightly 채널 선택 시 스킬·훅 등 최신 기능 사용 가능.
7. Multi-Root Workspace: `*.code-workspace`로 frontend/backend/shared 등 여러 폴더를 한 워크스페이스에 열어 에이전트가 동시에 편집 가능하게 함.
8. `cursor myproject.code-workspace`로 워크스페이스 직접 열기.
9. 검색 제외: `search.exclude`에 `node_modules`, `dist`, `build`, `.next`, `coverage`, `*.min.js`, lock 파일 등 추가해 인덱싱·검색 부담 감소.
10. 인덱싱 상태 확인: Settings > Indexing and Docs에서 1–5분 수준 유지, 15분 이상이면 제외 패턴 점검.
11. Privacy Mode: 설정 > Privacy에서 활성화 시 코드가 서버에 저장되지 않음(엔터프라이즈 요구 시).
12. 알림·사운드: 병렬 에이전트 사용 시 완료 알림 설정으로 결과 확인 타이밍 파악.
13. 전역 User Rules: Cursor Settings > Rules > User Rules에 개인 선호(함수형, async/await, strict 타입 등)만 두고, 팀 규칙은 프로젝트 규칙으로 유지.

---

## 3. 규칙 (Rules)

14. 프로젝트 규칙은 `.cursor/rules/` 아래 `.mdc` 파일로 두고, description·globs·alwaysApply로 적용 범위 제어.
15. 한 규칙은 한 관심사: 스타일·API·테스트·아키텍처를 파일별로 분리 (예: `styling.mdc`, `api-conventions.mdc`, `testing.mdc`).
16. 규칙 내용은 짧게: 필수 명령, 패턴, 캐노니컬 예시 파일 경로만; 긴 스타일 가이드는 린터로.
17. 규칙에서 “이 작업 시 사용할 스킬”을 표로 명시해, 에이전트가 스킬을 참조하도록 유도.
18. globs로 파일 패턴 지정: `**/*.test.ts`, `**/components/**`, `**/api/**` 등으로 열린 파일에 맞는 규칙만 적용.
19. alwaysApply: true는 전역 표준에만 사용하고, 나머지는 globs로 제한.
20. 팀과 공유: 규칙을 git에 커밋해 팀 전체가 동일한 가이드를 사용.
21. 에이전트가 반복 실수할 때만 규칙 추가; 미리 과도하게 넣지 않기.
22. GitHub 이슈/PR에 @cursor 태그로 규칙 업데이트 요청 가능.
23. 레거시 `.cursorrules`는 프로젝트 루트 단일 파일; 대규모 프로젝트는 `.cursor/rules/`로 이전 권장.
24. AGENTS.md: 규칙의 단순 마크다운 대안으로 사용 가능.
25. 규칙 우선순위: Team Rules > Project Rules (.cursor/rules) > User Rules > .cursorrules > AGENTS.md.

---

## 4. 스킬 (Skills)

26. 스킬은 `.cursor/skills/<이름>/SKILL.md`에 YAML frontmatter(name, description)와 본문으로 정의.
27. description에 “무엇을 하는지”와 “언제 사용할지”를 함께 적어 에이전트가 발견하기 쉽게 함.
28. 스킬은 필요 시 동적으로 로드되고, 규칙은 항상 적용되는 맥락으로 구분.
29. 복잡한 워크플로는 “오케스트레이션 스킬” 하나가 세부 스킬을 순서대로 참조하도록 구성.
30. 스킬 본문은 500줄 이하 권장; 상세는 reference.md 등 별도 파일로.
31. 훅(스크립트)을 스킬과 함께 쓰면 에이전트 종료 후 자동 실행(테스트·린트 등) 가능 (Nightly).
32. 스킬로 커스텀 슬래시 명령 제공: `/` 입력 시 스킬 기반 워크플로 노출.
33. 도메인 지식·절차를 스킬로 패키징해, 규칙에서는 “이 작업 시 이 스킬 사용”만 안내.
34. 본 프로젝트: 시각화 대시보드 명세는 `visualization-dashboard-spec`, 요구사항·레이어·기법·논문·차원은 각각 세분화 스킬 참조.
35. 스킬 체크리스트: description에 트리거 용어 포함, 3인칭, 일관된 용어, 파일 참조는 1단계 깊이.

---

## 5. 인덱싱·성능

36. `.cursorignore`: .gitignore 문법으로 인덱싱·@ 참조·Tab/Agent/Inline Edit에서 제외 (API 키, credentials, .env 등).
37. `.cursorindexignore`: @로 참조는 가능하지만 인덱싱에서는 제외(문서 등).
38. node_modules, dist, build, .next, coverage, *.min.js, lock 파일은 search.exclude 또는 ignore로 제외.
39. 모노레포는 작업 중인 패키지 경로만 열어 인덱싱 범위 축소.
40. 인덱스 캐시 문제 시: Settings > Advanced > Clear Index Cache 후 제외 설정 점검하고 재인덱싱.
41. 대용량 파일(수천 줄 이상)은 필요 시에만 @로 참조; 일상 인덱싱 부담은 유지.
42. 바이너리·미디어는 기본 제외 목록에 있음; 필요 시 .cursorignore에 추가.
43. Cursor 규칙이 적용되지 않을 때: Agent 모드인지 확인(Ask 모드는 프로젝트 규칙 미적용 가능).

---

## 6. 단축키·입력

44. Cmd/Ctrl+I: Composer(에이전트) 열기 — 다중 파일 편집·리팩터에 가장 영향 큼.
45. Cmd/Ctrl+K: 인라인 편집(현재 파일 내 빠른 수정).
46. Tab: AI 제안 수락; Ctrl/Cmd+Right: 제안의 일부만 수락.
47. Shift+Tab: Plan Mode 토글 — 코드 작성 전에 계획·질문·파일 경로 정리.
48. Escape: 에이전트 실행 중 인터럽트 후 방향 수정.
49. Command Palette: Cmd/Ctrl+Shift+P로 Import, Install shell command 등 실행.
50. Composer는 기본 채팅보다 3배 수준의 효율을 기대할 수 있음(다중 파일·리팩터).
51. Plan Mode에서 “Save to workspace”로 `.cursor/plans/`에 플랜 저장해 팀 문서·재개 시 컨텍스트로 활용.
52. 새로 익힐 단축키 최소화: Tab(수락), Cmd+K(인라인), Cmd+I(에이전트), Plan(Shift+Tab).

---

## 7. 컨텍스트·@ 참조

53. @Codebase: 전체 코드베이스 의미 검색.
54. @Docs: 공식 문서 참조.
55. @Web: 온라인 검색(Pro 등).
56. @Git: 최근 Git 변경 참조.
57. @Branch: 현재 브랜치 변경으로 에이전트 방향 설정 (“이 브랜치 변경 리뷰해 줘”).
58. @symbol: 함수/클래스 정의로 점프.
59. @Files & Folders: 특정 디렉터리만 컨텍스트로 제한.
60. @filename: 특정 파일만 참조.
61. @terminal: 터미널 로그·에러 참조.
62. @Past Chats: 새 대화에서 이전 대화를 선택적으로 참조(전체 복붙 대신).
63. 필요한 파일만 @로 지정; 모르면 에이전트가 grep·의미 검색으로 찾게 두기.
64. 이미 컨텍스트에 있는 파일을 반복 @하지 않기; 응답 품질 저하 시 새 채팅 시작.
65. @ 참조를 적절히 쓰면 정확도가 크게 향상된다는 사례 있음(62%→91% 등).

---

## 8. 에이전트·플랜

66. “계획 후 코딩”: Plan Mode로 구현 계획을 먼저 만들고 승인 후 실행.
67. 플랜은 마크다운으로 열리므로 직접 편집해 불필요 단계 제거·접근 방식 수정 가능.
68. 에이전트가 요구와 다르게 만들면: 변경 revert → 플랜을 더 구체적으로 수정 → 다시 실행(후속 프롬프트로 고치기보다 빠를 수 있음).
69. 에이전트가 컨텍스트를 찾게 두기: 모든 파일을 수동으로 @하지 말고, grep·의미 검색에 맡기기.
70. 간단한 변경·반복 작업은 플랜 없이 바로 에이전트 실행해도 됨.
71. 한 논리 단위 완료 후 새 대화 시작; 같은 기능 디버깅·반복 시에는 기존 대화 유지.
72. 에이전트가 혼동하거나 같은 실수를 반복하면 새 대화 시작.
73. 대화가 길어질수록 노이즈 축적 가능 — 효과가 떨어지면 새 대화 + @Past Chats로 필요한 맥락만 전달.
74. 연구 결과: 경험 많은 개발자일수록 “계획 후 생성” 비율이 높음; Plan Mode가 이 패턴을 지원.

---

## 9. 슬래시 명령·명령

75. `/` 입력 시 프로젝트·전역·팀 명령 목록 표시.
76. 프로젝트 명령: `.cursor/commands/*.md` (예: code-review-checklist.md, setup-new-feature.md).
77. 명령에 인자 전달: `/pr these changes to address DX-523` 형태로 사용.
78. 반복 워크플로를 명령으로 등록: PR 생성, 커밋 메시지, 의존성 업데이트, 이슈 기반 수정 등.
79. 예: `/pr` — git diff 기반 커밋 메시지, commit, push, gh pr create, PR URL 반환.
80. 예: `/update-deps` — 구식 의존성 확인 후 하나씩 업데이트, 각각 테스트 실행.
81. 예: `/review` — 린터 실행, 이슈 요약.
82. 예: `/fix-issue [number]` — gh issue view, 관련 코드 찾기, 수정, PR 오픈.
83. 명령을 git에 커밋해 팀이 동일한 워크플로 사용.

---

## 10. 모델·Max 모드

84. 작업 유형별 모델 선택: 복잡한 아키텍처·버그 → Claude Opus; 일상 구현 → Claude Sonnet; 대용량 컨텍스트 → Gemini 등.
85. 에이전트 패널 좌하단 모델 선택기로 대화 중에도 전환 가능.
86. Max Mode: 확장 컨텍스트, 비용·쿼터 소모 큼; 수동으로 켜고 필요한 작업에만 사용.
87. Max Mode 적합 사례: 복잡한 의존성 체인, 모노레포·다중 리포 리팩터, 5천 줄 이상 파일 분석.
88. 일반 작업은 기본 컨텍스트로 충분히 해결 가능.
89. 응답 지연·타임아웃 시 더 가벼운 모델로 전환하거나 네트워크·Cursor 상태 페이지 확인.

---

## 11. YOLO 모드·자동화

90. Settings > Features > YOLO Mode 활성화.
91. Allow: 테스트(npm test, pytest 등), 빌드(tsc, npm run build), touch/mkdir/cp, eslint/prettier/biome, git status/diff.
92. Deny: rm -rf, sudo, ssh, curl/wget, git push/commit, npm publish, deploy 등.
93. YOLO로 에이전트가 테스트 실행 → 실패 확인 → 수정 → 재실행을 사용자 승인 없이 반복 가능.
94. 위험 명령은 deny 목록에 두고, 실수로 허용했을 때는 터미널 Cmd+Z 또는 git checkout . 로 복구.
95. 큰 에이전트 세션 전에 커밋해 두면 롤백이 수월함.

---

## 12. 대화·컨텍스트 관리

96. 새 대화 시작 시점: 한 단위 작업 완료, 에이전트 혼동, 다른 태스크/기능으로 전환할 때.
97. 대화 계속할 때: 방금 만든 것 디버깅, 이전 맥락이 필요할 때, 같은 기능 반복 개선.
98. @Past Chats로 이전 대화를 인용해 필요한 부분만 새 맥락에 포함.
99. 중복 컨텍스트 주입 지양; 품질 저하 시 대화 초기화가 유리.
100. 에이전트가 “이 브랜치에서 뭘 하고 있나?” 같은 질문에 @Branch로 방향 설정.

---

## 13. 워크플로

101. TDD: (1) 구현 만족 시 커밋 (2) “테스트 통과하는 코드 작성, 테스트 수정 금지, 통과할 때까지 반복” 지시 (3) 테스트 만족 시 커밋 (4) “테스트만 작성, 구현 금지”로 실패하는 테스트 작성 (5) TDD라고 명시해 mock 구현 유도하지 않기.
102. 코드베이스 이해: “setUser 대신 createUser를 쓰는 이유?”, “CustomerOnboardingFlow 엣지 케이스?”, “새 API 엔드포인트 추가 방법?” 등 팀원에게 물어보듯 질문.
103. Git: 히스토리 검색, 머지 충돌 해결, /pr 같은 명령으로 워크플로 자동화.
104. 리뷰: 에이전트 완료 후 Review → Find Issues로 제안 편집 라인별 검토.
105. Source Control에서 Agent Review 실행해 main 대비 로컬 변경 전체 검토.
106. Bugbot: PR 푸시 후 자동 리뷰·개선 제안.
107. 아키텍처 다이어그램: “인증 시스템 데이터 흐름 Mermaid 다이어그램, OAuth·세션·토큰 갱신 포함” 등으로 문서화·아키텍처 검토.
108. 명확한 목표 부여: “auth.ts 로그아웃 엣지 케이스 테스트, __tests__ 패턴 따르고 mock 사용하지 말 것”처럼 구체적으로.

---

## 14. 확장

109. MCP(Model Context Protocol): Slack, Datadog, Sentry, DB 등 외부 도구 연결.
110. MCP로 최신 문서·프레임워크 지식을 Cursor에 주입 (Context7, DeepWiki, mcp.nuxt.com 등).
111. Hooks: `.cursor/hooks.json`에 stop 등 훅 정의, 에이전트 종료 시 스크립트 실행(테스트·린트·알림).
112. followup_message 반환으로 에이전트 루프 계속(예: 테스트 통과할 때까지 반복).
113. Cloud Agents: cursor.com/agents 또는 에디터·폰에서 시작, 원격 샌드박스에서 실행.
114. 클라우드 에이전트 용도: 문서 업데이트, 기존 코드 테스트 생성, 최근 변경 리팩터, 별도 버그 수정.
115. Slack에서 @Cursor로 에이전트 트리거 가능.
116. 스킬·훅은 Nightly 채널에서 사용 가능.

---

## 15. 이미지·시각

117. 스크린샷을 채팅에 붙여넣어 UI·에러 상태 전달.
118. 디자인 목업 붙여넣고 “이대로 구현해 줘”로 레이아웃·색·간격 맞추기.
119. Figma MCP로 디자인 연동.
120. 시각 디버깅: 예상과 다른 UI 스크린샷으로 원인 분석 요청.
121. 브라우저 사이드바: 에이전트가 브라우저로 스크린샷·테스트·시각 검증 수행 가능.

---

## 16. 코드 리뷰·검증

122. 에이전트가 작업하는 동안 diff 보면서 잘못된 방향이면 Escape로 중단 후 재지시.
123. Review → Find Issues로 제안된 편집에 대한 전용 리뷰 패스 실행.
124. AI 생성 코드는 겉보기에 맞아도 미묘한 오류 가능; diff와 결과를 꼼꼼히 검토.
125. 타입·린터·테스트로 “올바름”에 대한 명확한 신호 제공.
126. 에이전트를 협업자처럼 대하기: 계획 요청, 설명 요청, 마음에 안드는 접근은 거절하고 재요청.

---

## 17. 병렬·클라우드 에이전트

127. Worktrees: 에이전트 드롭다운에서 worktree 옵션 선택 시 별도 worktree에서 격리 실행.
128. 한 에이전트 종료 후 Apply로 메인 브랜치에 변경 병합.
129. 여러 모델을 동시에 선택해 같은 프롬프트 실행 후 결과 비교.
130. Cursor가 “어떤 해결이 더 낫다”고 제안할 수 있음.
131. 병렬 실행 유용 사례: 엣지 케이스 발견, 모델별 품질 비교, 어려운 문제의 다양한 접근.
132. 클라우드 에이전트: 브랜치 생성 → 클론 → 작업 설명 → 자동 실행 → PR 오픈 → 알림(Slack/이메일/웹).

---

## 18. 디버그 모드

133. 일반 에이전트로 해결이 어려운 버그에 디버그 모드 사용.
134. 재현 단계를 구체적으로 제공할수록 계측·가설이 정확해짐.
135. 재현하면서 에이전트가 런타임 데이터 수집.
136. 코드에 로깅 등 계측 삽입 후 실제 동작으로 원인 좁히기.
137. 여러 가설 생성 후 근거 기반으로 타겟 수정.
138. 적합 사례: 이전에는 되던 회귀, 성능·메모리, 레이스 컨디션, 재현 가능하지만 원인 불명인 버그.

---

## 본 프로젝트(DAS) 적용 요약

- **규칙·스킬**: `.cursor/README.md` 및 `das-dashboard-spec-and-skills`, `finviz-treemap-development`, `finviz-treemap-testing` 규칙에서 작업별 스킬 명시. 명세·문서는 `finviz-like-treemap/docs/**` 열 때, 코드는 `finviz-like-treemap/web|server/**`, 테스트는 `tests/treemap/**` 열 때 각 규칙 적용.
- **Plan Mode**: 트리맵 기능 추가·리팩터·품질 테스트 연동 등 다단계 작업 전에 Shift+Tab으로 계획 수립 권장.
- **YOLO**: `npm run test`, `npm run build`, `npm run test:treemap-quality` 등이 Allow 목록에 있으면 에이전트가 테스트·빌드 반복 가능.
- **컨텍스트**: `@finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md`, `@tests/treemap/quality_runner.spec.ts` 등으로 명세·테스트 계약 전달.
- **명령**: `.cursor/commands/`에 `/pr`, `/review`, 트리맵 품질 테스트 실행 등 팀 워크플로 명령 추가 가능.

---

## 참고 출처

- [Cursor Blog: Best practices for coding with agents](https://cursor.com/blog/agent-best-practices)
- [Developer Toolkit: Setup and Configuration Tips 1–15](https://developertoolkit.ai/en/cursor-ide/tips-tricks/setup-configuration/)
- Cursor Docs: Rules, Ignore files, Commands, MCP, Hooks
- 공개된 Cursor 팁·방법론 정리 글 다수(단축키, @ 참조, CLEAR 프레임워크, RIPER-5 등)

이 문서는 프로젝트 공통 참고용이며, Cursor 버전에 따라 UI·기능 이름이 다를 수 있습니다.

---

## 항목 수 요약 (카테고리별)

| 카테고리 | 항목 번호 | 개수 |
|----------|-----------|------|
| 1. 설치·마이그레이션 | 1–5 | 5 |
| 2. 설정·구성 | 6–13 | 8 |
| 3. 규칙 | 14–25 | 12 |
| 4. 스킬 | 26–35 | 10 |
| 5. 인덱싱·성능 | 36–43 | 8 |
| 6. 단축키·입력 | 44–52 | 9 |
| 7. 컨텍스트·@ 참조 | 53–65 | 13 |
| 8. 에이전트·플랜 | 66–74 | 9 |
| 9. 슬래시 명령 | 75–83 | 9 |
| 10. 모델·Max 모드 | 84–89 | 6 |
| 11. YOLO 모드 | 90–95 | 6 |
| 12. 대화·컨텍스트 관리 | 96–100 | 5 |
| 13. 워크플로 | 101–108 | 8 |
| 14. 확장 | 109–116 | 8 |
| 15. 이미지·시각 | 117–121 | 5 |
| 16. 코드 리뷰·검증 | 122–126 | 5 |
| 17. 병렬·클라우드 | 127–132 | 6 |
| 18. 디버그 모드 | 133–138 | 6 |
| **합계** | | **138** |
