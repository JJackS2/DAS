---
name: cursor-suitability-evaluation
description: Runs Cursor suitability evaluation for the project: checks rules, skills, docs, commands, workspace, indexing, and verifiable goals against docs/CURSOR_SUITABILITY_EVALUATION.md criteria; scores each area (100 total) and records result in CURSOR_SUITABILITY_SCORE.md. Use when "Cursor 적합성 평가", "점수 재평가", "구성 여부 확인", or "내부 품질 평가" is requested.
---

# Cursor 적합성 평가 (평가 방법 스킬)

본 스킬은 **평가 방법이 스킬로 정의된 것**이다. 에이전트가 “Cursor 적합성 평가해 줘”, “점수 재평가해 줘” 등으로 요청하면 이 스킬에 따라 평가를 실행한다.

## 평가 기준·점수 근거

- **기준 문서**: `docs/CURSOR_SUITABILITY_EVALUATION.md`
  - §0: 점수 기준이 무엇인지, 왜 “높게 만족하면 잘 만들어진 것”으로 보는지(기준 출처·배점 비율·90점 이상의 정의).
  - §2: 5개 영역·세부 항목·배점·확인 방법.
  - §3: 총점 100, 등급(90+ Excellent, 75–89 Good, 60–74 Fair, 0–59 Needs improvement).
- **점수 기록**: `docs/CURSOR_SUITABILITY_SCORE.md`에 평가 일자·영역별 점수·총점·등급·미달 항목을 기록.

## 실행 절차

1. **규칙(25점)**: .cursor/rules/*.mdc — globs, 작업별 스킬 표, 한 관심사·50줄 권장, 캐노니컬 참조, description. 표대로 확인 후 0~25 부여.
2. **스킬(25점)**: .cursor/skills/*/SKILL.md — WHAT+WHEN, 단일 책임, 500줄·참조 1단계, 트리거 용어, 다음 단계. 표대로 확인 후 0~25 부여.
3. **문서·아키텍처(25점)**: ARCHITECTURE.md, MODULES.md, 알고리즘 섹션, 계약·ID·선택자, AGENTS.md. 표대로 확인 후 0~25 부여.
4. **명령·워크스페이스·인덱싱(15점)**: .cursor/commands(2개 이상), DAS.code-workspace, .cursorignore 또는 search.exclude. 표대로 확인 후 0~15 부여.
5. **검증(10점)**: E2E 테스트 존재·실행 가능, 계약 문서화(TEST_RULES §4, DEVELOPMENT_RULES §5). 0~10 부여.
6. **총점·등급**: 합계 → 등급. CURSOR_SUITABILITY_SCORE.md 갱신(평가 일자, 영역별 점수, 총점, 등급, 미달·개선 권장).

## 다음 단계

- 미달 항목이 있으면 해당 항목 보완 후 이 스킬로 재평가.
- 규칙에서 “Cursor 적합성 지표 유지”는 **cursor-rules-quality.mdc** 규칙을 참조(해당 규칙이 이 평가 지표를 만족하도록 유도함).
