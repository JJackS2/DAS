# 트리맵 관련 논문 참고 문헌 (최신 → 최초)

DAS 대시보드는 **비즈니스 인텔리전스(BI)를 위한 시각화 대시보드**이며, **트리맵을 사용한 다차원 데이터 분석**을 지원한다. 다차원성은 (1) 위치 계층(region → subsidiary 등), (2) 제품 계층(division → product_l2 → product_l3 등), (3) 시간 지표(dateKey), (4) 메트릭(sales, attach_rate 등)을 함께 사용하기 때문에 발생한다. 데이터 차원은 현재 이 수준으로 고정되어 있고, 데이터셋 구조 제안은 옵션이며, 현재 범위는 이 데이터 구성에서의 분석 지원이다.

아래 문헌은 트리맵 설계·품질 지표 및 26년 최신까지의 논문 흐름 정렬에 참조된다. **최신부터 최초 논문 순**으로 나열한다.

---

## 2020년대

### Taxonomy of treemap visualization techniques
- **저자**: Scheibel, W.; Trapp, M.; Limberger, D.; Döllner, J.
- **출처**: University of Potsdam / Hasso Plattner Institute. 2020.
- **PDF**: [publishup.uni-potsdam.de](https://publishup.uni-potsdam.de/opus4-ubp/files/52469/pde008.pdf)
- **요약**: 트리맵 기법을 4단계 위계로 분류 — **Space-filling Treemap (TS)** ⊂ **Containment Treemap (TC)** ⊂ **Implicit Edge Representation Tree (TIE)** ⊂ **Mapped Tree (TMT)**. 모든 기법이 “containment”(자식이 부모 경계 내 완전 포함)에 기반함을 명시.
- **본 프로젝트**: **TS(공간 채우기)** 유형 채택; 상위 레벨 upperLabel로 계층 명시.

### Algorithmic improvements on Hilbert and Moore treemaps
- **출처**: EuroVis 2021 등 (EG Digital Library).
- **요약**: Hilbert/Moore 곡선 기반 트리맵에서 시계열·시간 변동 데이터에 대한 **레이아웃 안정성** 개선; subdivision 템플릿·방향 최적화.
- **본 프로젝트**: path/데이터 변경 시 `resize()`·`notMerge: true`로 복구하는 정책에 참고.

### Treemap Literacy: A Classroom-Based Investigation
- **저자**: Firat, E. A. et al.
- **출처**: 2020. [people.cs.nott.ac.uk](https://people.cs.nott.ac.uk/blaramee/research/literacy/firat20treemap.pdf)
- **요약**: 트리맵 **구성·해석 능력**(literacy)에 대한 교실 기반 연구; 비전문가의 이해 장벽, 설계 파라미터가 복잡도에 미치는 영향; 교육용 도구·리터러시 테스트 제안.
- **본 프로젝트**: 2줄 레이블, 최소 폰트 9px, min side 18px 미만 시 라벨 숨김 등 **가독성 제어**에 반영.

### Map-like vs nested treemaps: comparative evaluation
- **출처**: arXiv 2019 (Human-Computer Interaction) 등.
- **요약**: 맵 유사 시각화 vs 중첩 트리맵 비교 실험 — 정확도·작업 속도·사용성. 중첩 트리맵이 **작업 속도·사용성**에서 유리한 결과.
- **본 프로젝트**: **2레벨 중첩 트리맵** 유지.

---

## 2000년대

### Ordered Treemap Layouts (journal)
- **저자**: Bederson, B. B.; Shneiderman, B.; Wattenberg, M.
- **출처**: *ACM Transactions on Graphics*, 2002. [UMD](https://www.cs.umd.edu/~ben//papers/Bederson2002Ordered.pdf)
- **요약**: **Strip**·**Pivot** 알고리즘; 데이터 **순서 유지** + 동적 데이터에서 **안정성** + **aspect ratio** 균형. Monte Carlo·주식 데이터로 실험.
- **수상**: IEEE VIS Test of Time Award 2021 (1,000+ 인용).
- **본 프로젝트**: ECharts treemap의 레이아웃(순서·비율)에 위 원칙이 반영됨.

### Ordered treemap layouts (conference)
- **저자**: Shneiderman, B.; Wattenberg, M.
- **출처**: *IEEE Symposium on Information Visualization (INFOVIS)*, 2001. [UMD](https://www.cs.umd.edu/~ben/papers/Shneiderman2001Ordered.pdf)
- **요약**: 위 2002 논문의 학회 버전.

### Squarified Treemaps
- **저자**: Bruls, M.; Huizing, K.; van Wijk, J. J.
- **출처**: *Proceedings of the Joint Eurographics and IEEE TCVG Symposium on Visualization (VisSym)*, Vienna, 2000, pp. 33–42. Springer.
- **요약**: **사각형에 가깝게** 분할하여 slice-and-dice의 가늘고 긴 사각형 문제 완화; 그룹별 **쉐이딩 프레임**으로 계층 강조.
- **본 프로젝트**: 품질 지표 **arP95, arMax**(aspect ratio)로 평가.

---

## 1990년대 (최초)

### Tree visualization with tree-maps: A 2-d space-filling approach
- **저자**: Shneiderman, B.
- **출처**: *ACM Transactions on Graphics*, Vol. 11, No. 1, January 1992, pp. 92–99. (원 기술보고서: HCIL TR 91-03, March 1991.)
- **링크**: [UMD HCIL](https://www.cs.umd.edu/hcil/trs/91-03/91-03.html), [Treemap history](https://www.cs.umd.edu/hcil/treemap-history/)
- **요약**: 계층 구조를 **2차원 공간 채우기**로 표현; 노드 **면적**이 양적 속성(예: 파일 크기)에 비례. slice-and-dice 재귀 분할. 수만 노드까지 고정 공간에서 표현 가능.
- **본 프로젝트**: **공간 채우기 트리맵**의 기원; value ∝ 면적, 2레벨 노드·리프 구조의 이론적 근거.

---

## 본 프로젝트와의 매핑

| 설계 요소 | 참조 문헌 |
|-----------|-----------|
| BI·다차원 분석 | 위치 계층 + 제품 계층 + 시간 + 메트릭; 명세 §0.0, §0.6 |
| 공간 채우기, 면적 ∝ value | Shneiderman (1992) |
| 사각형 비율(AR) 품질 | Bruls et al. (2000), Bederson et al. (2001–2002) |
| 2레벨·계층 라벨 | Taxonomy (2020) TS/TC |
| 가독성·레이블·min side | Treemap literacy (2020), 품질 지표(arP95, minP50, tinyPct) |
| 동적 데이터·복구 | Hilbert/Moore 개선(2021), Ordered(2001–2002) |
