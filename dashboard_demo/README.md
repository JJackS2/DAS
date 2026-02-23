# Dashboard Demo — Connection Conversion Monitoring (v11)

연결률 모니터링 대시보드. KPI 카드 5개, 연결률 라인 차트, 지역별/제품군별 가로 막대 차트, 필터·드릴다운·Pivot.

## 실행

- `index.html`을 브라우저에서 연다 (로컬 파일 또는 로컬 서버).
- 의존: Pico CSS 1.5.11, ECharts 5.4.3 (CDN 로드).

## 파일

| 파일 | 용도 |
|------|------|
| **index.html** | 진입점 |
| **css/dashboard.css** | 스타일 |
| **js/app.js** | 데이터·차트·필터·드릴·Pivot |
| **.cursor/rules/dashboard-connection-conversion.mdc** | Cursor용 통합 규칙 |
| **agent.md** | 구현·제약 상세 (참고용) |
