# 트리맵 헤더 UI — 원샷/제로샷용 정확한 프롬프트

아래 프롬프트를 그대로 복사해 사용하면, 한 번에 의도한 대로 구현·수정되도록 작성했습니다.

---

## 프롬프트 (복사용)

```
[대상]
Connection Conversion Monitoring 대시보드의 Advanced 뷰 안에 있는 "트리맵" 설정 한 줄(헤더) UI.

[배치 순서 — 한 줄, 왼쪽에서 오른쪽]
1. "Treemap" 제목 텍스트
2. "크기" 라벨 + 크기 선택 콤보박스(판매/스마트 판매/연결대수)
3. "색상" 라벨 + 색상 선택 콤보박스(연결률/스마트 판매 비율)
4. "레이블축" 라벨 + "지역" 버튼 + "제품군" 버튼

반드시 한 줄로만 표시되게 하고, 줄바꿈( wrap ) 하지 말 것.

[세로 정렬 — 필수]
- 이 한 줄의 모든 요소(제목, 라벨 3개, 콤보박스 2개, 버튼 2개)를 **세로 중앙 정렬**한다.
- 즉, "크기·색상·레이블축" 라벨 텍스트가 인접한 콤보박스/버튼의 **수직 중심**과 같은 높이에 오도록 한다.
- 구현 방법: 헤더 컨테이너와 각 필드(라벨+컨트롤 묶음)에 `display: flex`, `align-items: center` 사용. 라벨과 콤보/버튼은 **동일 높이(예: 36px)**로 맞추고, 라벨에는 `line-height: 36px` 또는 `height: 36px` + `display: inline-flex` + `align-items: center` 로 텍스트가 36px 영역 안에서 세로 중앙에 오게 할 것.

[줄바꿈 방지]
- "제품군" 버튼 텍스트가 "제품" / "군"으로 나뉘지 않도록 버튼에 `white-space: nowrap` 적용.
- "레이블축", "크기", "색상" 라벨에도 `white-space: nowrap` 적용.

[스타일 통일]
- 라벨 3개(크기, 색상, 레이블축): **동일** font-size(예: 12px), font-weight(400), color(예: var(--text-muted)), font-family(inherit).
- 콤보박스 2개와 버튼 2개: **동일** 높이(36px), padding, font-size(12px), border(1px solid), border-radius, background. 즉, 버튼과 콤보가 같은 크기·스타일로 보이게 할 것.

[전역 CSS 덮어쓰기]
- 이 페이지는 Pico CSS 등 전역 스타일을 먼저 로드한다. 트리맵 헤더의 라벨/select/button 스타일이 전역 스타일에 덮어쓰이지 않도록, **반드시** 트리맵 헤더만 타깃하는 선택자를 쓸 것. 예: `#main-advanced .treemap-header .treemap-field-label`, `#main-advanced .treemap-header .treemap-field-control`, `#main-advanced .treemap-header .treemap-axis-btn`. 헤더 안의 label/select/button 에 margin: 0, padding 은 직접 지정한 값만 사용해 전역 초기화를 덮어쓸 것.

[요약 체크리스트]
- [ ] 배치: Treemap | 크기 [콤보] | 색상 [콤보] | 레이블축 [지역] [제품군] 한 줄
- [ ] 세로: 모든 요소 같은 수직 중심선(라벨이 콤보/버튼과 세로 중앙 정렬)
- [ ] 줄바꿈 없음: 제품군·레이블축·크기·색상 텍스트 nowrap
- [ ] 라벨 3개 폰트/색상 동일
- [ ] 콤보 2개·버튼 2개 높이·스타일 동일(36px 등)
- [ ] 선택자: #main-advanced .treemap-header 하위로 한정
```

---

## 사용 방법

1. **새로 구현할 때**: 위 프롬프트를 붙여넣고, "위 요구사항대로 트리맵 헤더 HTML과 CSS를 작성해줘" 라고 이어서 요청.
2. **이미 있는 코드 수정할 때**: 위 프롬프트를 붙여넣고, "현재 `index.html`의 트리맵 헤더와 `dashboard.css`의 트리맵 관련 스타일을 위 요구사항에 맞게 수정해줘" 라고 요청.

로컬이라 캐시는 없을 수 있으니, "선택자가 전역 스타일보다 우선하도록 `#main-advanced .treemap-header` 로 스코프를 한정해줘" 를 강조한 부분이 중요합니다.
