# 전체 규칙·프롬프트 검토 요약

**검토 포인트:** 실제 쿼리/파이썬의 자료형·함수 파라미터 안전장치, 에이전트·LLM(gpt-oss 등) 최적화, 규칙·스킬·서브에이전트 일관성.

---

## 1. 안전장치 마련 여부 (검토 결과)

### 1.1 검토 전 상태
- **SQL:** 02_data_contract가 스키마 출처였으나, "쿼리 작성 시 02만 사용한다", "자료형은 BigQuery 표준으로 02와 일치"라는 **명시적 규칙**이 없었음.
- **Python:** 00_reproducibility_spec에 함수·파라미터 목록은 있었으나, **y, X 등 입력의 shape/dtype 요구사항**이 없었고, "생성 전에 명세만 참조한다"는 **절차**가 rules/skills에 없었음.
- **에이전트 최적화:** 단일 출처·생성 전 체크리스트·타입 고정 등이 문서화되어 있지 않았음.

### 1.2 보완 반영 내용
| 항목 | 보완 |
|------|------|
| **SQL** | `00_code_safeguards.md` §1: 테이블·컬럼·타입은 **실행 폴더 02_data_contract §2만** 사용, BigQuery 표준 타입, 생성 전 체크리스트 3단계. |
| **Python** | `00_reproducibility_spec.md` §3: OLS/Logit/GLM/NB/lifelines 등 **입력 자료형·형상 요구사항** 표 추가. `00_code_safeguards.md` §2: 상세 입력 요구사항·코드 생성 전 체크리스트 4단계. |
| **규칙** | **R8** 추가: SQL은 02_data_contract만, Python은 00_reproducibility_spec + 00_code_safeguards만; 생성 전 스키마/시그니처 확정. |
| **SELF-CHECK** | "Code/query: schema from 02 (SQL), params/types from spec + code_safeguards (Python)?" 항목 추가. |
| **Skills** | REFERENCE에 `00_code_safeguards.md` 추가. **CODE GENERATION SAFEGUARDS** 섹션: SQL/Python 생성 전 단일 출처·체크리스트. |
| **Subagent** | BINDING에 00_code_safeguards, R8 명시. **BEFORE GENERATING CODE** 섹션: SQL은 02 §2만, Python은 spec + code_safeguards, random_state 필수. |

---

## 2. gpt-oss(에이전트·LLM) 최적화 여부

### 2.1 최적화 원칙 반영
- **단일 출처 (Single source of truth):** SQL → 02_data_contract §2. Python → 00_reproducibility_spec + 00_code_safeguards. 모호한 "자유 해석" 구간을 줄임.
- **명시적 바인딩:** "생성 전에 사용할 테이블/컬럼 목록", "사용할 함수/파라미터 목록"을 먼저 나열한 뒤 생성하도록 절차를 고정.
- **타입·파라미터 고정:** 입력 shape/dtype 표, 필수 파라미터(disp=0, loglike_method='nb2', random_state=42 등)를 문서에 명시해, 생성 시 그대로 복사 가능하게 함.
- **체크리스트:** SQL 3단계, Python 4단계 체크리스트를 00_code_safeguards에 두어, 에이전트가 단계별로 따르기 쉽게 함.

### 2.2 규칙·프롬프트 구조
- **Rules:** R0~R7은 기존 유지. R8로 "코드·쿼리 생성 시 반드시 지킬 것"을 추가. SELF-CHECK에 코드/쿼리 준수 여부 추가.
- **Skills:** REFERENCE → CODE GENERATION SAFEGUARDS → CORE CAPABILITIES 순서로, 생성 시 참조할 문서와 절차가 먼저 오도록 배치.
- **Subagent:** BINDING 직후 ANALYSIS SELECTION FLOW, 그 다음 **BEFORE GENERATING CODE**, 그 다음 RESULT EXPLANATION. 코드 생성이 필요한 작업 전에 "생성 전 절차"를 읽도록 배치.

---

## 3. 전체 규칙·프롬프트 일관성

| 문서 | 역할 | 코드·쿼리 관련 |
|------|------|----------------|
| **rules (sros-kernel.mdc)** | R0~R8, Phase lock, Evidence, Uncertainty, Visualization, **R8 Code/query safeguards**, SELF-CHECK | R8: 02만(SQL), spec+code_safeguards만(Python); 생성 전 스키마/시그니처 확정. |
| **skills (statistical-engine)** | REFERENCE, **CODE GENERATION SAFEGUARDS**, CORE CAPABILITIES, TOOL USAGE | SQL/Python 생성 전 단일 출처·체크리스트; 00_code_safeguards 참조. |
| **subagent (sros-analysis-agent)** | BINDING, ANALYSIS SELECTION, **BEFORE GENERATING CODE**, RESULT EXPLANATION, WORKFLOW | SQL → 02 §2만; Python → spec + code_safeguards, random_state=42. |
| **design/00_reproducibility_spec** | 함수·파라미터·시드, **§3 입력 자료형·형상 요구사항**, §4 랜덤, §5 버전 | y, X, durations 등 shape/dtype 표. |
| **design/00_code_safeguards** | SQL §1(스키마·타입·체크리스트), Python §2(입력 요구·체크리스트), §3 에이전트 최적화 | 단일 출처, 생성 전 절차, 타입 고정. |

---

## 4. 추가 권장 사항 (선택)

- **실행 시 검증:** 생성된 SQL을 02_data_contract 컬럼 목록과 자동 비교하는 스크립트, 또는 Python 호출 전에 y/X shape·dtype을 한 번 검사하는 래퍼는 설계에 포함하지 않았음. 필요 시 run 폴더에 `scripts/validate_sql_columns.py` 등으로 추가 가능.
- **gpt-oss 전용 프롬프트:** "When you generate SQL, first output the list of table and columns from 02_data_contract §2, then generate the query." 같은 시스템 프롬프트는 Cursor/에이전트 설정에서 rules·skills와 함께 두면 더 안정적일 수 있음.

---
*검토 일자: 2025-02-15. 설계 보완 반영 후.*
