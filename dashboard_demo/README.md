# Dashboard Demo — Connection Conversion Monitoring

연결률 모니터링 대시보드. KPI 5개, 연결률 시계열(0~100%), 지역별/제품군별 막대 차트, 우측 필터(지역·제품 계층), Pivot 테이블.

## 구조
- **지역**: 글로벌 > 지역 > 법인 > 국가 (국가 이하 없음). 차트 클릭 또는 필터 버튼으로 선택.
- **제품**: 제품군 > 제품군 레벨2 > 제품군 레벨3. 지역과 독립.
- **메트릭**: 판매량 / 스마트 판매량 / 연결 수 (버튼 3개).
- **Pivot**: 행 차원 지역, 열 차원 제품군. 연결률·스마트 판매 비율 포함. 페이지당 20/50/100줄, 한 줄 페이지네이션.

## 실행
- `index.html`을 브라우저에서 연다.
- 의존: Pico CSS 1.5.11, ECharts 5.4.3 (CDN).

## 파일
| 파일 | 용도 |
|------|------|
| **index.html** | 진입점 |
| **css/dashboard.css** | 스타일 |
| **js/app.js** | 데이터·차트·필터·Pivot |
| **js/hierarchy.js** | 지역 계층(region > corporation > country) 유틸 |
| **INFO_VIZ.md** | 정보 시각화 검증 항목 및 Self-check 설명 |
