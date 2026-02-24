/**
 * Connection Conversion Monitoring (v11) — ECharts 5.4.3, 필터 접기/펼치기, 필터 항목·체크리스트
 */
(function() {
  var TOPBAR_H = 48;
  var TOAST_MSG = 'LAYOUT GUARD FAIL: horizontal overflow';
  var RENDER_GUARD_MSG = 'RENDER GUARD: 차트 미렌더';
  var CACHE_KEY = 'ccm_cache_flag';
  var PAGE_SIZE = 5;

  var COLOR_MAP = {
    sales: '#0F766E',
    connected: '#B45309',
    smart_sales: '#2563EB',
    conn_rate: '#1428A0',
    smart_conn_rate: '#7C3AED'
  };

  // UN geoscheme 기반 12개 지역 (위키백과 United Nations geoscheme)
  var REGIONS = ['NAM', 'SAM', 'WEU', 'EEU', 'NEU', 'SEU', 'EAS', 'SEA', 'SAS', 'WAS', 'NAF', 'SAF'];
  var REGION_LABELS = { NAM: '북미', SAM: '남미', WEU: '서유럽', EEU: '동유럽', NEU: '북유럽', SEU: '남유럽', EAS: '동아시아', SEA: '동남아', SAS: '남아시아', WAS: '서아시아', NAF: '북아프리카', SAF: '남아프리카' };
  var REGIONS_ENTITIES = { NAM: ['E1', 'E2'], SAM: ['E1', 'E2'], WEU: ['E1', 'E2'], EEU: ['E1', 'E2'], NEU: ['E1', 'E2'], SEU: ['E1', 'E2'], EAS: ['E1', 'E2'], SEA: ['E1', 'E2'], SAS: ['E1', 'E2'], WAS: ['E1', 'E2'], NAF: ['E1', 'E2'], SAF: ['E1', 'E2'] };
  var ENTITY_LABELS = { E1: '법인1', E2: '법인2' };
  var PRODUCT_GROUPS = ['REF', 'WSH', 'KIT', 'VAC', 'AIR', 'TV'];
  var PRODUCT_LABELS = { REF: '냉장고', WSH: '세탁기', KIT: '주방', VAC: '청소기', AIR: '에어컨', TV: 'TV' };
  var MONTHS = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07'];

  function buildRawData() {
    var out = [];
    var seed = 12345;
    for (var mi = 0; mi < MONTHS.length; mi++) {
      for (var ri = 0; ri < REGIONS.length; ri++) {
        var entities = REGIONS_ENTITIES[REGIONS[ri]] || ['ENT'];
        for (var ei = 0; ei < entities.length; ei++) {
          for (var pi = 0; pi < PRODUCT_GROUPS.length; pi++) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            var sales = 600 + (seed % 1800);
            var smartRatio = 0.68 + (seed % 20) / 100;
            var connRatio = 0.65 + (seed % 25) / 100;
            var smart_sales = Math.round(sales * smartRatio);
            var connected = Math.round(smart_sales * connRatio);
            var smart_sales_rate_pct = sales > 0 ? (smart_sales / sales * 100) : 0;
            var connected_rate_pct = smart_sales > 0 ? (connected / smart_sales * 100) : 0;
            out.push({
              year_month: MONTHS[mi],
              region: REGIONS[ri],
              entity: entities[ei],
              country: 'XX',
              product_group: PRODUCT_GROUPS[pi],
              sales: sales,
              smart_sales: smart_sales,
              connected: connected,
              smart_sales_rate_pct: Math.round(smart_sales_rate_pct * 10) / 10,
              connected_rate_pct: Math.round(connected_rate_pct * 10) / 10
            });
          }
        }
      }
    }
    return out;
  }

  var rawData = buildRawData();
  var filterRegion = null;
  var filterProductGroup = null;
  var filterPeriodStart = MONTHS[0];
  var filterPeriodEnd = MONTHS[MONTHS.length - 1];
  var drillStack = [];
  var pivotSort = { key: null, asc: true };
  var pivotPage = 0;
  var state = { metric: 'sales' };

  var chartLine = null;
  var chartBarRegion = null;
  var chartBarProduct = null;
  var drillIntent = false;
  var guideStep = 0;
  var GUIDE_STEPS = 4;

  function setThemeByMetric(metric) {
    var color = COLOR_MAP[metric] || COLOR_MAP.sales;
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);
    var root = document.documentElement;
    if (root) {
      root.style.setProperty('--metricColor', color);
      root.style.setProperty('--metricColorSoft', 'rgba(' + r + ',' + g + ',' + b + ',0.35)');
    }
  }

  function fmtNum(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString();
  }
  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toFixed(1) + '%';
  }

  function showToast(msg, isInfo) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('toast-info');
    if (isInfo) el.classList.add('toast-info');
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 4000);
  }

  function updateCachePill() {
    var pill = document.getElementById('cache-pill');
    if (!pill) return;
    try {
      var v = sessionStorage.getItem(CACHE_KEY);
      var hit = (v === 'hit');
      sessionStorage.setItem(CACHE_KEY, hit ? 'miss' : 'hit');
      pill.textContent = hit ? 'CACHE HIT' : 'CACHE MISS';
      pill.className = 'pill ' + (hit ? 'hit' : 'miss');
    } catch (e) {
      pill.textContent = 'CACHE —';
      pill.className = 'pill';
    }
  }

  function getFilteredData() {
    var list = rawData.slice();
    if (filterRegion) list = list.filter(function(r) { return r.region === filterRegion; });
    if (filterProductGroup) list = list.filter(function(r) { return r.product_group === filterProductGroup; });
    if (filterPeriodStart) list = list.filter(function(r) { return r.year_month >= filterPeriodStart; });
    if (filterPeriodEnd) list = list.filter(function(r) { return r.year_month <= filterPeriodEnd; });
    return list;
  }

  function getKPI(list) {
    var sales = 0, smart_sales = 0, connected = 0;
    list.forEach(function(r) {
      sales += r.sales;
      smart_sales += r.smart_sales;
      connected += r.connected;
    });
    return {
      sales: sales,
      smart_sales: smart_sales,
      connected: connected,
      smart_sales_rate_pct: sales > 0 ? (smart_sales / sales * 100) : null,
      connected_rate_pct: smart_sales > 0 ? (connected / smart_sales * 100) : null
    };
  }

  function getMetricValueAgg(list) {
    var k = getKPI(list);
    switch (state.metric) {
      case 'sales': return k.sales;
      case 'smart_sales': return k.smart_sales;
      case 'connected': return k.connected;
      case 'conn_rate': return k.connected_rate_pct;
      case 'smart_conn_rate': return k.smart_sales_rate_pct;
      default: return k.sales;
    }
  }

  function isRateMetric() {
    return state.metric === 'conn_rate' || state.metric === 'smart_conn_rate';
  }

  function formatMetricValue(v) {
    return isRateMetric() ? fmtPct(v) : fmtNum(v);
  }

  /** 기간 필터 옵션 채우기 및 바인딩 */
  function initPeriodFilter() {
    var startEl = document.getElementById('filter-period-start');
    var endEl = document.getElementById('filter-period-end');
    if (!startEl || !endEl) return;
    MONTHS.forEach(function(ym) {
      var opt = document.createElement('option');
      opt.value = opt.textContent = ym;
      startEl.appendChild(opt);
      var opt2 = document.createElement('option');
      opt2.value = opt2.textContent = ym;
      endEl.appendChild(opt2);
    });
    startEl.value = filterPeriodStart;
    endEl.value = filterPeriodEnd;
    startEl.addEventListener('change', function() {
      filterPeriodStart = this.value;
      if (filterPeriodStart > filterPeriodEnd) filterPeriodEnd = filterPeriodStart;
      endEl.value = filterPeriodEnd;
      updateState();
    });
    endEl.addEventListener('change', function() {
      filterPeriodEnd = this.value;
      if (filterPeriodEnd < filterPeriodStart) filterPeriodStart = filterPeriodEnd;
      startEl.value = filterPeriodStart;
      updateState();
    });
  }

  /** 필터 항목 렌더 — 지역·제품군 목록 */
  function renderFilterLists() {
    var regions = [];
    var products = [];
    rawData.forEach(function(r) {
      if (regions.indexOf(r.region) === -1) regions.push(r.region);
      if (products.indexOf(r.product_group) === -1) products.push(r.product_group);
    });
    regions.sort();
    products.sort();

    var regionList = document.getElementById('filter-region-list');
    if (regionList) {
      regionList.innerHTML = regions.map(function(reg) {
        var active = filterRegion === reg ? ' active' : '';
        var label = REGION_LABELS[reg] || reg;
        return '<button type="button" class="filter-chip' + active + '" data-region="' + reg + '">' + label + '</button>';
      }).join('');
      regionList.querySelectorAll('.filter-chip').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var reg = this.getAttribute('data-region');
          filterRegion = filterRegion === reg ? null : reg;
          updateState();
          renderFilterLists();
          advanceGuideIfStep(1);
        });
      });
    }

    var productList = document.getElementById('filter-product-list');
    if (productList) {
      productList.innerHTML = products.map(function(pg) {
        var active = filterProductGroup === pg ? ' active' : '';
        var label = PRODUCT_LABELS[pg] || pg;
        return '<button type="button" class="filter-chip' + active + '" data-product="' + pg + '">' + label + '</button>';
      }).join('');
      productList.querySelectorAll('.filter-chip').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var pg = this.getAttribute('data-product');
          filterProductGroup = filterProductGroup === pg ? null : pg;
          updateState();
          renderFilterLists();
        });
      });
    }
  }

  /** ECharts: 연결률 시계열 — X축(월), Y축(%) 여유 범위, 소수점 1자리 */
  function renderLineChart() {
    var dom = document.getElementById('line-chart');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartLine) chartLine = echarts.init(dom);
    var list = getFilteredData();
    var byMonth = {};
    list.forEach(function(r) {
      if (!byMonth[r.year_month]) byMonth[r.year_month] = [];
      byMonth[r.year_month].push(r);
    });
    var months = Object.keys(byMonth).sort();
    var values = months.map(function(ym) {
      var k = getKPI(byMonth[ym]);
      return k.connected_rate_pct != null ? k.connected_rate_pct : 0;
    });
    var dataMin = values.length ? Math.min.apply(null, values) : 0;
    var dataMax = values.length ? Math.max.apply(null, values) : 100;
    var pad = Math.max(8, (dataMax - dataMin) * 0.15 || 8);
    var yMin = Math.max(0, dataMin - pad);
    var yMax = Math.min(100, dataMax + pad);
    chartLine.setOption({
      grid: { left: 52, right: 28, top: 28, bottom: 36 },
      xAxis: { type: 'category', data: months, name: '월', axisLabel: { rotate: 0 } },
      yAxis: {
        type: 'value',
        name: '연결률 (%)',
        min: yMin,
        max: yMax,
        axisLabel: { formatter: function(v) { return Number(v).toFixed(1) + '%'; } }
      },
      series: [{
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: COLOR_MAP.conn_rate, width: 2 },
        itemStyle: { color: COLOR_MAP.conn_rate },
        label: {
          show: true,
          position: 'top',
          formatter: function(params) { return params.value != null ? params.value.toFixed(1) + '%' : ''; }
        }
      }]
    }, true);
  }

  /** ECharts: 지역별 가로 막대 — 드릴 시 해당 지역 법인별로 전환 */
  function renderBarChartRegion() {
    var dom = document.getElementById('bar-chart-region');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartBarRegion) chartBarRegion = echarts.init(dom);
    var list = getFilteredData();
    var titleEl = document.getElementById('chart-title-region');
    var byKey, keys, getName;
    if (filterRegion) {
      byKey = {};
      list.forEach(function(r) {
        if (!byKey[r.entity]) byKey[r.entity] = [];
        byKey[r.entity].push(r);
      });
      keys = Object.keys(byKey).sort();
      getName = function(k) { return ENTITY_LABELS[k] || k; };
      if (titleEl) titleEl.textContent = '지역별 > ' + (REGION_LABELS[filterRegion] || filterRegion) + ' (법인별)';
    } else {
      byKey = {};
      list.forEach(function(r) {
        if (!byKey[r.region]) byKey[r.region] = [];
        byKey[r.region].push(r);
      });
      keys = Object.keys(byKey).sort();
      getName = function(k) { return REGION_LABELS[k] || k; };
      if (titleEl) titleEl.textContent = '지역별';
    }
    var color = COLOR_MAP[state.metric] || COLOR_MAP.sales;
    var data = keys.map(function(k) {
      return { value: getMetricValueAgg(byKey[k]), name: k };
    });
    var yLabels = keys.map(getName);
    chartBarRegion.setOption({
      grid: { left: 56, right: 64, top: 16, bottom: 24 },
      xAxis: { type: 'value', name: state.metric, axisLabel: { formatter: isRateMetric() ? '{value}%' : '{value}' } },
      yAxis: { type: 'category', data: yLabels, inverse: true },
      series: [{
        type: 'bar',
        data: data.map(function(d) { return d.value; }),
        itemStyle: { color: color },
        label: {
          show: true,
          position: 'right',
          formatter: function(params) { return formatMetricValue(params.value); }
        }
      }]
    }, true);
    chartBarRegion.off('click').off('dblclick');
    function getClickedKey(params) {
      var idx = params.dataIndex;
      return keys[idx] != null ? keys[idx] : null;
    }
    chartBarRegion.on('click', function(params) {
      if (params.componentType !== 'series') return;
      var key = getClickedKey(params);
      if (key == null) return;
      if (filterRegion) return;
      if (drillIntent) {
        drillStack.push({ region: filterRegion, product_group: filterProductGroup });
        drillIntent = false;
        showToast('드릴다운 적용됨. Back으로 복원할 수 있습니다.', true);
      }
      filterRegion = key;
      updateState();
      renderFilterLists();
      advanceGuideIfStep(2);
    });
    chartBarRegion.on('dblclick', function(params) {
      if (params.componentType !== 'series') return;
      var key = getClickedKey(params);
      if (key == null) return;
      if (filterRegion) return;
      drillStack.push({ region: filterRegion, product_group: filterProductGroup });
      showToast('드릴다운 적용됨. Back으로 복원할 수 있습니다.', true);
      filterRegion = key;
      updateState();
      renderFilterLists();
      advanceGuideIfStep(2);
    });
  }

  /** ECharts: 제품군별 가로 막대 */
  function renderBarChartProduct() {
    var dom = document.getElementById('bar-chart-product');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartBarProduct) chartBarProduct = echarts.init(dom);
    var list = getFilteredData();
    var byProduct = {};
    list.forEach(function(r) {
      if (!byProduct[r.product_group]) byProduct[r.product_group] = [];
      byProduct[r.product_group].push(r);
    });
    var products = Object.keys(byProduct).sort();
    var productLabels = products.map(function(pg) { return PRODUCT_LABELS[pg] || pg; });
    var color = COLOR_MAP[state.metric] || COLOR_MAP.sales;
    var data = products.map(function(pg) {
      return { value: getMetricValueAgg(byProduct[pg]), name: pg };
    });
    chartBarProduct.setOption({
      grid: { left: 56, right: 64, top: 16, bottom: 24 },
      xAxis: { type: 'value', name: state.metric, axisLabel: { formatter: isRateMetric() ? '{value}%' : '{value}' } },
      yAxis: { type: 'category', data: productLabels, inverse: true },
      series: [{
        type: 'bar',
        data: data.map(function(d) { return d.value; }),
        itemStyle: { color: color },
        label: {
          show: true,
          position: 'right',
          formatter: function(params) { return formatMetricValue(params.value); }
        }
      }]
    }, true);
    chartBarProduct.off('click').off('dblclick');
    function getProductName(params) {
      return params.name != null ? params.name : (products[params.dataIndex]);
    }
    chartBarProduct.on('click', function(params) {
      if (params.componentType !== 'series') return;
      var name = getProductName(params);
      if (name == null) return;
      if (drillIntent) {
        drillStack.push({ region: filterRegion, product_group: filterProductGroup });
        drillIntent = false;
        showToast('드릴다운 적용됨. Back으로 복원할 수 있습니다.', true);
      }
      filterProductGroup = name;
      updateState();
      renderFilterLists();
    });
    chartBarProduct.on('dblclick', function(params) {
      if (params.componentType !== 'series') return;
      var name = getProductName(params);
      if (name == null) return;
      drillStack.push({ region: filterRegion, product_group: filterProductGroup });
      showToast('드릴다운 적용됨. Back으로 복원할 수 있습니다.', true);
      filterProductGroup = name;
      updateState();
      renderFilterLists();
    });
  }

  function updateSelection() {
    var el = document.getElementById('selection');
    if (!el) return;
    if (filterRegion == null && filterProductGroup == null) {
      el.textContent = '선택: 글로벌 (전체)';
    } else {
      var parts = [];
      if (filterRegion) parts.push('지역 ' + (REGION_LABELS[filterRegion] || filterRegion));
      if (filterProductGroup) parts.push('제품군 ' + (PRODUCT_LABELS[filterProductGroup] || filterProductGroup));
      if (drillStack.length) {
        el.innerHTML = '선택: ' + parts.join(', ') + ' <span class="badge">의존 적용</span>';
      } else {
        el.textContent = '선택: ' + parts.join(', ');
      }
    }
  }

  function updateKPI() {
    var list = getFilteredData();
    var k = getKPI(list);
    var ids = ['kpi-sales', 'kpi-smart-sales', 'kpi-connected', 'kpi-smart-sales-rate', 'kpi-connected-rate'];
    var vals = [fmtNum(k.sales), fmtNum(k.smart_sales), fmtNum(k.connected), fmtPct(k.smart_sales_rate_pct), fmtPct(k.connected_rate_pct)];
    ids.forEach(function(id, i) {
      var el = document.getElementById(id);
      if (el) el.textContent = vals[i];
    });
  }

  function updateState() {
    setThemeByMetric(state.metric);
    updateSelection();
    updateKPI();
    renderLineChart();
    renderBarChartRegion();
    renderBarChartProduct();
    var btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.disabled = drillStack.length === 0;
  }

  function getPivotRows() {
    var list = getFilteredData();
    var byKey = {};
    list.forEach(function(r) {
      var k = r.region;
      if (!byKey[k]) byKey[k] = [];
      byKey[k].push(r);
    });
    return Object.keys(byKey).sort().map(function(k) {
      var rows = byKey[k];
      var kpi = getKPI(rows);
      return {
        dim: k,
        sales: kpi.sales,
        smart_sales: kpi.smart_sales,
        connected: kpi.connected,
        smart_sales_rate_pct: kpi.smart_sales_rate_pct,
        connected_rate_pct: kpi.connected_rate_pct
      };
    });
  }

  function renderPivot() {
    var rows = getPivotRows();
    if (pivotSort.key) {
      rows.sort(function(a, b) {
        var va = a[pivotSort.key], vb = b[pivotSort.key];
        if (va == null) va = 0;
        if (vb == null) vb = 0;
        return pivotSort.asc ? (va - vb) : (vb - va);
      });
    }
    var totalSales = 0, totalSmart = 0, totalConn = 0;
    rows.forEach(function(r) {
      totalSales += r.sales;
      totalSmart += r.smart_sales;
      totalConn += r.connected;
    });
    var totalSmartRate = totalSales > 0 ? (totalSmart / totalSales * 100) : null;
    var totalConnRate = totalSmart > 0 ? (totalConn / totalSmart * 100) : null;

    var start = pivotPage * PAGE_SIZE;
    var pageList = rows.slice(start, start + PAGE_SIZE);
    var tbody = document.querySelector('#pivot-table tbody');
    if (tbody) {
      tbody.innerHTML = pageList.map(function(r) {
        return '<tr><td>' + r.dim + '</td><td class="numeric">' + fmtNum(r.sales) + '</td><td class="numeric">' + fmtNum(r.smart_sales) + '</td><td class="numeric">' + fmtNum(r.connected) + '</td><td class="numeric">' + fmtPct(r.smart_sales_rate_pct) + '</td><td class="numeric">' + fmtPct(r.connected_rate_pct) + '</td></tr>';
      }).join('');
    }
    var elSales = document.getElementById('pivot-total-sales');
    var elSmart = document.getElementById('pivot-total-smart-sales');
    var elConn = document.getElementById('pivot-total-connected');
    var elSmartRate = document.getElementById('pivot-total-smart-rate');
    var elConnRate = document.getElementById('pivot-total-connected-rate');
    if (elSales) elSales.textContent = fmtNum(totalSales);
    if (elSmart) elSmart.textContent = fmtNum(totalSmart);
    if (elConn) elConn.textContent = fmtNum(totalConn);
    if (elSmartRate) elSmartRate.textContent = fmtPct(totalSmartRate);
    if (elConnRate) elConnRate.textContent = fmtPct(totalConnRate);

    var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    var paging = document.getElementById('pivot-paging');
    if (paging) {
      paging.innerHTML = '<span>페이지 ' + (pivotPage + 1) + ' / ' + totalPages + '</span>' +
        '<button type="button" id="pivot-prev">이전</button><button type="button" id="pivot-next">다음</button>';
      var prev = document.getElementById('pivot-prev');
      var next = document.getElementById('pivot-next');
      if (prev) prev.onclick = function() { if (pivotPage > 0) { pivotPage--; renderPivot(); } };
      if (next) next.onclick = function() { if (pivotPage < totalPages - 1) { pivotPage++; renderPivot(); } };
    }
  }

  function runSelfCheck() {
    var doc = document.documentElement;
    var topbar = document.getElementById('topbar');
    var main = document.getElementById('main');
    var right = document.getElementById('right-panel');
    var regionList = document.getElementById('filter-region-list');
    var productList = document.getElementById('filter-product-list');
    var kpiSalesEl = document.getElementById('kpi-sales');
    var pivotSalesEl = document.getElementById('pivot-total-sales');
    var kpiSales = kpiSalesEl ? (kpiSalesEl.textContent.replace(/,/g, '')) : '';
    var pivotSales = pivotSalesEl ? (pivotSalesEl.textContent.replace(/,/g, '')) : '';

    var items = [];
    items.push({ name: 'L1 가로 오버플로우', pass: doc.scrollWidth <= doc.clientWidth + 1, detail: 'scrollWidth=' + doc.scrollWidth + ' clientWidth=' + doc.clientWidth });
    var topbarBottom = topbar ? topbar.getBoundingClientRect().bottom : 0;
    var mainTop = main ? main.getBoundingClientRect().top : 0;
    items.push({ name: 'topbar vs main 겹침 없음', pass: mainTop >= topbarBottom - 2, detail: 'topbarBottom=' + topbarBottom + ' mainTop=' + mainTop });
    var rightCollapsed = right && right.classList.contains('collapsed');
    items.push({ name: '우측 패널 접기 시 가로 오버플로우 없음', pass: rightCollapsed ? (doc.scrollWidth <= doc.clientWidth + 1) : true, detail: rightCollapsed ? ('scrollWidth=' + doc.scrollWidth) : 'N/A' });
    items.push({ name: '라인 차트(ECharts) 존재', pass: !!chartLine, detail: chartLine ? 'OK' : '미초기화' });
    items.push({ name: '지역 가로 막대 차트 존재', pass: !!chartBarRegion, detail: chartBarRegion ? 'OK' : '미초기화' });
    items.push({ name: '제품군 가로 막대 차트 존재', pass: !!chartBarProduct, detail: chartBarProduct ? 'OK' : '미초기화' });
    var regionCount = regionList ? regionList.children.length : 0;
    items.push({ name: '필터 지역 항목 존재', pass: regionCount >= 1, detail: '지역 항목 수=' + regionCount });
    var productCount = productList ? productList.children.length : 0;
    items.push({ name: '필터 제품군 항목 존재', pass: productCount >= 1, detail: '제품군 항목 수=' + productCount });
    items.push({ name: 'KPI 값이 — 가 아님', pass: kpiSales !== '—' && kpiSales !== '', detail: 'kpi-sales=' + kpiSales });
    items.push({ name: 'KPI vs Pivot 합계 일치', pass: String(kpiSales) === String(pivotSales), detail: 'KPI sales=' + kpiSales + ', Pivot sales=' + pivotSales });

    var html = items.map(function(it) {
      var cls = it.pass ? 'pass' : 'fail';
      return '<div class="item ' + cls + '">' + (it.pass ? 'PASS' : 'FAIL') + ': ' + it.name + ' (' + it.detail + ')</div>';
    }).join('');
    var results = document.getElementById('self-check-results');
    if (results) results.innerHTML = html;
  }

  function checkHorizontalOverflow() {
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      showToast(TOAST_MSG);
      return false;
    }
    return true;
  }

  function assertRenderGuard() {
    var ok = !!chartLine && !!chartBarRegion && !!chartBarProduct;
    if (!ok) showToast(RENDER_GUARD_MSG);
    return ok;
  }

  function setupDrillIntentOnCharts() {
    var regionDom = document.getElementById('bar-chart-region');
    var productDom = document.getElementById('bar-chart-product');
    if (regionDom) {
      regionDom.addEventListener('mousedown', function(e) {
        if (e.shiftKey) drillIntent = true;
      }, true);
    }
    if (productDom) {
      productDom.addEventListener('mousedown', function(e) {
        if (e.shiftKey) drillIntent = true;
      }, true);
    }
  }

  var guideMessages = [
    '1단계: 우측 필터에서 <strong>지역</strong> 버튼을 클릭해 보세요.',
    '2단계: 아래 <strong>지역별 차트</strong>의 막대를 클릭해 보세요. (Shift+클릭 또는 더블클릭 = 드릴)',
    '3단계: 상단 <strong>Pivot</strong> 버튼을 눌러 상세 테이블을 확인해 보세요.',
    '가이드를 완료했습니다. 이제 대시보드를 자유롭게 사용하세요.'
  ];

  function showGuide(step) {
    guideStep = step;
    var overlay = document.getElementById('guide-overlay');
    if (!overlay) return;
    if (step <= 0 || step > GUIDE_STEPS) {
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden', 'true');
      try { sessionStorage.setItem('ccm_guide_done', '1'); } catch (_) {}
      return;
    }
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    var numEl = document.getElementById('guide-step-num');
    var totalEl = document.getElementById('guide-step-total');
    var msgEl = document.getElementById('guide-message');
    if (numEl) numEl.textContent = step;
    if (totalEl) totalEl.textContent = GUIDE_STEPS;
    if (msgEl) msgEl.innerHTML = guideMessages[step - 1];
    var nextBtn = document.getElementById('guide-next');
    if (nextBtn) nextBtn.textContent = step === GUIDE_STEPS ? '완료' : '다음';
    var spotlight = document.getElementById('guide-spotlight');
    if (spotlight) {
      spotlight.className = 'guide-spotlight';
      spotlight.style.top = spotlight.style.left = spotlight.style.width = spotlight.style.height = '';
      if (step === 1) {
        var fl = document.getElementById('filter-region-list');
        if (fl) {
          var rect = fl.getBoundingClientRect();
          spotlight.style.top = rect.top + 'px';
          spotlight.style.left = rect.left + 'px';
          spotlight.style.width = rect.width + 'px';
          spotlight.style.height = rect.height + 'px';
          spotlight.classList.add('highlight');
        }
      } else if (step === 2) {
        var barRegion = document.getElementById('bar-chart-region');
        if (barRegion) {
          var rect = barRegion.getBoundingClientRect();
          spotlight.style.top = rect.top + 'px';
          spotlight.style.left = rect.left + 'px';
          spotlight.style.width = rect.width + 'px';
          spotlight.style.height = rect.height + 'px';
          spotlight.classList.add('highlight');
        }
      } else if (step === 3) {
        var pivotBtn = document.getElementById('btn-pivot');
        if (pivotBtn) {
          var rect = pivotBtn.getBoundingClientRect();
          spotlight.style.top = rect.top + 'px';
          spotlight.style.left = rect.left + 'px';
          spotlight.style.width = rect.width + 'px';
          spotlight.style.height = rect.height + 'px';
          spotlight.classList.add('highlight');
        }
      }
    }
  }

  function advanceGuideIfStep(expectedStep) {
    if (guideStep === expectedStep) {
      guideStep++;
      if (guideStep > GUIDE_STEPS) {
        showGuide(0);
        return;
      }
      showGuide(guideStep);
    }
  }

  function init() {
    try { sessionStorage.setItem(CACHE_KEY, 'miss'); } catch (_) {}
    updateCachePill();
    setThemeByMetric(state.metric);
    initPeriodFilter();
    renderFilterLists();
    updateState();
    assertRenderGuard();
    setupDrillIntentOnCharts();

    try {
      if (sessionStorage.getItem('ccm_guide_done') !== '1') {
        setTimeout(function() { showGuide(1); }, 400);
      }
    } catch (_) {}

    var metricSelect = document.getElementById('metric-select');
    if (metricSelect) {
      metricSelect.addEventListener('change', function() {
        state.metric = this.value;
        updateState();
      });
    }

    window.addEventListener('resize', function() {
      checkHorizontalOverflow();
      if (chartLine) chartLine.resize();
      if (chartBarRegion) chartBarRegion.resize();
      if (chartBarProduct) chartBarProduct.resize();
      var overlay = document.getElementById('pivot-overlay');
      if (overlay && overlay.classList.contains('show')) renderPivot();
    });

    var btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.addEventListener('click', function() {
      if (drillStack.length) {
        var prev = drillStack.pop();
        filterRegion = prev.region;
        filterProductGroup = prev.product_group;
        updateState();
        renderFilterLists();
      }
    });
    var btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', function() {
      filterRegion = null;
      filterProductGroup = null;
      drillStack = [];
      filterPeriodStart = MONTHS[0];
      filterPeriodEnd = MONTHS[MONTHS.length - 1];
      var startEl = document.getElementById('filter-period-start');
      var endEl = document.getElementById('filter-period-end');
      if (startEl) startEl.value = filterPeriodStart;
      if (endEl) endEl.value = filterPeriodEnd;
      updateState();
      renderFilterLists();
      updateCachePill();
    });
    var btnPivot = document.getElementById('btn-pivot');
    if (btnPivot) btnPivot.addEventListener('click', function() {
      pivotPage = 0;
      renderPivot();
      var overlay = document.getElementById('pivot-overlay');
      if (overlay) {
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
      }
      advanceGuideIfStep(3);
    });
    var btnPivotClose = document.getElementById('btn-pivot-close');
    if (btnPivotClose) btnPivotClose.addEventListener('click', function() {
      var overlay = document.getElementById('pivot-overlay');
      if (overlay) {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });
    var numericThs = document.querySelectorAll('#pivot-table th.numeric');
    for (var i = 0; i < numericThs.length; i++) {
      numericThs[i].addEventListener('click', function() {
        var key = this.getAttribute('data-sort');
        if (pivotSort.key === key) pivotSort.asc = !pivotSort.asc;
        else { pivotSort.key = key; pivotSort.asc = true; }
        renderPivot();
      });
    }
    var btnSelfCheck = document.getElementById('btn-self-check');
    if (btnSelfCheck) btnSelfCheck.addEventListener('click', runSelfCheck);
    var btnGuide = document.getElementById('btn-guide');
    if (btnGuide) btnGuide.addEventListener('click', function() { showGuide(1); });
    document.getElementById('guide-skip') && document.getElementById('guide-skip').addEventListener('click', function() { showGuide(0); });
    document.getElementById('guide-next') && document.getElementById('guide-next').addEventListener('click', function() {
      if (guideStep >= GUIDE_STEPS) { showGuide(0); return; }
      showGuide(guideStep + 1);
    });
    var btnTogglePanel = document.getElementById('btn-toggle-panel');
    var expandBtn = document.getElementById('btn-expand-filter');
    if (btnTogglePanel) btnTogglePanel.addEventListener('click', function() {
      var panel = document.getElementById('right-panel');
      var app = document.getElementById('app');
      if (panel) {
        panel.classList.toggle('collapsed');
        if (app) app.classList.toggle('right-collapsed', panel.classList.contains('collapsed'));
        this.textContent = panel.classList.contains('collapsed') ? '펼치기' : '접기';
        if (expandBtn) expandBtn.classList.toggle('show', panel.classList.contains('collapsed'));
      }
      setTimeout(function() {
        if (chartLine) chartLine.resize();
        if (chartBarRegion) chartBarRegion.resize();
        if (chartBarProduct) chartBarProduct.resize();
      }, 220);
      checkHorizontalOverflow();
    });
    if (expandBtn) expandBtn.addEventListener('click', function() {
      var panel = document.getElementById('right-panel');
      if (panel && panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed');
        var app = document.getElementById('app');
        if (app) app.classList.remove('right-collapsed');
        expandBtn.classList.remove('show');
        var t = document.getElementById('btn-toggle-panel');
        if (t) t.textContent = '접기';
        setTimeout(function() {
          if (chartLine) chartLine.resize();
          if (chartBarRegion) chartBarRegion.resize();
          if (chartBarProduct) chartBarProduct.resize();
        }, 220);
        checkHorizontalOverflow();
      }
    });

    checkHorizontalOverflow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
