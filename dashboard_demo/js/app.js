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
  var MONTHS = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07'];
  var PERIOD_UNITS = [{ value: 'month', label: 'Month' }];
  var COUNTRIES_PER_REGION = 60;

  var PRODUCT_LEVEL1_ORDER = ['Living', 'Kitchen', 'Air'];
  var PRODUCT_HIERARCHY = {
    Living: {
      Washer: ['Drum Washer', 'Top-Load Washer'],
      Dryer: ['Gas Dryer', 'Electric Dryer', 'Heat Pump Dryer']
    },
    Kitchen: {
      Oven: ['Oven 3'],
      Cooktop: ['Cooktop 3']
    },
    Air: {
      'Air Conditioner': ['FAC', 'RAC'],
      'Air Purifier': ['Air Purifier 3']
    }
  };

  function padNum(n, width) {
    var s = String(n);
    while (s.length < width) s = '0' + s;
    return s;
  }

  function buildRegionCountries() {
    var map = {};
    REGIONS.forEach(function(region) {
      var countries = [];
      for (var i = 1; i <= COUNTRIES_PER_REGION; i++) {
        countries.push(region + '-C' + padNum(i, 2));
      }
      map[region] = countries;
    });
    return map;
  }

  function buildProductHierarchyMaps() {
    var level1 = PRODUCT_LEVEL1_ORDER.slice();
    var level2ByL1 = {};
    var level3ByL1L2 = {};
    var leafNodes = [];
    level1.forEach(function(l1) {
      var level2Map = PRODUCT_HIERARCHY[l1] || {};
      var level2 = Object.keys(level2Map);
      level2ByL1[l1] = level2;
      level2.forEach(function(l2) {
        var level3 = (level2Map[l2] || []).slice();
        if (!level3.length) level3 = [l2 + ' 3'];
        level3ByL1L2[l1 + '|' + l2] = level3;
        level3.forEach(function(l3) {
          leafNodes.push({ level1: l1, level2: l2, level3: l3 });
        });
      });
    });
    return { level1: level1, level2ByL1: level2ByL1, level3ByL1L2: level3ByL1L2, leafNodes: leafNodes };
  }

  var REGION_COUNTRIES = buildRegionCountries();
  var PRODUCT_META = buildProductHierarchyMaps();
  var PRODUCT_LEVEL1 = PRODUCT_META.level1;
  var PRODUCT_LEVEL2_BY_L1 = PRODUCT_META.level2ByL1;
  var PRODUCT_LEVEL3_BY_L1L2 = PRODUCT_META.level3ByL1L2;
  var PRODUCT_LEAF_NODES = PRODUCT_META.leafNodes;

  function buildRawData() {
    var out = [];
    var seed = 12345;
    for (var mi = 0; mi < MONTHS.length; mi++) {
      for (var ri = 0; ri < REGIONS.length; ri++) {
        var region = REGIONS[ri];
        var entities = REGIONS_ENTITIES[region] || ['ENT'];
        var countries = REGION_COUNTRIES[region] || ['XX'];
        for (var ei = 0; ei < entities.length; ei++) {
          for (var ci = 0; ci < countries.length; ci++) {
            for (var pi = 0; pi < PRODUCT_LEAF_NODES.length; pi++) {
              var product = PRODUCT_LEAF_NODES[pi];
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
                region: region,
                entity: entities[ei],
                country: countries[ci],
                product_group: product.level2,
                product_level1: product.level1,
                product_level2: product.level2,
                product_level3: product.level3,
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
    }
    return out;
  }

  var rawData = buildRawData();
  var filterRegion = null;
  var filterProduct = { level1: null, level2: null, level3: null };
  var filterPeriodStart = MONTHS[0];
  var filterPeriodEnd = MONTHS[MONTHS.length - 1];
  var filterPeriodUnit = PERIOD_UNITS[0].value;
  var drillStack = [];
  var pivotSort = { key: null, asc: true };
  var pivotPage = 0;
  var state = { metric: 'sales' };

  var chartLine = null;
  var chartBarRegion = null;
  var chartBarProduct = null;
  var drillIntent = false;
  var drillDownMode = false;
  var selectedLineName = null;
  var filteredDataCacheKey = '';
  var filteredDataCacheRows = [];
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

  function getCurrentProductPathLabel() {
    var parts = [];
    if (filterProduct.level1) parts.push(filterProduct.level1);
    if (filterProduct.level2) parts.push(filterProduct.level2);
    if (filterProduct.level3) parts.push(filterProduct.level3);
    return parts.join(' > ');
  }

  function cloneProductFilter(src) {
    src = src || { level1: null, level2: null, level3: null };
    return {
      level1: src.level1 || null,
      level2: src.level2 || null,
      level3: src.level3 || null
    };
  }

  function setProductFilter(next) {
    filterProduct = cloneProductFilter(next);
  }

  function pushDrillState() {
    drillStack.push({
      region: filterRegion,
      product: cloneProductFilter(filterProduct)
    });
  }

  function getFilteredData() {
    var cacheKey = [
      filterRegion || '',
      filterProduct.level1 || '',
      filterProduct.level2 || '',
      filterProduct.level3 || '',
      filterPeriodStart || '',
      filterPeriodEnd || '',
      filterPeriodUnit || ''
    ].join('|');
    if (cacheKey === filteredDataCacheKey) return filteredDataCacheRows;

    var out = [];
    for (var i = 0; i < rawData.length; i++) {
      var row = rawData[i];
      if (filterRegion && row.region !== filterRegion) continue;
      if (filterProduct.level1 && row.product_level1 !== filterProduct.level1) continue;
      if (filterProduct.level2 && row.product_level2 !== filterProduct.level2) continue;
      if (filterProduct.level3 && row.product_level3 !== filterProduct.level3) continue;
      if (filterPeriodStart && row.year_month < filterPeriodStart) continue;
      if (filterPeriodEnd && row.year_month > filterPeriodEnd) continue;
      out.push(row);
    }
    filteredDataCacheKey = cacheKey;
    filteredDataCacheRows = out;
    return out;
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
    return getMetricValueFromKPI(k);
  }

  function getMetricValueFromKPI(k) {
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

  function initPeriodUnitFilter() {
    var unitEl = document.getElementById('filter-period-unit');
    if (!unitEl) return;
    unitEl.innerHTML = PERIOD_UNITS.map(function(unit) {
      return '<option value="' + unit.value + '">' + unit.label + '</option>';
    }).join('');
    unitEl.value = filterPeriodUnit;
    unitEl.addEventListener('change', function() {
      filterPeriodUnit = this.value || PERIOD_UNITS[0].value;
      updateState();
    });
  }

  function getProductDrillLevel() {
    if (!filterProduct.level1) return 1;
    if (!filterProduct.level2) return 2;
    return 3;
  }

  function getProductOptionsByLevel(level) {
    if (level === 1) {
      return PRODUCT_LEVEL1.slice();
    }
    if (level === 2 && filterProduct.level1) {
      return (PRODUCT_LEVEL2_BY_L1[filterProduct.level1] || []).slice();
    }
    if (level === 3 && filterProduct.level1 && filterProduct.level2) {
      return (PRODUCT_LEVEL3_BY_L1L2[filterProduct.level1 + '|' + filterProduct.level2] || []).slice();
    }
    return [];
  }

  function applyProductSelection(level, value) {
    if (level === 1) {
      if (filterProduct.level1 === value && !filterProduct.level2 && !filterProduct.level3) {
        setProductFilter({ level1: null, level2: null, level3: null });
      } else {
        setProductFilter({ level1: value, level2: null, level3: null });
      }
      return;
    }
    if (level === 2) {
      if (filterProduct.level2 === value && !filterProduct.level3) {
        setProductFilter({ level1: filterProduct.level1, level2: null, level3: null });
      } else {
        setProductFilter({ level1: filterProduct.level1, level2: value, level3: null });
      }
      return;
    }
    if (level === 3) {
      var nextL3 = filterProduct.level3 === value ? null : value;
      setProductFilter({ level1: filterProduct.level1, level2: filterProduct.level2, level3: nextL3 });
    }
  }

  /** 필터 항목 렌더 — 지역·제품군 목록 */
  function renderFilterLists() {
    var regionList = document.getElementById('filter-region-list');
    if (regionList) {
      var regions = REGIONS.slice().sort();
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
      var drillLevel = getProductDrillLevel();
      var options = getProductOptionsByLevel(drillLevel);
      var backChip = '';
      if (drillLevel === 2) {
        backChip = '<button type="button" class="filter-chip" data-product-action="up-l1">← Level 1</button>';
      } else if (drillLevel === 3) {
        backChip = '<button type="button" class="filter-chip" data-product-action="up-l2">← Level 2</button>';
      }
      productList.innerHTML = backChip + options.map(function(name) {
        var active = '';
        if (drillLevel === 1 && filterProduct.level1 === name) active = ' active';
        if (drillLevel === 2 && filterProduct.level2 === name) active = ' active';
        if (drillLevel === 3 && filterProduct.level3 === name) active = ' active';
        return '<button type="button" class="filter-chip' + active + '" data-product="' + name + '" data-product-level="' + drillLevel + '">' + name + '</button>';
      }).join('');
      productList.querySelectorAll('.filter-chip').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var action = this.getAttribute('data-product-action');
          if (action === 'up-l1') {
            setProductFilter({ level1: null, level2: null, level3: null });
            updateState();
            renderFilterLists();
            return;
          }
          if (action === 'up-l2') {
            setProductFilter({ level1: filterProduct.level1, level2: null, level3: null });
            updateState();
            renderFilterLists();
            return;
          }
          var level = Number(this.getAttribute('data-product-level') || '1');
          var product = this.getAttribute('data-product');
          applyProductSelection(level, product);
          updateState();
          renderFilterLists();
        });
      });
    }
  }

  function applyLineSelectionStyles(series) {
    var hasSelection = !!selectedLineName;
    return series.map(function(s) {
      var selected = selectedLineName === s.name;
      var faded = hasSelection && !selected;
      var lineStyle = Object.assign({}, s.lineStyle || {});
      var itemStyle = Object.assign({}, s.itemStyle || {});
      var baseWidth = lineStyle.width != null ? lineStyle.width : 2;
      lineStyle.width = selected ? Math.max(baseWidth + 1.2, 3.2) : (faded ? Math.max(baseWidth - 0.4, 1.2) : baseWidth);
      lineStyle.opacity = faded ? 0.28 : 1;
      itemStyle.opacity = faded ? 0.34 : 1;
      return Object.assign({}, s, {
        lineStyle: lineStyle,
        itemStyle: itemStyle,
        symbolSize: selected ? Math.max((s.symbolSize || 6) + 1, 7) : (s.symbolSize || 6),
        opacity: faded ? 0.35 : 1
      });
    });
  }

  /** ECharts: 연결률 시계열 — X축(월), Y축(%) 여유 범위, 소수점 1자리 */
  function renderLineChart() {
    var dom = document.getElementById('line-chart');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartLine) chartLine = echarts.init(dom);
    var list = getFilteredData();
    var months = MONTHS.filter(function(ym) {
      return (!filterPeriodStart || ym >= filterPeriodStart) && (!filterPeriodEnd || ym <= filterPeriodEnd);
    });
    var series = [];

    if (drillDownMode) {
      var keyField = filterRegion ? 'entity' : 'region';
      var labelMap = filterRegion ? ENTITY_LABELS : REGION_LABELS;
      var byKey = {};
      for (var i = 0; i < list.length; i++) {
        var row = list[i];
        var key = row[keyField];
        if (!key) continue;
        if (!byKey[key]) byKey[key] = {};
        if (!byKey[key][row.year_month]) byKey[key][row.year_month] = { sales: 0, smart_sales: 0, connected: 0 };
        byKey[key][row.year_month].sales += row.sales;
        byKey[key][row.year_month].smart_sales += row.smart_sales;
        byKey[key][row.year_month].connected += row.connected;
      }
      var keys = Object.keys(byKey).sort();
      series = keys.map(function(key) {
        var values = months.map(function(ym) {
          var m = byKey[key][ym];
          if (!m || m.smart_sales <= 0) return null;
          return Math.round((m.connected / m.smart_sales * 100) * 10) / 10;
        });
        return {
          name: labelMap[key] || key,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          connectNulls: false,
          lineStyle: { width: 2 }
        };
      });
    } else {
      var byMonth = {};
      for (var j = 0; j < list.length; j++) {
        var r = list[j];
        if (!byMonth[r.year_month]) byMonth[r.year_month] = { sales: 0, smart_sales: 0, connected: 0 };
        byMonth[r.year_month].sales += r.sales;
        byMonth[r.year_month].smart_sales += r.smart_sales;
        byMonth[r.year_month].connected += r.connected;
      }
      var values = months.map(function(ym) {
        var m = byMonth[ym];
        if (!m || m.smart_sales <= 0) return null;
        return Math.round((m.connected / m.smart_sales * 100) * 10) / 10;
      });
      series = [{
        name: 'Connection Rate',
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
      }];
    }

    var names = series.map(function(s) { return s.name; });
    if (selectedLineName && names.indexOf(selectedLineName) === -1) selectedLineName = null;
    series = applyLineSelectionStyles(series);

    var allValues = [];
    series.forEach(function(s) {
      (s.data || []).forEach(function(v) {
        if (v == null || isNaN(v)) return;
        allValues.push(Number(v));
      });
    });
    var dataMin = allValues.length ? Math.min.apply(null, allValues) : 0;
    var dataMax = allValues.length ? Math.max.apply(null, allValues) : 100;
    var pad = Math.max(8, (dataMax - dataMin) * 0.15 || 8);
    var yMin = Math.max(0, dataMin - pad);
    var yMax = Math.min(100, dataMax + pad);
    chartLine.setOption({
      grid: { left: 84, right: 28, top: 28, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: function(v) { return v == null ? '—' : Number(v).toFixed(1) + '%'; }
      },
      legend: drillDownMode ? {
        type: 'scroll',
        top: 2,
        left: 92,
        right: 28,
        itemWidth: 10,
        itemHeight: 6,
        textStyle: { fontSize: 11 }
      } : { show: false },
      xAxis: { type: 'category', data: months, axisLabel: { rotate: 0 } },
      yAxis: {
        type: 'value',
        name: 'Connection Rate',
        nameLocation: 'middle',
        nameGap: 68,
        nameRotate: 90,
        min: yMin,
        max: yMax,
        axisLabel: { formatter: function(v) { return Number(v).toFixed(1) + '%'; } }
      },
      series: series
    }, true);

    chartLine.off('click');
    chartLine.on('click', function(params) {
      if (params.componentType !== 'series') return;
      var name = params.seriesName;
      if (!name) return;
      selectedLineName = selectedLineName === name ? null : name;
      renderLineChart();
    });
  }

  /** ECharts: 지역별 가로 막대 — 드릴 시 해당 지역 법인별로 전환 */
  function renderBarChartRegion() {
    var dom = document.getElementById('bar-chart-region');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartBarRegion) chartBarRegion = echarts.init(dom);
    var list = getFilteredData();
    var titleEl = document.getElementById('chart-title-region');
    var byKey = {};
    var keys;
    var getName;
    var keyField;

    if (filterRegion) {
      keyField = 'entity';
      getName = function(k) { return ENTITY_LABELS[k] || k; };
      if (titleEl) titleEl.textContent = '지역별 > ' + (REGION_LABELS[filterRegion] || filterRegion) + ' (법인별)';
    } else {
      keyField = 'region';
      getName = function(k) { return REGION_LABELS[k] || k; };
      if (titleEl) titleEl.textContent = '지역별';
    }
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      var key = row[keyField];
      if (!key) continue;
      if (!byKey[key]) byKey[key] = { sales: 0, smart_sales: 0, connected: 0 };
      byKey[key].sales += row.sales;
      byKey[key].smart_sales += row.smart_sales;
      byKey[key].connected += row.connected;
    }
    keys = Object.keys(byKey).sort();

    var color = COLOR_MAP[state.metric] || COLOR_MAP.sales;
    var data = keys.map(function(k) { return getMetricValueFromKPI(byKey[k]); });
    var yLabels = keys.map(getName);
    chartBarRegion.setOption({
      grid: { left: 56, right: 64, top: 16, bottom: 24 },
      xAxis: { type: 'value', name: state.metric, axisLabel: { formatter: isRateMetric() ? '{value}%' : '{value}' } },
      yAxis: { type: 'category', data: yLabels, inverse: true },
      series: [{
        type: 'bar',
        data: data,
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
        pushDrillState();
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
      pushDrillState();
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
    var titleEl = document.getElementById('chart-title-product');
    var keyField = 'product_level1';
    var drillLevel = 1;
    var orderedKeys = PRODUCT_LEVEL1.slice();

    if (filterProduct.level1 && !filterProduct.level2) {
      keyField = 'product_level2';
      drillLevel = 2;
      orderedKeys = (PRODUCT_LEVEL2_BY_L1[filterProduct.level1] || []).slice();
      if (titleEl) titleEl.textContent = '제품군별 > ' + filterProduct.level1 + ' (Level 2)';
    } else if (filterProduct.level1 && filterProduct.level2) {
      keyField = 'product_level3';
      drillLevel = 3;
      orderedKeys = (PRODUCT_LEVEL3_BY_L1L2[filterProduct.level1 + '|' + filterProduct.level2] || []).slice();
      if (titleEl) titleEl.textContent = '제품군별 > ' + filterProduct.level1 + ' > ' + filterProduct.level2 + ' (Level 3)';
    } else if (titleEl) {
      titleEl.textContent = '제품군별 (Level 1)';
    }

    var byProduct = {};
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      var key = row[keyField];
      if (!key) continue;
      if (!byProduct[key]) byProduct[key] = { sales: 0, smart_sales: 0, connected: 0 };
      byProduct[key].sales += row.sales;
      byProduct[key].smart_sales += row.smart_sales;
      byProduct[key].connected += row.connected;
    }
    orderedKeys = orderedKeys.filter(function(name) { return !!byProduct[name]; });
    Object.keys(byProduct).forEach(function(name) {
      if (orderedKeys.indexOf(name) === -1) orderedKeys.push(name);
    });

    var color = COLOR_MAP[state.metric] || COLOR_MAP.sales;
    var data = orderedKeys.map(function(name) { return getMetricValueFromKPI(byProduct[name]); });
    chartBarProduct.setOption({
      grid: { left: 56, right: 64, top: 16, bottom: 24 },
      xAxis: { type: 'value', name: state.metric, axisLabel: { formatter: isRateMetric() ? '{value}%' : '{value}' } },
      yAxis: { type: 'category', data: orderedKeys, inverse: true },
      series: [{
        type: 'bar',
        data: data,
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
      var idx = params.dataIndex;
      return orderedKeys[idx] != null ? orderedKeys[idx] : null;
    }
    chartBarProduct.on('click', function(params) {
      if (params.componentType !== 'series') return;
      var name = getProductName(params);
      if (name == null) return;
      if (drillIntent) {
        pushDrillState();
        drillIntent = false;
        showToast('드릴다운 적용됨. Back으로 복원할 수 있습니다.', true);
      }
      applyProductSelection(drillLevel, name);
      updateState();
      renderFilterLists();
    });
    chartBarProduct.on('dblclick', function(params) {
      if (params.componentType !== 'series') return;
      var name = getProductName(params);
      if (name == null) return;
      pushDrillState();
      showToast('드릴다운 적용됨. Back으로 복원할 수 있습니다.', true);
      applyProductSelection(drillLevel, name);
      updateState();
      renderFilterLists();
    });
  }

  function updateSelection() {
    var el = document.getElementById('selection');
    if (!el) return;
    var productLabel = getCurrentProductPathLabel();
    if (filterRegion == null && !productLabel) {
      el.textContent = '선택: 글로벌 (전체)';
    } else {
      var parts = [];
      if (filterRegion) parts.push('지역 ' + (REGION_LABELS[filterRegion] || filterRegion));
      if (productLabel) parts.push('제품군 ' + productLabel);
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

  function updateDataRowCount() {
    var el = document.getElementById('data-row-count');
    if (!el) return;
    el.textContent = 'Rows: ' + fmtNum(rawData.length);
  }

  function updateDrillModeButton() {
    var btn = document.getElementById('btn-drill-mode');
    if (!btn) return;
    btn.classList.toggle('active', drillDownMode);
    btn.setAttribute('aria-pressed', drillDownMode ? 'true' : 'false');
  }

  function updateState() {
    setThemeByMetric(state.metric);
    updateSelection();
    updateDataRowCount();
    updateKPI();
    updateDrillModeButton();
    renderLineChart();
    renderBarChartRegion();
    renderBarChartProduct();
    var btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.disabled = drillStack.length === 0;
  }

  function getPivotRows() {
    var list = getFilteredData();
    var byKey = {};
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var k = r.region;
      if (!byKey[k]) byKey[k] = { sales: 0, smart_sales: 0, connected: 0 };
      byKey[k].sales += r.sales;
      byKey[k].smart_sales += r.smart_sales;
      byKey[k].connected += r.connected;
    }
    return Object.keys(byKey).sort().map(function(k) {
      var kpi = byKey[k];
      return {
        dim: k,
        sales: kpi.sales,
        smart_sales: kpi.smart_sales,
        connected: kpi.connected,
        smart_sales_rate_pct: kpi.sales > 0 ? (kpi.smart_sales / kpi.sales * 100) : null,
        connected_rate_pct: kpi.smart_sales > 0 ? (kpi.connected / kpi.smart_sales * 100) : null
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

  function parseZIndexValue(v) {
    var n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  function hasMultiButtonsPerRow(container) {
    if (!container) return false;
    var buttons = Array.prototype.slice.call(container.querySelectorAll('button'));
    if (buttons.length < 2) return false;
    var rows = {};
    buttons.forEach(function(btn) {
      var rect = btn.getBoundingClientRect();
      var key = Math.round(rect.top);
      rows[key] = (rows[key] || 0) + 1;
    });
    return Object.keys(rows).some(function(k) { return rows[k] >= 2; });
  }

  function hasConsistentHeights(buttons) {
    if (!buttons || !buttons.length) return true;
    var heights = buttons.map(function(btn) { return Math.round(btn.getBoundingClientRect().height); });
    var minH = Math.min.apply(null, heights);
    var maxH = Math.max.apply(null, heights);
    return (maxH - minH) <= 1;
  }

  function runSelfCheck() {
    var doc = document.documentElement;
    var topbar = document.getElementById('topbar');
    var main = document.getElementById('main');
    var right = document.getElementById('right-panel');
    var regionList = document.getElementById('filter-region-list');
    var productList = document.getElementById('filter-product-list');
    var leftSidebar = document.getElementById('left-sidebar');
    var leftSidebarTitle = document.querySelector('#left-sidebar .left-sidebar-title');
    var leftNav = document.getElementById('left-nav');
    var kpiSalesEl = document.getElementById('kpi-sales');
    var pivotSalesEl = document.getElementById('pivot-total-sales');
    var kpiSales = kpiSalesEl ? (kpiSalesEl.textContent.replace(/,/g, '')) : '';
    var pivotSales = pivotSalesEl ? (pivotSalesEl.textContent.replace(/,/g, '')) : '';
    var topbarActions = document.querySelector('#topbar .actions');
    var topbarButtons = topbarActions ? Array.prototype.slice.call(topbarActions.querySelectorAll('button')) : [];
    var leftNavLinks = leftNav ? Array.prototype.slice.call(leftNav.querySelectorAll('a')) : [];
    var guideNext = document.getElementById('guide-next');
    var guideOverlay = document.getElementById('guide-overlay');
    var guideCard = document.querySelector('#guide-overlay .guide-card');
    var guideSpotlight = document.getElementById('guide-spotlight');
    var drillModeBtn = document.getElementById('btn-drill-mode');
    var lineOption = chartLine && chartLine.getOption ? chartLine.getOption() : null;
    var seriesLen = lineOption && lineOption.series ? lineOption.series.length : 0;

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

    var leftMenuOk = !!leftSidebar && !!leftSidebarTitle && !!leftNav && leftNavLinks.length >= 1;
    items.push({ name: '좌측 사이드바 구조(타이틀/메뉴) 존재', pass: leftMenuOk, detail: 'title=' + !!leftSidebarTitle + ' links=' + leftNavLinks.length });
    var leftNavNoClip = leftNavLinks.length ? leftNavLinks.every(function(link) { return link.scrollWidth <= link.clientWidth + 1; }) : false;
    items.push({ name: '좌측 메뉴 텍스트 클리핑 없음', pass: leftNavNoClip, detail: 'links=' + leftNavLinks.length });

    var navLabels = leftNavLinks.map(function(a) { return (a.textContent || '').trim().toLowerCase(); });
    var topbarBtnLabels = topbarButtons.map(function(b) { return (b.textContent || '').trim().toLowerCase(); });
    var duplicateTopNav = topbarBtnLabels.filter(function(lbl) { return navLabels.indexOf(lbl) >= 0; });
    items.push({ name: '탑바-좌측메뉴 중복 네비 버튼 없음', pass: duplicateTopNav.length === 0, detail: 'duplicates=' + duplicateTopNav.join(',') });

    var guideBtn = document.getElementById('btn-guide');
    var keyboardBtn = document.getElementById('btn-keyboard');
    if (guideBtn && topbar) {
      var gRect = guideBtn.getBoundingClientRect();
      var tRect = topbar.getBoundingClientRect();
      var guideFit = guideBtn.scrollWidth <= guideBtn.clientWidth + 1;
      var guideHeightOk = gRect.height <= tRect.height + 1;
      items.push({ name: 'Guide 버튼 오버플로우/높이 정상', pass: guideFit && guideHeightOk, detail: 'fit=' + guideFit + ' h=' + Math.round(gRect.height) + '/' + Math.round(tRect.height) });
    } else {
      items.push({ name: 'Guide 버튼 오버플로우/높이 정상', pass: false, detail: 'guide/topbar 없음' });
    }
    if (keyboardBtn && topbar) {
      var kRect = keyboardBtn.getBoundingClientRect();
      var ttRect = topbar.getBoundingClientRect();
      var keyboardFit = keyboardBtn.scrollWidth <= keyboardBtn.clientWidth + 1;
      var keyboardHeightOk = kRect.height <= ttRect.height + 1;
      items.push({ name: 'Keyboard 버튼 오버플로우/높이 정상', pass: keyboardFit && keyboardHeightOk, detail: 'fit=' + keyboardFit + ' h=' + Math.round(kRect.height) + '/' + Math.round(ttRect.height) });
    } else {
      items.push({ name: 'Keyboard 버튼 오버플로우/높이 정상', pass: true, detail: '버튼 미사용(N/A)' });
    }

    if (guideNext && guideOverlay && guideCard && guideSpotlight) {
      var overlayZ = parseZIndexValue(window.getComputedStyle(guideOverlay).zIndex);
      var cardZ = parseZIndexValue(window.getComputedStyle(guideCard).zIndex);
      var spotlightZ = parseZIndexValue(window.getComputedStyle(guideSpotlight).zIndex);
      var nextZ = parseZIndexValue(window.getComputedStyle(guideNext).zIndex);
      var nextInteractive = window.getComputedStyle(guideNext).pointerEvents !== 'none';
      var zOk = nextZ > cardZ && cardZ > spotlightZ && spotlightZ >= overlayZ;
      items.push({ name: 'Guide Next 버튼 z-index/상호작용 정상', pass: zOk && nextInteractive, detail: 'z=' + overlayZ + '/' + spotlightZ + '/' + cardZ + '/' + nextZ + ' interactive=' + nextInteractive });
    } else {
      items.push({ name: 'Guide Next 버튼 z-index/상호작용 정상', pass: false, detail: '가이드 DOM 없음' });
    }

    var rightCollapsedNow = right && right.classList.contains('collapsed');
    var regionWrap = regionList ? window.getComputedStyle(regionList).flexWrap === 'wrap' : false;
    var productWrap = productList ? window.getComputedStyle(productList).flexWrap === 'wrap' : false;
    items.push({ name: '필터 버튼 래핑(flex-wrap) 활성화', pass: rightCollapsedNow ? true : (regionWrap && productWrap), detail: rightCollapsedNow ? '패널 접힘(N/A)' : ('region=' + regionWrap + ' product=' + productWrap) });

    var regionGap = regionList ? parseFloat(window.getComputedStyle(regionList).gap || '0') : 0;
    var productGap = productList ? parseFloat(window.getComputedStyle(productList).gap || '0') : 0;
    var compactGap = rightCollapsedNow ? true : (regionGap <= 4 && productGap <= 4);
    items.push({ name: '필터 버튼 간격(고밀도) 정상', pass: compactGap, detail: rightCollapsedNow ? '패널 접힘(N/A)' : ('gap=' + regionGap + '/' + productGap) });

    var regionMultiRow = rightCollapsedNow ? true : hasMultiButtonsPerRow(regionList);
    var productMultiRow = rightCollapsedNow ? true : hasMultiButtonsPerRow(productList);
    items.push({ name: '필터 다중 버튼 한 행 배치 가능', pass: regionMultiRow && productMultiRow, detail: rightCollapsedNow ? '패널 접힘(N/A)' : ('region=' + regionMultiRow + ' product=' + productMultiRow) });

    var allFilterButtons = [];
    if (regionList) allFilterButtons = allFilterButtons.concat(Array.prototype.slice.call(regionList.querySelectorAll('button')));
    if (productList) allFilterButtons = allFilterButtons.concat(Array.prototype.slice.call(productList.querySelectorAll('button')));
    var uniformFilterH = rightCollapsedNow ? true : hasConsistentHeights(allFilterButtons);
    items.push({ name: '필터 버튼 높이 일관성 유지', pass: uniformFilterH, detail: rightCollapsedNow ? '패널 접힘(N/A)' : ('count=' + allFilterButtons.length) });

    var drillLabelOk = !!drillModeBtn && (drillModeBtn.textContent || '').trim() === 'Drill-down Mode';
    items.push({ name: 'Drill-down Mode 토글 존재/라벨 일치', pass: drillLabelOk, detail: 'exists=' + !!drillModeBtn });
    if (drillModeBtn) {
      var isOn = drillModeBtn.classList.contains('active');
      var seriesOk = isOn ? (seriesLen >= 2) : (seriesLen === 1);
      items.push({ name: 'Drill-down Mode 상태별 라인 수 정상', pass: seriesOk, detail: 'on=' + isOn + ' series=' + seriesLen });
    } else {
      items.push({ name: 'Drill-down Mode 상태별 라인 수 정상', pass: false, detail: '토글 버튼 없음' });
    }

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
    initPeriodUnitFilter();
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
        setProductFilter(prev.product);
        updateState();
        renderFilterLists();
      }
    });
    var btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', function() {
      filterRegion = null;
      setProductFilter({ level1: null, level2: null, level3: null });
      drillStack = [];
      filterPeriodStart = MONTHS[0];
      filterPeriodEnd = MONTHS[MONTHS.length - 1];
      filterPeriodUnit = PERIOD_UNITS[0].value;
      selectedLineName = null;
      var startEl = document.getElementById('filter-period-start');
      var endEl = document.getElementById('filter-period-end');
      var unitEl = document.getElementById('filter-period-unit');
      if (startEl) startEl.value = filterPeriodStart;
      if (endEl) endEl.value = filterPeriodEnd;
      if (unitEl) unitEl.value = filterPeriodUnit;
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
    var btnDrillMode = document.getElementById('btn-drill-mode');
    if (btnDrillMode) btnDrillMode.addEventListener('click', function() {
      drillDownMode = !drillDownMode;
      updateState();
    });
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
