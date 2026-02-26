/**
 * Connection Conversion Monitoring (v11) — ECharts 5.4.3, 필터 접기/펼치기, 필터 항목·체크리스트
 */
(function() {
  var TOPBAR_H = 48;
  var TOAST_MSG = 'LAYOUT GUARD FAIL: horizontal overflow';
  var RENDER_GUARD_MSG = 'RENDER GUARD: 차트 미렌더';
  var CACHE_KEY = 'ccm_cache_flag';
  var PIVOT_PAGE_SIZES = [20, 50, 100];
  var DEFAULT_PAGE_SIZE = 20;

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
  /** 지역별 규모 다양성: 합산값이 지역마다 크게 차나도록 (0.3 ~ 2.5) */
  var REGION_SCALE = { NAM: 2.2, SAM: 0.5, WEU: 1.4, EEU: 0.7, NEU: 0.9, SEU: 0.6, EAS: 2.5, SEA: 1.1, SAS: 0.8, WAS: 0.4, NAF: 0.35, SAF: 0.3 };
  /** 법인별 규모 다양성: 같은 지역 내에서도 법인마다 차이 (0.5 ~ 1.8) */
  var ENTITY_SCALE = { E1: 1.6, E2: 0.5 };
  var MONTHS = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07'];
  var PERIOD_UNITS = [{ value: 'month', label: 'Month' }];

  // 국가는 법인 하위만 존재 (독립 차원 아님)
  var CORPORATION_COUNTRIES = {
    E1: ['EAS-C01', 'EAS-C02', 'NAM-C01', 'WEU-C01'],
    E2: ['EAS-C03', 'NAM-C02', 'WEU-C02', 'SEA-C01']
  };
  var COUNTRY_LABELS = { 'EAS-C01': '한국', 'EAS-C02': '일본', 'EAS-C03': '중국', 'NAM-C01': '미국', 'NAM-C02': '캐나다', 'WEU-C01': '독일', 'WEU-C02': '프랑스', 'SEA-C01': '태국' };

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

  var PRODUCT_META = buildProductHierarchyMaps();
  var PRODUCT_LEVEL1 = PRODUCT_META.level1;
  var PRODUCT_LEVEL2_BY_L1 = PRODUCT_META.level2ByL1;
  var PRODUCT_LEVEL3_BY_L1L2 = PRODUCT_META.level3ByL1L2;
  var PRODUCT_LEAF_NODES = PRODUCT_META.leafNodes;

  /** region, entity, country, product_level1/2/3, sales, smart_sales, connected */
  function buildRawData() {
    var out = [];
    var seed = 12345;
    for (var mi = 0; mi < MONTHS.length; mi++) {
      for (var ri = 0; ri < REGIONS.length; ri++) {
        var region = REGIONS[ri];
        var entities = REGIONS_ENTITIES[region] || ['ENT'];
        for (var ei = 0; ei < entities.length; ei++) {
          var entity = entities[ei];
          var countries = CORPORATION_COUNTRIES[entity] || [];
          for (var ci = 0; ci < countries.length; ci++) {
            var country = countries[ci];
            for (var pi = 0; pi < PRODUCT_LEAF_NODES.length; pi++) {
              var leaf = PRODUCT_LEAF_NODES[pi];
              seed = (seed * 1103515245 + 12345) & 0x7fffffff;
              var baseSales = 600 + (seed % 1800);
              var regionScale = REGION_SCALE[region] != null ? REGION_SCALE[region] : 1;
              var entityScale = ENTITY_SCALE[entity] != null ? ENTITY_SCALE[entity] : 1;
              var sales = Math.max(1, Math.round(baseSales * regionScale * entityScale));
              // 0%~100% 전 구간 색상 분포: 11단계(0,10..100) + 연속값 혼합
              var step = seed % 11;
              var smartRatio = step === 0 ? 0.02 : (step === 10 ? 0.98 : (0.08 + (seed % 85) / 100));
              var connStep = (seed * 7 + 11) % 11;
              var connRatio = connStep === 0 ? 0.02 : (connStep === 10 ? 0.98 : (0.05 + ((seed * 3 + 17) % 91) / 100));
              var smart_sales = Math.max(0, Math.round(sales * smartRatio));
              var connected = Math.max(0, Math.round(smart_sales * connRatio));
              out.push({
                year_month: MONTHS[mi],
                region: region,
                entity: entity,
                country: country,
                product_level1: leaf.level1,
                product_level2: leaf.level2,
                product_level3: leaf.level3,
                sales: sales,
                smart_sales: smart_sales,
                connected: connected
              });
            }
          }
        }
      }
    }
    return out;
  }

  var rawData = buildRawData();
  var filterPeriodStart = MONTHS[0];
  var filterPeriodEnd = MONTHS[MONTHS.length - 1];
  var filterPeriodUnit = PERIOD_UNITS[0].value;
  /** 지역 필터: 글로벌 > 지역 > 법인 > 국가 (국가 이하 없음) */
  var filterRegionPath = [];
  /** 제품 필터: 제품군 > 레벨2 > 레벨3 */
  var filterProduct = { level1: null, level2: null, level3: null };
  var pivotSort = { key: null, asc: true };
  var pivotPage = 0;
  var pivotPageSize = DEFAULT_PAGE_SIZE;
  var pivotRegionDepth = 1;
  var pivotProductDepth = 1;
  var state = { metric: 'sales', lineChartSingleRate: false };

  var chartLine = null;
  var chartBarRegion = null;
  var chartBarProduct = null;
  var chartTreemap = null;
  var selectedLineName = null;
  var currentView = 'overview';

  var HIER = typeof window !== 'undefined' && window.DAS_HIERARCHY ? window.DAS_HIERARCHY : null;
  function getRegionLabelMaps() {
    return { region: REGION_LABELS, corporation: ENTITY_LABELS, country: COUNTRY_LABELS };
  }
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
  function fmtCompact(n) {
    if (n == null || isNaN(n)) return '—';
    var v = Number(n);
    if (v >= 1e9) return (v / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(v));
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

  // --- Advanced Treemap v4 (6-axis, baseOption, tuning) ---
  var ADV_SIZE_METRICS = ['sales_count', 'smart_sales_count', 'connected_count', 'device_count'];
  var ADV_COLOR_METRICS = ['installation_rate_pct', 'connection_rate_pct'];
  function getRowSizeValue(row, sizeMetric) {
    if (sizeMetric === 'sales_count') return row.sales || 0;
    if (sizeMetric === 'smart_sales_count') return row.smart_sales || 0;
    if (sizeMetric === 'connected_count') return row.connected || 0;
    if (sizeMetric === 'device_count') return row.connected || 0;
    return row.sales || 0;
  }
  function getRowColorValue(row, colorMetric) {
    var sales = row.sales || 0, smart = row.smart_sales || 0, conn = row.connected || 0;
    var v = 0;
    if (colorMetric === 'installation_rate_pct') v = sales > 0 ? (smart / sales * 100) : 0;
    else if (colorMetric === 'connection_rate_pct') v = smart > 0 ? (conn / smart * 100) : 0;
    return Math.max(0, Math.min(100, v));
  }
  function aggregateLevel(rows, keysByLevel, levelIndex, sizeMetric, colorMetric, maps) {
    var keyField = keysByLevel[levelIndex];
    var groups = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var k = (r[keyField] == null || r[keyField] === '') ? '(Unknown)' : String(r[keyField]);
      if (!groups[k]) groups[k] = [];
      groups[k].push(r);
    }
    var children = [];
    var keys = Object.keys(groups).sort();
    var isLeafLevel = levelIndex === keysByLevel.length - 1;
    for (var ki = 0; ki < keys.length; ki++) {
      var key = keys[ki];
      var sub = groups[key];
      var sumVal = 0, sumActual = 0, colorW = 0;
      for (var si = 0; si < sub.length; si++) {
        var r = sub[si];
        var actual = getRowSizeValue(r, sizeMetric);
        sumActual += actual;
        sumVal += actual;
        colorW += getRowColorValue(r, colorMetric) * actual;
      }
      var colorVal = sumVal > 0 ? colorW / sumVal : 0;
      colorVal = Math.max(0, Math.min(100, colorVal));
      var label = key;
      if (keyField === 'region' && maps && maps.region) label = maps.region[key] || key;
      if (keyField === 'entity' && maps && maps.corporation) label = maps.corporation[key] || key;
      var node = {
        name: label,
        value: Math.max(1, Math.round(sumVal)),
        actualValue: Math.round(sumActual),
        colorValue: Math.round(colorVal * 10) / 10,
        level: levelIndex + 1,
        isOther: false,
        children: undefined
      };
      if (!isLeafLevel) {
        node.children = aggregateLevel(sub, keysByLevel, levelIndex + 1, sizeMetric, colorMetric, maps);
        var childSum = 0;
        for (var ci = 0; ci < node.children.length; ci++) childSum += node.children[ci].value;
        node.value = Math.max(1, childSum);
      }
      children.push(node);
    }
    return children;
  }
  function buildHierarchyRegionFirst(rows, sizeMetric, colorMetric) {
    var maps = getRegionLabelMaps();
    var keysByLevel = ['region', 'entity', 'product_level1', 'product_level2', 'product_level3'];
    if (!rows.length) return [{ name: 'Global', value: 0, actualValue: 0, colorValue: 0, level: 0, children: [] }];
    var children = aggregateLevel(rows, keysByLevel, 0, sizeMetric, colorMetric, maps);
    var totalVal = 0, totalActual = 0;
    for (var i = 0; i < children.length; i++) { totalVal += children[i].value; totalActual += children[i].actualValue; }
    return [{
      name: 'Global',
      value: Math.max(1, totalVal),
      actualValue: totalActual,
      colorValue: 0,
      level: 0,
      children: children
    }];
  }
  function buildHierarchyProductFirst(rows, sizeMetric, colorMetric) {
    var maps = getRegionLabelMaps();
    var keysByLevel = ['product_level1', 'product_level2', 'product_level3', 'region', 'entity'];
    if (!rows.length) return [{ name: 'Global', value: 0, actualValue: 0, colorValue: 0, level: 0, children: [] }];
    var children = aggregateLevel(rows, keysByLevel, 0, sizeMetric, colorMetric, maps);
    var totalVal = 0, totalActual = 0;
    for (var i = 0; i < children.length; i++) { totalVal += children[i].value; totalActual += children[i].actualValue; }
    return [{
      name: 'Global',
      value: Math.max(1, totalVal),
      actualValue: totalActual,
      colorValue: 0,
      level: 0,
      children: children
    }];
  }
  var ADV_LEVELS_BASE = [
    { itemStyle: { borderWidth: 2, gapWidth: 2, borderColor: 'rgba(0,0,0,0.12)' }, upperLabel: { show: true, fontSize: 12 } },
    { itemStyle: { borderWidth: 2, gapWidth: 2, borderColor: 'rgba(0,0,0,0.1)' }, upperLabel: { show: true, fontSize: 11 } },
    { itemStyle: { borderWidth: 2, gapWidth: 2, borderColor: 'rgba(0,0,0,0.1)' }, upperLabel: { show: true, fontSize: 10 } },
    { itemStyle: { borderWidth: 1, gapWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }, upperLabel: { show: false } },
    { itemStyle: { borderWidth: 1, gapWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }, upperLabel: { show: false } },
    { itemStyle: { borderWidth: 1, gapWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }, upperLabel: { show: false } }
  ];
  var ADV_LEVELS_TEMPLATE = ADV_LEVELS_BASE;
  function cloneTree(node) {
    var c = { name: node.name, value: node.value, actualValue: node.actualValue, colorValue: node.colorValue, level: node.level, isOther: node.isOther };
    if (node.children && node.children.length) c.children = node.children.map(cloneTree);
    return c;
  }
  function applyAreaScaleTree(node, scale) {
    if (scale === 'sqrt') {
      if (typeof node.value === 'number' && node.value > 0) node.value = Math.sqrt(node.value);
      if (node.children) node.children.forEach(function(c) { applyAreaScaleTree(c, scale); });
    } else if (scale === 'log1p') {
      if (typeof node.value === 'number' && node.value >= 0) node.value = Math.log1p(node.value);
      if (node.children) node.children.forEach(function(c) { applyAreaScaleTree(c, scale); });
    }
  }
  function collectLeaves(node, out) {
    if (!node.children || !node.children.length) { out.push(node); return; }
    for (var i = 0; i < node.children.length; i++) collectLeaves(node.children[i], out);
  }
  function applyTopNOther(rootList, leafCap, topN) {
    if (!rootList || !rootList.length) return;
    var leaves = [];
    collectLeaves(rootList[0], leaves);
    if (leaves.length <= leafCap) return;
    leaves.sort(function(a, b) { return (b.actualValue || 0) - (a.actualValue || 0); });
    var keep = leaves.slice(0, topN);
    var otherVal = 0, otherActual = 0, otherColorW = 0;
    for (var i = topN; i < leaves.length; i++) {
      otherVal += leaves[i].value || 0;
      otherActual += leaves[i].actualValue || 0;
      otherColorW += (leaves[i].colorValue || 0) * (leaves[i].actualValue || 0);
    }
    var otherColor = otherActual > 0 ? otherColorW / otherActual : 0;
    var parent = rootList[0];
    if (!parent.children) return;
    parent.children = keep.map(function(n) { return cloneTree(n); });
    parent.children.push({
      name: 'Other',
      value: Math.max(1, otherVal),
      actualValue: otherActual,
      colorValue: Math.max(0, Math.min(100, otherColor)),
      level: keep[0] ? keep[0].level : 6,
      isOther: true,
      children: undefined
    });
    var childSum = 0;
    for (var j = 0; j < parent.children.length; j++) childSum += parent.children[j].value;
    parent.value = Math.max(1, childSum);
  }
  function mapNodeToEcharts(n) {
    var item = {
      name: n.name,
      value: [n.value, n.colorValue != null ? Math.max(0, Math.min(100, n.colorValue)) : 50],
      actualValue: n.actualValue,
      colorValue: n.colorValue != null ? Math.max(0, Math.min(100, n.colorValue)) : 50,
      level: n.level,
      isOther: n.isOther
    };
    if (n.__minSide != null) item.__minSide = n.__minSide;
    item.itemStyle = { borderWidth: n.itemStyle && n.itemStyle.borderWidth != null ? n.itemStyle.borderWidth : 1 };
    if (n.children && n.children.length) item.children = n.children.map(function(c) { return mapNodeToEcharts(c); });
    return item;
  }
  function getLeafLayoutsFromChart(chart) {
    if (!chart) return [];
    try {
      var model = chart.getModel();
      var seriesModel = model && model.getSeriesByIndex && model.getSeriesByIndex(0);
      if (!seriesModel || !seriesModel.getData) return [];
      var data = seriesModel.getData();
      var out = [];
      var tree = data.getTree && data.getTree();
      if (tree && tree.root && typeof tree.root.eachNode === 'function') {
        tree.root.eachNode(function(node) {
          if (node.isLeaf === true || (node.children && node.children.length === 0)) {
            var layout = node.getLayout && node.getLayout();
            if (layout && layout.x != null && layout.y != null) {
              out.push({
                x: layout.x,
                y: layout.y,
                w: layout.width || 0,
                h: layout.height || 0,
                dataIndex: node.dataIndex
              });
            }
          }
        });
        return out;
      }
      for (var i = 0; i < data.count(); i++) {
        var layout = data.getItemLayout(i);
        if (!layout || layout.x == null || layout.y == null) continue;
        out.push({
          x: layout.x,
          y: layout.y,
          w: layout.width || 0,
          h: layout.height || 0,
          dataIndex: i
        });
      }
      return out;
    } catch (e) { return []; }
  }
  function computeQualityFromLayouts(layouts) {
    if (!layouts.length) return { arP95: 0, arMax: 0, minP50: 0, tinyPct: 0 };
    var ars = [], mins = [];
    for (var i = 0; i < layouts.length; i++) {
      var w = layouts[i].w || 0, h = layouts[i].h || 0;
      if (w <= 0 || h <= 0) continue;
      var ar = Math.max(w / h, h / w);
      ars.push(ar);
      mins.push(Math.min(w, h));
    }
    ars.sort(function(a, b) { return a - b; });
    mins.sort(function(a, b) { return a - b; });
    var p95Idx = Math.floor(ars.length * 0.95);
    var p50Idx = Math.floor(mins.length * 0.5);
    var arP95 = ars[p95Idx] != null ? ars[p95Idx] : 0;
    var arMax = Math.max.apply(null, ars);
    var minP50 = mins[p50Idx] != null ? mins[p50Idx] : 0;
    var tinyCount = 0;
    for (var j = 0; j < mins.length; j++) { if (mins[j] < 10) tinyCount++; }
    var tinyPct = layouts.length ? (tinyCount / layouts.length * 100) : 0;
    return { arP95: arP95, arMax: arMax, minP50: minP50, tinyPct: tinyPct };
  }
  function getAcceptance(metrics) {
    if (metrics.arP95 <= 6 && metrics.arMax <= 12 && metrics.minP50 >= 18 && metrics.tinyPct <= 15) return 'GOAL';
    if (metrics.arP95 <= 8 && metrics.arMax <= 16 && metrics.minP50 >= 14 && metrics.tinyPct <= 25) return 'SOFT';
    if (metrics.arP95 <= 10 && metrics.arMax <= 20 && metrics.minP50 >= 12 && metrics.tinyPct <= 35) return 'HARD';
    return 'FAIL';
  }
  function chooseAreaScaleBySkew(leaves) {
    if (!leaves || !leaves.length) return 'none';
    var vals = leaves.map(function(n) { return n.actualValue || 0; });
    vals.sort(function(a, b) { return a - b; });
    var p50 = vals[Math.floor(vals.length * 0.5)] || 1;
    var p99 = vals[Math.floor(vals.length * 0.99)] || p50;
    var skew = p99 / Math.max(p50, 1);
    if (skew < 20) return 'none';
    if (skew < 100) return 'sqrt';
    return 'log1p';
  }

  var advTreemapState = { areaScale: 'none', leafDepth: 6, visibleMin: 8, childrenVisibleMin: 8, topN: 0, leafCap: 0, acceptance: null, selectedNode: null, fontZoom: 1 };
  function renderTreemapV4(list) {
    var rootModeRegion = document.getElementById('adv-rootmode-region');
    var rootMode = (rootModeRegion && rootModeRegion.classList.contains('active')) ? 'region' : 'product';
    var sizeMetric = (document.getElementById('adv-size-metric-select') || {}).value || 'sales_count';
    var colorMetric = (document.getElementById('adv-color-metric-select') || {}).value || 'installation_rate_pct';
    var hierarchy = rootMode === 'region' ? buildHierarchyRegionFirst(list, sizeMetric, colorMetric) : buildHierarchyProductFirst(list, sizeMetric, colorMetric);
    var leaves = [];
    collectLeaves(hierarchy[0], leaves);
    var areaScale = chooseAreaScaleBySkew(leaves);
    advTreemapState.areaScale = areaScale;
    var tree = [cloneTree(hierarchy[0])];
    applyAreaScaleTree(tree[0], areaScale);
    var step = 0;
    if (leaves.length > 250) {
      applyTopNOther(tree, 250, 200);
      step = 3;
      advTreemapState.visibleMin = 12;
      advTreemapState.childrenVisibleMin = 12;
      advTreemapState.leafDepth = 6;
    } else {
      advTreemapState.visibleMin = areaScale === 'none' ? 8 : 10;
      advTreemapState.childrenVisibleMin = advTreemapState.visibleMin;
    }
    function lerp(t) {
      t = Math.max(0, Math.min(1, t / 100));
      var r = Math.round(220 - t * 198), g = Math.round(38 + t * 125), b = Math.round(74 - t * 52);
      return '#' + [r, g, b].map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
    }
    var treeData = tree.map(function(n) { return mapNodeToEcharts(n); });
    var baseOption = {
      animation: false,
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: function(info) {
          if (!info || !info.data) return '';
          var d = info.data;
          var actual = d.actualValue != null ? fmtNum(d.actualValue) : '—';
          var pct = d.colorValue != null ? (Number(d.colorValue).toFixed(1) + '%') : '—';
          return (info.name || '') + '<br/>actual: ' + actual + '<br/>' + pct;
        }
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: 100,
        dimension: 1,
        orient: 'vertical',
        right: 10,
        bottom: 10,
        itemWidth: 12,
        itemHeight: 80,
        textStyle: { fontSize: 9, color: '#000' },
        inRange: { color: ['#dc2626', '#eab308', '#16a34a'] }
      },
      series: [{
        type: 'treemap',
        id: 'advanced-treemap',
        roam: true,
        nodeClick: 'zoomToNode',
        sort: 'desc',
        breadcrumb: {
          show: true,
          left: 8,
          top: 8,
          itemStyle: {
            textStyle: { fontSize: 10, color: '#000' },
            borderColor: '#cbd5e1',
            borderWidth: 1,
            color: '#f8fafc'
          },
          emphasisItemStyle: { color: '#e2e8f0' }
        },
        label: { show: true, color: '#000' },
        upperLabel: {
          show: true,
          color: '#000',
          overflow: 'truncate',
          formatter: function(params) {
            if (!params || !params.name) return '';
            var r = params.rect;
            if (r && (r.height < 14 || r.width < 36)) return '';
            var name = (params.name || '').replace(/\n/g, ' ').trim();
            return name.length > 24 ? name.slice(0, 22) + '…' : name;
          }
        },
        itemStyle: { borderWidth: 1, gapWidth: 2, gapHeight: 2, borderColor: 'rgba(0,0,0,0.08)' },
        visibleMin: advTreemapState.visibleMin,
        childrenVisibleMin: advTreemapState.childrenVisibleMin,
        leafDepth: advTreemapState.leafDepth,
        levels: ADV_LEVELS_TEMPLATE,
        data: treeData
      }]
    };
    chartTreemap.setOption(baseOption, true);
    chartTreemap.getZr().flush();
    setTimeout(function() {
      var layouts = getLeafLayoutsFromChart(chartTreemap);
      window.__TREEMAP_DEBUG__ = window.__TREEMAP_DEBUG__ || {};
      window.__TREEMAP_DEBUG__.chart = chartTreemap;
      window.__TREEMAP_DEBUG__.lastRenderAt = Date.now();
      window.__TREEMAP_DEBUG__.leafLayoutsCache = layouts;
      window.__TREEMAP_DEBUG__.getLeafLayouts = function() {
        if (window.__TREEMAP_DEBUG__.leafLayoutsCache && window.__TREEMAP_DEBUG__.leafLayoutsCache.length > 0) return window.__TREEMAP_DEBUG__.leafLayoutsCache;
        return getLeafLayoutsFromChart(chartTreemap);
      };
      window.__TREEMAP_DEBUG__.getCase = function() {
        return { rootMode: rootMode, sizeMetric: sizeMetric, colorMetric: colorMetric };
      };
      window.__TREEMAP_DEBUG__.getTopBottom = function(level, n) {
        n = n || 10;
        var leaves = [];
        collectLeaves(hierarchy[0], leaves);
        leaves.sort(function(a, b) { return (b.actualValue || 0) - (a.actualValue || 0); });
        return { top: leaves.slice(0, n), bottom: leaves.slice(-n).reverse() };
      };
      var metrics = computeQualityFromLayouts(layouts);
      var acceptance = getAcceptance(metrics);
      advTreemapState.acceptance = acceptance;
      var badgeEl = document.getElementById('adv-quality-badge');
      if (badgeEl) {
        badgeEl.textContent = acceptance + ' · ' + (advTreemapState.areaScale || 'none') + (advTreemapState.topN ? ' · TopN=' + advTreemapState.topN : '');
        badgeEl.className = 'adv-quality-badge ' + (acceptance === 'GOAL' ? 'ok' : acceptance === 'FAIL' ? 'fail' : 'warn');
      }
      var scaleEl = document.getElementById('adv-area-scale-label');
      if (scaleEl) scaleEl.textContent = advTreemapState.areaScale || 'none';
      function injectMinSide(node, layoutsByIndex) {
        if (node.__minSide != null) return;
        if (!node.children || !node.children.length) {
          var l = layoutsByIndex[node.dataIndex];
          if (l) node.__minSide = Math.min(l.w, l.h);
          return;
        }
        for (var i = 0; i < node.children.length; i++) injectMinSide(node.children[i], layoutsByIndex);
      }
      var treeData2 = tree.map(function(n) {
        var copy = cloneTree(n);
        function walk(n2, idx) {
          if (!n2.children || !n2.children.length) {
            var l = layouts[idx];
            if (l) n2.__minSide = Math.min(l.w, l.h);
            return idx + 1;
          }
          var next = idx;
          for (var c = 0; c < n2.children.length; c++) next = walk(n2.children[c], next);
          return next;
        }
        walk(copy, 0);
        return mapNodeToEcharts(copy);
      });
      function shortenName(str, maxLen) {
        if (!str) return '';
        str = String(str).replace(/\n/g, ' ').trim();
        if (str.length <= maxLen) return str;
        return str.slice(0, Math.max(2, maxLen - 1)) + '…';
      }
      var labelFormatter = function(params) {
        if (!params || !params.data) return '';
        var d = params.data;
        var minSide = d.__minSide;
        if (minSide == null) minSide = 0;
        var name = (params.name || '').replace(/\n/g, ' ').trim();
        var num = d.actualValue != null ? fmtCompact(d.actualValue) : '—';
        var pct = d.colorValue != null ? (Number(d.colorValue).toFixed(1) + '%') : '—';
        var n14 = name ? shortenName(name, 14) : '';
        if (minSide >= 44) return name + '\n' + num + '\n' + pct;
        if (minSide >= 28) return (n14 || '') + '\n' + pct;
        if (minSide >= 18) return '';
        return '';
      };
      var baseLabelFont = 12;
      var applyFontZoom = function(zoomFactor) {
        var z = Math.max(0.7, Math.min(2.2, zoomFactor));
        advTreemapState.fontZoom = z;
        var scaledLevels = ADV_LEVELS_BASE.map(function(lvl) {
          var copy = {};
          if (lvl.itemStyle) copy.itemStyle = lvl.itemStyle;
          if (lvl.upperLabel) {
            copy.upperLabel = {};
            for (var k in lvl.upperLabel) copy.upperLabel[k] = lvl.upperLabel[k];
            if (typeof copy.upperLabel.fontSize === 'number') copy.upperLabel.fontSize = Math.round(copy.upperLabel.fontSize * z);
            if (typeof copy.upperLabel.height === 'number') copy.upperLabel.height = Math.round(copy.upperLabel.height * z);
          }
          return copy;
        });
        chartTreemap.setOption({
          series: [{
            id: 'advanced-treemap',
            levels: scaledLevels,
            label: {
              show: true,
              color: '#000',
              fontSize: Math.round(baseLabelFont * z),
              formatter: labelFormatter,
              overflow: 'truncate',
              width: null,
              height: null
            }
          }]
        }, { replaceMerge: ['series'] });
      };
      var fontZoomTimeout;
      var container = document.getElementById('advanced-treemap-container');
      if (container) {
        container.addEventListener('wheel', function(ev) {
          if (ev.ctrlKey || ev.metaKey) return;
          var delta = ev.deltaY > 0 ? -0.12 : 0.12;
          var next = advTreemapState.fontZoom + delta;
          clearTimeout(fontZoomTimeout);
          fontZoomTimeout = setTimeout(function() { applyFontZoom(next); }, 80);
        }, { passive: true });
      }
      chartTreemap.setOption({
        series: [{
          id: 'advanced-treemap',
          data: treeData2,
          label: {
            show: true,
            color: '#000',
            fontSize: Math.round(baseLabelFont * advTreemapState.fontZoom),
            formatter: labelFormatter,
            overflow: 'truncate',
            width: null,
            height: null
          }
        }]
      }, { replaceMerge: ['series'] });
      chartTreemap.off('click');
      chartTreemap.on('click', function(params) {
        if (params && params.data) {
          advTreemapState.selectedNode = params.data;
          var selEl = document.getElementById('adv-selection-stats');
          if (selEl) {
            var d = params.data;
            var cMetric = (document.getElementById('adv-color-metric-select') || {}).value || 'installation_rate_pct';
            selEl.innerHTML = '<strong>' + (d.name || '') + '</strong><br/>actual: ' + fmtNum(d.actualValue) + '<br/>' + cMetric + ': ' + (d.colorValue != null ? Number(d.colorValue).toFixed(1) + '%' : '—');
          }
        }
      });
      var advPanel = document.getElementById('adv-right-panel');
      if (advPanel) advPanel.style.display = currentView === 'advanced' ? 'block' : 'none';
      var selEl = document.getElementById('adv-selection-stats');
      if (selEl) {
        var sel = advTreemapState.selectedNode;
        if (sel) selEl.innerHTML = '<strong>' + (sel.name || '') + '</strong><br/>actual: ' + fmtNum(sel.actualValue) + '<br/>' + (colorMetric === 'installation_rate_pct' ? 'installation_rate_pct' : 'connection_rate_pct') + ': ' + (sel.colorValue != null ? sel.colorValue.toFixed(1) + '%' : '—');
        else selEl.innerHTML = '선택 없음 (노드 클릭 시 표시)';
      }
      var breadcrumbEl = document.getElementById('adv-breadcrumb');
      if (breadcrumbEl) breadcrumbEl.textContent = rootMode === 'region' ? 'Global > region > subsidiary > product_group > product2 > product3' : 'Global > product_group > product2 > product3 > region > subsidiary';
      var tb = window.__TREEMAP_DEBUG__.getTopBottom(undefined, 10);
      var topListEl = document.getElementById('adv-top-list');
      var bottomListEl = document.getElementById('adv-bottom-list');
      if (topListEl) topListEl.innerHTML = (tb.top || []).map(function(n) { return '<div>' + (n.name || '') + ' ' + fmtNum(n.actualValue) + '</div>'; }).join('');
      if (bottomListEl) bottomListEl.innerHTML = (tb.bottom || []).map(function(n) { return '<div>' + (n.name || '') + ' ' + fmtNum(n.actualValue) + '</div>'; }).join('');
      var qualitySummary = document.getElementById('adv-quality-summary');
      if (qualitySummary) qualitySummary.textContent = 'AR P95: ' + metrics.arP95.toFixed(1) + ', MIN P50: ' + metrics.minP50.toFixed(0) + 'px, TINY: ' + metrics.tinyPct.toFixed(1) + '%';
      var descEl = document.getElementById('left-treemap-desc');
      if (descEl && hierarchy[0] && hierarchy[0].children) {
        var topNodes = hierarchy[0].children.slice().sort(function(a, b) { return (b.actualValue || 0) - (a.actualValue || 0); }).slice(0, 3);
        var names = topNodes.map(function(n) { return n.name; });
        var sizeLabel = sizeMetric === 'sales_count' ? '판매량' : sizeMetric === 'smart_sales_count' ? '스마트 판매량' : sizeMetric === 'connected_count' ? '연결 수' : '면적 지표';
        var first = names[0] || '—';
        var rest = names.slice(1);
        var desc;
        if (rootMode === 'region') {
          desc = '지역 기준으로 ' + first + '가 가장 크고, ' + (rest.length ? rest.join(', ') + ' 순으로 이어집니다. ' : '') + '색상은 연결률 또는 설치률을 나타내며, 노드 클릭으로 해당 구간을 확대하고 마우스 휠로 확대·축소할 수 있습니다.';
        } else {
          desc = '제품군 기준으로 ' + first + '가 가장 크고, ' + (rest.length ? rest.join(', ') + ' 순입니다. ' : '') + '색상은 선택한 비율 지표를 나타냅니다. 노드를 클릭하면 해당 영역으로 확대되며 휠로 줌을 조절할 수 있습니다.';
        }
        descEl.textContent = desc;
      }
    }, 100);
  }

  /** Treemap: 축에 따라 지역만(글로벌>지역>법인) 또는 제품군만(글로벌>제품L1>L2>L3). */
  function buildTreemapHierarchy(list, sizeKey, colorKey, axis) {
    var maps = getRegionLabelMaps();
    function getRegionLabel(key, level) {
      if (key === '(Unknown)' || !key) return '(Unknown)';
      if (level === 0) return (maps.region && maps.region[key]) || key;
      if (level === 1) return (maps.corporation && maps.corporation[key]) || key;
      return key;
    }
    function rowRate(r) {
      if (colorKey === 'connected_rate_pct') return r.smart_sales > 0 ? (r.connected / r.smart_sales * 100) : null;
      return r.sales > 0 ? (r.smart_sales / r.sales * 100) : null;
    }
    var depthKeys = axis === 'product'
      ? ['product_level1', 'product_level2', 'product_level3']
      : ['region', 'entity', 'product_level1'];
    var lastLevel = depthKeys.length - 1;
    function aggregate(rows, level) {
      var keyField = depthKeys[level];
      var groups = {};
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var k = (r[keyField] == null || r[keyField] === '') ? '(Unknown)' : String(r[keyField]);
        if (!groups[k]) groups[k] = [];
        groups[k].push(r);
      }
      var children = [];
      var keys = Object.keys(groups).sort();
      for (var ki = 0; ki < keys.length; ki++) {
        var key = keys[ki];
        var sub = groups[key];
        var sumVal = 0, sumRateW = 0;
        var sumSales = 0, sumSmart = 0, sumConnected = 0;
        var rateConnW = 0, rateSmartW = 0;
        for (var si = 0; si < sub.length; si++) {
          var r = sub[si];
          var v = r[sizeKey] || 0;
          sumVal += v;
          var rate = rowRate(r);
          if (rate != null && !isNaN(rate)) sumRateW += rate * v;
          sumSales += r.sales || 0;
          sumSmart += r.smart_sales || 0;
          sumConnected += r.connected || 0;
          if (r.smart_sales > 0) rateConnW += (r.connected / r.smart_sales * 100) * r.smart_sales;
          if (r.sales > 0) rateSmartW += (r.smart_sales / r.sales * 100) * r.sales;
        }
        var rateAvg = sumVal > 0 ? sumRateW / sumVal : null;
        var rateConn = sumSmart > 0 ? rateConnW / sumSmart : null;
        var rateSmart = sumSales > 0 ? rateSmartW / sumSales : null;
        var label = axis === 'region' && level <= 1 ? getRegionLabel(key, level) : key;
        var node = {
          name: label,
          value: Math.max(1, Math.round(sumVal)),
          rate: rateAvg != null ? Math.round(rateAvg * 10) / 10 : null,
          salesSum: Math.round(sumSales),
          smartSalesSum: Math.round(sumSmart),
          connectedSum: Math.round(sumConnected),
          rateConnected: rateConn != null ? Math.round(rateConn * 10) / 10 : null,
          rateSmart: rateSmart != null ? Math.round(rateSmart * 10) / 10 : null
        };
        if (axis === 'region' && level === 1) node.isCorporation = true;
        if (axis === 'region' && level === 2) node.isProductL1 = true;
        if (level < lastLevel) {
          node.children = aggregate(sub, level + 1);
          var childSum = 0;
          for (var ci = 0; ci < node.children.length; ci++) childSum += node.children[ci].value;
          node.value = Math.max(1, childSum);
        }
        children.push(node);
      }
      return children;
    }
    if (!list.length) return [{ name: 'Global', value: 0, rate: null, salesSum: 0, smartSalesSum: 0, connectedSum: 0, rateConnected: null, rateSmart: null, children: [] }];
    var children = aggregate(list, 0);
    var totalVal = 0, totalRateW = 0, tSales = 0, tSmart = 0, tConn = 0, tRateConnW = 0, tRateSmartW = 0;
    list.forEach(function(r) {
      var v = r[sizeKey] || 0;
      totalVal += v;
      var rate = rowRate(r);
      if (rate != null && !isNaN(rate)) totalRateW += rate * v;
      tSales += r.sales || 0;
      tSmart += r.smart_sales || 0;
      tConn += r.connected || 0;
      if (r.smart_sales > 0) tRateConnW += (r.connected / r.smart_sales * 100) * r.smart_sales;
      if (r.sales > 0) tRateSmartW += (r.smart_sales / r.sales * 100) * r.sales;
    });
    var rootRate = totalVal > 0 ? totalRateW / totalVal : null;
    var rootRateConn = tSmart > 0 ? tRateConnW / tSmart : null;
    var rootRateSmart = tSales > 0 ? tRateSmartW / tSales : null;
    var rootChildSum = 0;
    for (var ri = 0; ri < children.length; ri++) rootChildSum += children[ri].value;
    return [{
      name: 'Global',
      value: Math.max(1, rootChildSum),
      rate: rootRate != null ? Math.round(rootRate * 10) / 10 : null,
      salesSum: Math.round(tSales),
      smartSalesSum: Math.round(tSmart),
      connectedSum: Math.round(tConn),
      rateConnected: rootRateConn != null ? Math.round(rootRateConn * 10) / 10 : null,
      rateSmart: rootRateSmart != null ? Math.round(rootRateSmart * 10) / 10 : null,
      children: children
    }];
  }

  function renderTreemap() {
    var dom = document.getElementById('advanced-treemap-container') || document.getElementById('treemap-container');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartTreemap) chartTreemap = echarts.init(dom);
    var list = getFilteredData();
    var advSizeEl = document.getElementById('adv-size-metric-select');
    var advRootRegion = document.getElementById('adv-rootmode-region');
    if (currentView === 'advanced' && advSizeEl && advRootRegion) {
      renderTreemapV4(list);
      return;
    }
    var metricEl = document.getElementById('treemap-metric');
    var metricKey = metricEl ? metricEl.value : 'sales';
    var sizeKey = (metricKey === 'connected_rate_pct') ? 'connected' : (metricKey === 'smart_sales_rate_pct') ? 'smart_sales' : metricKey;
    var colorEl = document.getElementById('treemap-color-metric');
    var colorKey = colorEl ? colorEl.value : 'connected_rate_pct';
    var axisRegion = document.getElementById('treemap-axis-region');
    var axisProduct = document.getElementById('treemap-axis-product');
    var axis = (axisRegion && axisRegion.classList.contains('active')) ? 'region' : 'product';
    var data = buildTreemapHierarchy(list, sizeKey, colorKey, axis);
    function lerpColor(r1, g1, b1, r2, g2, b2, t) {
      t = Math.max(0, Math.min(1, t));
      var r = Math.round(r1 + (r2 - r1) * t);
      var g = Math.round(g1 + (g2 - g1) * t);
      var b = Math.round(b1 + (b2 - b1) * t);
      return '#' + [r, g, b].map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
    }
    function mapToEcharts(n) {
      var rate = n.rate != null ? n.rate : 50;
      var t = rate / 100;
      var color = lerpColor(220, 38, 38, 22, 163, 74, t);
      var item = {
        name: n.name,
        value: n.value,
        rate: n.rate,
        salesSum: n.salesSum,
        smartSalesSum: n.smartSalesSum,
        connectedSum: n.connectedSum,
        rateConnected: n.rateConnected,
        rateSmart: n.rateSmart
      };
      if (n.isCorporation) item.isCorporation = true;
      item.itemStyle = { color: color };
      if (n.children && n.children.length) item.children = n.children.map(mapToEcharts);
      return item;
    }
    var treeData = data.map(mapToEcharts);
    var colorLabel = colorKey === 'connected_rate_pct' ? '연결률' : '스마트 판매 비율';

    /** 박스별 폰트: 선호 비율. 조정 시 0.4(작게) ~ 0.6(크게) */
    var TREEMAP_BOX_FONT_SCALE = 0.55;
    var TREEMAP_LABEL_PAD = 12;
    var TREEMAP_FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28];

    function getBoxDisplayValue(d, mKey) {
      if (mKey === 'sales' && d.salesSum != null) return fmtCompact(d.salesSum);
      if (mKey === 'smart_sales' && d.smartSalesSum != null) return fmtCompact(d.smartSalesSum);
      if (mKey === 'connected' && d.connectedSum != null) return fmtCompact(d.connectedSum);
      if (mKey === 'connected_rate_pct' && d.rateConnected != null) return d.rateConnected.toFixed(1) + '%';
      if (mKey === 'smart_sales_rate_pct' && d.rateSmart != null) return d.rateSmart.toFixed(1) + '%';
      return '—';
    }

    function computeBoxFontSize(rect, nameLen, numStrLen, fontScale) {
      var w = rect && rect.width != null ? rect.width : 60;
      var h = rect && rect.height != null ? rect.height : 40;
      var minSide = Math.min(w, h);
      var maxLen = Math.max(nameLen, numStrLen) || 1;
      var byWidth = (w - TREEMAP_LABEL_PAD) / (maxLen * 0.52);
      var byHeight = (h - TREEMAP_LABEL_PAD) / (2 * 1.25);
      var preferred = minSide * fontScale;
      var fs = Math.min(28, Math.max(8, Math.floor(Math.min(preferred, byWidth, byHeight))));
      var pick = TREEMAP_FONT_SIZES[0];
      for (var i = 0; i < TREEMAP_FONT_SIZES.length; i++) {
        if (TREEMAP_FONT_SIZES[i] <= fs) pick = TREEMAP_FONT_SIZES[i];
      }
      return pick;
    }

    var treemapLabelRich = {};
    TREEMAP_FONT_SIZES.forEach(function(fs) {
      treemapLabelRich['_' + fs] = {
        fontSize: fs,
        color: '#0f172a',
        fontWeight: 'bold',
        textBorderColor: '#fff',
        textBorderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.92)',
        align: 'center',
        lineHeight: Math.round(fs * 1.25)
      };
    });
    var legendEl = document.getElementById('treemap-legend');
    if (legendEl) {
      var title = legendEl.querySelector('.treemap-legend-title');
      if (title) title.textContent = colorLabel;
      var minL = legendEl.querySelector('.treemap-legend-min');
      if (minL) minL.textContent = '0%';
      var maxL = legendEl.querySelector('.treemap-legend-max');
      if (maxL) maxL.textContent = '100%';
    }
    chartTreemap.setOption({
      tooltip: {
        backgroundColor: 'rgba(30,41,59,0.95)',
        borderColor: '#475569',
        borderWidth: 1,
        textStyle: { color: '#f1f5f9', fontSize: 12 },
        formatter: function(info) {
          if (!info || !info.data) return '';
          var n = info.data;
          var rateVal = n.rate != null ? n.rate : null;
          var rateStr = rateVal != null ? rateVal.toFixed(1) + '%' : '—';
          var rateColor = rateVal != null ? (rateVal >= 50 ? '#22c55e' : '#dc2626') : '#94a3b8';
          var sizeStr = sizeKey === 'connected' ? fmtCompact(n.value) : fmtNum(n.value);
          var numStr = '—';
          if (metricKey === 'sales' && n.salesSum != null) numStr = fmtCompact(n.salesSum);
          else if (metricKey === 'smart_sales' && n.smartSalesSum != null) numStr = fmtCompact(n.smartSalesSum);
          else if (metricKey === 'connected' && n.connectedSum != null) numStr = fmtCompact(n.connectedSum);
          else if (metricKey === 'connected_rate_pct' && n.rateConnected != null) numStr = n.rateConnected.toFixed(1) + '%';
          else if (metricKey === 'smart_sales_rate_pct' && n.rateSmart != null) numStr = n.rateSmart.toFixed(1) + '%';
          return '<div style="font-weight:600;margin-bottom:6px">' + (info.name || '') + '</div>' +
            '메트릭: ' + numStr + '<br/>' +
            '면적: ' + sizeStr + '<br/>' +
            '<span style="font-weight:700;color:' + rateColor + '">' + colorLabel + ': ' + rateStr + '</span>';
        }
      },
      series: [{
        type: 'treemap',
        left: 2,
        right: 2,
        top: 2,
        bottom: 2,
        width: null,
        height: null,
        data: treeData,
        roam: true,
        nodeClick: 'zoomToNode',
        sort: 'desc',
        breadcrumb: {
          show: true,
          itemStyle: { textStyle: { fontSize: 10 } },
          formatter: function(param) {
            var name = param.name || '';
            if (param.data && param.data.isCorporation && param.data.rate != null) name += ' (' + param.data.rate + '%)';
            return name;
          }
        },
        label: {
          show: true,
          position: 'inside',
          align: 'center',
          verticalAlign: 'middle',
          color: '#0f172a',
          fontWeight: 'bold',
          textBorderColor: '#fff',
          textBorderWidth: 1,
          backgroundColor: 'rgba(255,255,255,0.92)',
          padding: [6, 8],
          overflow: 'none',
          formatter: function(params) {
            if (!params || !params.data) return '';
            var d = params.data;
            var name = (params.name || '').replace(/\n/g, ' ');
            var numStr = getBoxDisplayValue(d, metricKey);
            var fontSize = computeBoxFontSize(params.rect, name.length, numStr.length, TREEMAP_BOX_FONT_SCALE);
            var styleKey = '_' + fontSize;
            return '{' + styleKey + '|' + name + '\n' + numStr + '}';
          },
          rich: treemapLabelRich
        },
        upperLabel: {
          show: true,
          height: 18,
          color: '#0f172a',
          fontWeight: 'bold',
          backgroundColor: '#e2e8f0',
          padding: [2, 4],
          overflow: 'truncate',
          formatter: function(params) {
            if (!params || !params.name) return '';
            var r = params.rect;
            if (r && (r.height < 12 || r.width < 28)) return '';
            var name = params.name;
            if (params.data && params.data.isCorporation && params.data.rate != null) name += '  ' + params.data.rate + '%';
            return name;
          }
        },
        levels: [
          { itemStyle: { borderWidth: 2, borderColor: '#fff', gapWidth: 0, gapHeight: 0 }, label: { show: true }, upperLabel: { show: true, fontSize: 10, color: '#0f172a', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: [2, 6] } },
          { itemStyle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', gapWidth: 0, gapHeight: 0 }, label: { show: true }, upperLabel: { show: true, fontSize: 9, color: '#0f172a', fontWeight: 'bold', backgroundColor: '#e2e8f0', padding: [2, 4] } },
          { itemStyle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', gapWidth: 0, gapHeight: 0 }, label: { show: true }, upperLabel: { show: true, fontSize: 8, color: '#0f172a', fontWeight: 'bold', backgroundColor: '#cbd5e1', padding: [1, 4] } },
          { itemStyle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', gapWidth: 0, gapHeight: 0 }, label: { show: true }, upperLabel: { show: true, fontSize: 8, color: '#0f172a', fontWeight: 'bold', backgroundColor: '#cbd5e1', padding: [1, 3] } }
        ]
      }]
    }, true);
    if (chartTreemap) chartTreemap.resize();
  }

  function switchView(view) {
    currentView = view;
    var app = document.getElementById('app');
    if (app) app.classList.toggle('view-advanced', view === 'advanced');
    var overview = document.getElementById('main-overview');
    var advanced = document.getElementById('main-advanced');
    if (overview) overview.style.display = view === 'overview' ? 'flex' : 'none';
    if (advanced) advanced.style.display = view === 'advanced' ? 'flex' : 'none';
    var advPanel = document.getElementById('adv-right-panel');
    if (advPanel) advPanel.style.display = view === 'advanced' ? 'block' : 'none';
    var descPopup = document.getElementById('treemap-desc-popup');
    if (descPopup) descPopup.style.display = view === 'advanced' ? 'flex' : 'none';
    var btnToggle = document.getElementById('btn-toggle-panel');
    var btnExpand = document.getElementById('btn-expand-filter');
    if (btnToggle) btnToggle.style.display = view === 'advanced' ? 'none' : '';
    if (btnExpand) btnExpand.style.display = 'none';
    if (view === 'advanced') {
      var renderAttempts = 0;
      function doRender() {
        renderAttempts++;
        var container = document.getElementById('advanced-treemap-container') || document.getElementById('treemap-container');
        if (container && (container.offsetParent !== null || renderAttempts > 15)) {
          var w = container.clientWidth || container.offsetWidth;
          var h = container.clientHeight || container.offsetHeight;
          if (w > 0 && h > 0 || renderAttempts > 15) {
            renderTreemap();
            return;
          }
        }
        if (renderAttempts <= 20) requestAnimationFrame(doRender);
      }
      requestAnimationFrame(function() { requestAnimationFrame(doRender); });
    }
  }

  function getFilteredData() {
    var rKey = filterRegionPath.map(function(p) { return p.level + ':' + p.key; }).join(',');
    var pKey = [filterProduct.level1, filterProduct.level2, filterProduct.level3].join('|');
    var cacheKey = rKey + '|' + pKey + '|' + filterPeriodStart + '|' + filterPeriodEnd;
    if (cacheKey === filteredDataCacheKey) return filteredDataCacheRows;

    var byPeriod = [];
    for (var i = 0; i < rawData.length; i++) {
      var row = rawData[i];
      if (filterPeriodStart && row.year_month < filterPeriodStart) continue;
      if (filterPeriodEnd && row.year_month > filterPeriodEnd) continue;
      byPeriod.push(row);
    }
    var out = HIER ? HIER.filterDataByPath(byPeriod, filterRegionPath) : byPeriod;
    if (filterProduct.level1) {
      out = out.filter(function(r) { return r.product_level1 === filterProduct.level1; });
      if (filterProduct.level2) {
        out = out.filter(function(r) { return r.product_level2 === filterProduct.level2; });
        if (filterProduct.level3) out = out.filter(function(r) { return r.product_level3 === filterProduct.level3; });
      }
    }
    filteredDataCacheKey = cacheKey;
    filteredDataCacheRows = out;
    return out;
  }

  function getRegionLevelKeys() {
    if (!HIER) return [];
    if (filterRegionPath.length >= 3) {
      return filterRegionPath[2].key ? [filterRegionPath[2].key] : [];
    }
    var byPeriod = [];
    for (var i = 0; i < rawData.length; i++) {
      var row = rawData[i];
      if (filterPeriodStart && row.year_month < filterPeriodStart) continue;
      if (filterPeriodEnd && row.year_month > filterPeriodEnd) continue;
      byPeriod.push(row);
    }
    return HIER.getNextRegionLevelKeys(byPeriod, filterRegionPath);
  }

  function getRegionLevelIndex() {
    return filterRegionPath ? filterRegionPath.length : 0;
  }

  function getRegionLabelMap(levelIndex) {
    var name = HIER ? HIER.getLevelName(levelIndex) : 'region';
    var maps = getRegionLabelMaps();
    return maps[name] || {};
  }

  function setRegionFilter(levelIndex, key) {
    filterRegionPath = filterRegionPath.slice(0, levelIndex);
    if (key) filterRegionPath.push({ level: levelIndex, key: key });
    filteredDataCacheKey = '';
    updateState();
    renderFilterLists();
  }

  function setProductFilterLevel(level, value) {
    if (level === 1) {
      filterProduct = { level1: value || null, level2: null, level3: null };
    } else if (level === 2) {
      filterProduct = { level1: filterProduct.level1, level2: value || null, level3: null };
    } else {
      filterProduct = { level1: filterProduct.level1, level2: filterProduct.level2, level3: value || null };
    }
    filteredDataCacheKey = '';
    updateState();
    renderFilterLists();
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
      default: return k.sales;
    }
  }

  function formatMetricValue(v) {
    return fmtNum(v);
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

  function renderFilterLists() {
    var regionList = document.getElementById('filter-region-list');
    if (regionList) {
      var level = filterRegionPath.length;
      var labels = getRegionLabelMaps();
      var chips = [];
      if (level > 0) {
        chips.push('<button type="button" class="filter-chip" data-region-back="' + (level - 1) + '">← 상위</button>');
      }
      var keys = level === 0 ? REGIONS.slice().sort() : getRegionLevelKeys();
      var labelMap = getRegionLabelMap(level);
      keys.forEach(function(k) {
        var active = filterRegionPath[level] && filterRegionPath[level].key === k ? ' active' : '';
        chips.push('<button type="button" class="filter-chip' + active + '" data-region-level="' + level + '" data-region-key="' + k + '">' + (labelMap[k] || k) + '</button>');
      });
      regionList.innerHTML = chips.join('');
      regionList.querySelectorAll('.filter-chip').forEach(function(btn) {
        var back = btn.getAttribute('data-region-back');
        if (back != null) {
          btn.addEventListener('click', function() { setRegionFilter(parseInt(back, 10), null); });
          return;
        }
        var lvl = parseInt(btn.getAttribute('data-region-level'), 10);
        var key = btn.getAttribute('data-region-key');
        btn.addEventListener('click', function() {
          var newKey = filterRegionPath[lvl] && filterRegionPath[lvl].key === key ? null : key;
          setRegionFilter(lvl, newKey);
        });
      });
    }

    var productList = document.getElementById('filter-product-list');
    if (productList) {
      var chips = [];
      var drillLevel = filterProduct.level1 ? (filterProduct.level2 ? 3 : 2) : 1;
      if (drillLevel > 1) chips.push('<button type="button" class="filter-chip" data-product-back="' + (drillLevel - 1) + '">← 상위</button>');
      var options = drillLevel === 1 ? PRODUCT_LEVEL1.slice() : (drillLevel === 2 ? (PRODUCT_LEVEL2_BY_L1[filterProduct.level1] || []) : (PRODUCT_LEVEL3_BY_L1L2[filterProduct.level1 + '|' + filterProduct.level2] || []));
      options.forEach(function(name) {
        var current = (drillLevel === 1 && filterProduct.level1 === name) || (drillLevel === 2 && filterProduct.level2 === name) || (drillLevel === 3 && filterProduct.level3 === name);
        chips.push('<button type="button" class="filter-chip' + (current ? ' active' : '') + '" data-product-level="' + drillLevel + '" data-product-value="' + name + '">' + name + '</button>');
      });
      productList.innerHTML = chips.join('');
      productList.querySelectorAll('.filter-chip').forEach(function(btn) {
        var back = btn.getAttribute('data-product-back');
        if (back != null) {
          btn.addEventListener('click', function() { setProductFilterLevel(parseInt(back, 10), null); });
          return;
        }
        var lvl = parseInt(btn.getAttribute('data-product-level'), 10);
        var val = btn.getAttribute('data-product-value');
        btn.addEventListener('click', function() {
          var cur = (lvl === 1 && filterProduct.level1 === val) || (lvl === 2 && filterProduct.level2 === val) || (lvl === 3 && filterProduct.level3 === val);
          setProductFilterLevel(lvl, cur ? null : val);
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

  function capPct(v) {
    if (v == null || isNaN(v)) return null;
    var n = Number(v);
    return n > 100 ? 100 : (n < 0 ? 0 : Math.round(n * 10) / 10);
  }

  /** ECharts: 연결률 시계열 — 지역 계층 그룹핑, Y축 0~100%, x0.0% 포맷 */
  function renderLineChart() {
    var dom = document.getElementById('line-chart');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartLine) chartLine = echarts.init(dom);
    var list = getFilteredData();
    var months = MONTHS.filter(function(ym) {
      return (!filterPeriodStart || ym >= filterPeriodStart) && (!filterPeriodEnd || ym <= filterPeriodEnd);
    });
    var levelIdx = getRegionLevelIndex();
    var levelName = HIER ? HIER.getLevelName(levelIdx) : 'region';
    var labelMap = getRegionLabelMap(levelIdx);
    var byKey = {};
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      var key = HIER ? HIER.getDimensionKey(levelName, row) : row.region;
      if (!key) continue;
      if (!byKey[key]) byKey[key] = {};
      if (!byKey[key][row.year_month]) byKey[key][row.year_month] = { sales: 0, smart_sales: 0, connected: 0 };
      byKey[key][row.year_month].sales += row.sales;
      byKey[key][row.year_month].smart_sales += row.smart_sales;
      byKey[key][row.year_month].connected += row.connected;
    }
    var keys = Object.keys(byKey).sort();
    var byMonth = {};
    for (var j = 0; j < list.length; j++) {
      var r = list[j];
      if (!byMonth[r.year_month]) byMonth[r.year_month] = { sales: 0, smart_sales: 0, connected: 0 };
      byMonth[r.year_month].sales += r.sales;
      byMonth[r.year_month].smart_sales += r.smart_sales;
      byMonth[r.year_month].connected += r.connected;
    }
    var singleRateData = months.map(function(ym) {
      var m = byMonth[ym];
      if (!m || m.smart_sales <= 0) return null;
      return capPct(m.connected / m.smart_sales * 100);
    });
    var series;
    if (state.lineChartSingleRate || keys.length === 0) {
      series = [{
        name: 'Connection Rate',
        type: 'line',
        data: singleRateData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        connectNulls: false,
        lineStyle: { color: '#1428A0', width: 2 },
        itemStyle: { color: '#1428A0' }
      }];
    } else {
      series = keys.map(function(key) {
        var values = months.map(function(ym) {
          var m = byKey[key][ym];
          if (!m || m.smart_sales <= 0) return null;
          return capPct(m.connected / m.smart_sales * 100);
        });
        return {
          name: labelMap[key] || key,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: keys.length === 1 ? 8 : 6,
          connectNulls: false,
          lineStyle: { width: 2 }
        };
      });
    }
    var pctLabel = { show: true, position: 'top', formatter: function(params) { return params.value != null ? Number(params.value).toFixed(1) + '%' : ''; } };
    series.forEach(function(s) { s.label = pctLabel; });

    var names = series.map(function(s) { return s.name; });
    if (selectedLineName && names.indexOf(selectedLineName) === -1) selectedLineName = null;
    series = applyLineSelectionStyles(series);

    var nameToKey = {};
    keys.forEach(function(k) { nameToKey[labelMap[k] || k] = k; });
    var byMonthAgg = {};
    for (var j = 0; j < list.length; j++) {
      var r = list[j];
      if (!byMonthAgg[r.year_month]) byMonthAgg[r.year_month] = { sales: 0, smart_sales: 0, connected: 0 };
      byMonthAgg[r.year_month].sales += r.sales;
      byMonthAgg[r.year_month].smart_sales += r.smart_sales;
      byMonthAgg[r.year_month].connected += r.connected;
    }

    var showLegend = series.length > 1;
    chartLine.setOption({
      grid: { left: 84, right: 28, top: 28, bottom: 36 },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (!params || params.componentSubType !== 'line') return '';
          var idx = params.dataIndex;
          var ym = months[idx];
          var key = nameToKey[params.seriesName];
          var m = key && byKey[key] && byKey[key][ym] ? byKey[key][ym] : (params.seriesName === 'Connection Rate' ? byMonthAgg[ym] : null);
          var val = params.value != null ? capPct(params.value) : null;
          var head = ym + (params.seriesName && params.seriesName !== 'Connection Rate' ? ' · ' + params.seriesName : '') + '<br/>연결률: ' + (val != null ? val.toFixed(1) + '%' : '—');
          if (m) head += '<br/>판매: ' + fmtNum(m.sales) + ' · 스마트: ' + fmtNum(m.smart_sales) + ' · 연결: ' + fmtNum(m.connected) + '<br/>스마트 비율: ' + fmtPct(m.sales > 0 ? m.smart_sales / m.sales * 100 : null);
          return head;
        }
      },
      legend: showLegend ? {
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
        min: 0,
        max: 100,
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

  /** ECharts: 지역 막대 — 글로벌 > 지역 > 법인 > 국가 (국가 이하 없음), 클릭 시 필터에 반영 */
  function renderBarChartRegion() {
    var dom = document.getElementById('bar-chart-region');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartBarRegion) chartBarRegion = echarts.init(dom);
    var list = getFilteredData();
    var titleEl = document.getElementById('chart-title-region');
    var levelIdx = getRegionLevelIndex();
    var levelNames = ['지역별', '법인별', '국가별'];
    var metricNames = { sales: '판매량', smart_sales: '스마트 판매량', connected: '연결 수' };
    var metricName = metricNames[state.metric] || '판매량';
    if (titleEl) titleEl.textContent = (levelNames[levelIdx] || '지역별') + ' ' + metricName;

    var keys = getRegionLevelKeys();
    var levelName = HIER ? HIER.getLevelName(levelIdx) : 'region';
    var labelMap = getRegionLabelMap(levelIdx);
    var byKey = {};
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      var key = HIER ? HIER.getDimensionKey(levelName, row) : row.region;
      if (!key) continue;
      if (!byKey[key]) byKey[key] = { sales: 0, smart_sales: 0, connected: 0 };
      byKey[key].sales += row.sales;
      byKey[key].smart_sales += row.smart_sales;
      byKey[key].connected += row.connected;
    }
    keys = keys.filter(function(k) { return byKey[k]; });
    if (keys.length === 0) keys = Object.keys(byKey).sort();

    var yLabels = keys.map(function(k) { return labelMap[k] || k; });
    var salesData = keys.map(function(k) { return byKey[k].sales; });
    var smartSalesData = keys.map(function(k) { return byKey[k].smart_sales; });
    var connectedData = keys.map(function(k) { return byKey[k].connected; });
    var seriesRegion = [];
    if (state.metric === 'sales') {
      seriesRegion = [
        { name: '판매', type: 'bar', data: salesData, barMaxWidth: 22, itemStyle: { color: COLOR_MAP.sales }, label: { show: true, position: 'right', formatter: function(p) { var m = byKey[keys[p.dataIndex]]; var ratio = m && m.sales > 0 ? (m.smart_sales / m.sales * 100).toFixed(1) : '-'; return fmtNum(p.value) + ' (' + ratio + '%)'; } } },
        { name: '스마트 판매', type: 'bar', data: smartSalesData, barMaxWidth: 14, barGap: '-100%', itemStyle: { color: COLOR_MAP.smart_sales }, label: { show: true, position: 'insideBottom', formatter: function(p) { var m = byKey[keys[p.dataIndex]]; var ratio = m && m.sales > 0 ? (m.smart_sales / m.sales * 100).toFixed(1) : '-'; return fmtNum(p.value) + ' (' + ratio + '%)'; } } }
      ];
    } else if (state.metric === 'smart_sales') {
      seriesRegion = [
        { name: '스마트 판매', type: 'bar', data: smartSalesData, barMaxWidth: 22, itemStyle: { color: COLOR_MAP.smart_sales }, label: { show: true, position: 'right', formatter: function(p) { return fmtNum(p.value); } } },
        { name: '연결대수', type: 'bar', data: connectedData, barMaxWidth: 14, barGap: '-100%', itemStyle: { color: COLOR_MAP.connected }, label: { show: true, position: 'insideBottom', formatter: function(p) { var m = byKey[keys[p.dataIndex]]; var ratio = m && m.smart_sales > 0 ? (m.connected / m.smart_sales * 100).toFixed(1) : '-'; return fmtNum(p.value) + ' (' + ratio + '%)'; } } }
      ];
    } else {
      seriesRegion = [
        { name: '연결 수', type: 'bar', data: connectedData, barMaxWidth: 22, itemStyle: { color: COLOR_MAP.connected }, label: { show: true, position: 'right', formatter: function(p) { return fmtNum(p.value); } } }
      ];
    }
    chartBarRegion.setOption({
      grid: { left: 120, right: 64, top: 16, bottom: 24 },
      barCategoryGap: '50%',
      tooltip: {
        trigger: 'axis',
        formatter: (function() {
          return function(params) {
            if (!params || !params.length) return '';
            var idx = params[0].dataIndex;
            var k = keys[idx];
            if (!k || !byKey[k]) return '';
            var m = byKey[k];
            var smartPct = m.sales > 0 ? (m.smart_sales / m.sales * 100) : null;
            var connPct = m.smart_sales > 0 ? (m.connected / m.smart_sales * 100) : null;
            return (labelMap[k] || k) + '<br/>판매: ' + fmtNum(m.sales) + ' · 스마트: ' + fmtNum(m.smart_sales) + ' · 연결: ' + fmtNum(m.connected) + '<br/>스마트 비율: ' + fmtPct(smartPct) + ' · 연결률: ' + fmtPct(connPct);
          };
        })()
      },
      xAxis: { type: 'value', axisLabel: { formatter: '{value}' } },
      yAxis: { type: 'category', data: yLabels, inverse: true, axisLabel: { width: 110, overflow: 'break', interval: 0 } },
      series: seriesRegion
    }, true);
    chartBarRegion.off('click');
    chartBarRegion.on('click', function(params) {
      if (params.componentType !== 'series') return;
      var idx = params.dataIndex;
      var key = keys[idx];
      if (key == null) return;
      var toggle = filterRegionPath[levelIdx] && filterRegionPath[levelIdx].key === key;
      setRegionFilter(levelIdx, toggle ? null : key);
      if (!toggle) showToast('필터: ' + (labelMap[key] || key), true);
      advanceGuideIfStep(1);
    });
  }

  /** ECharts: 제품군별 가로 막대 — 제품군 > 레벨2 > 레벨3, 클릭 시 필터에 반영 */
  function renderBarChartProduct() {
    var dom = document.getElementById('bar-chart-product');
    if (!dom || typeof echarts === 'undefined') return;
    if (!chartBarProduct) chartBarProduct = echarts.init(dom);
    var list = getFilteredData();
    var titleEl = document.getElementById('chart-title-product');
    var keyField = 'product_level1';
    var drillLevel = 1;
    var orderedKeys = PRODUCT_LEVEL1.slice();
    var metricNamesP = { sales: '판매량', smart_sales: '스마트 판매량', connected: '연결 수' };
    var metricNameP = metricNamesP[state.metric] || '판매량';
    if (filterProduct.level1 && !filterProduct.level2) {
      keyField = 'product_level2';
      drillLevel = 2;
      orderedKeys = (PRODUCT_LEVEL2_BY_L1[filterProduct.level1] || []).slice();
      if (titleEl) titleEl.textContent = '제품군 레벨2 ' + metricNameP;
    } else if (filterProduct.level1 && filterProduct.level2) {
      keyField = 'product_level3';
      drillLevel = 3;
      orderedKeys = (PRODUCT_LEVEL3_BY_L1L2[filterProduct.level1 + '|' + filterProduct.level2] || []).slice();
      if (titleEl) titleEl.textContent = '제품군 레벨3 ' + metricNameP;
    } else if (titleEl) titleEl.textContent = '제품군별 ' + metricNameP;

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

    var salesDataP = orderedKeys.map(function(name) { return byProduct[name].sales; });
    var smartSalesDataP = orderedKeys.map(function(name) { return byProduct[name].smart_sales; });
    var connectedDataP = orderedKeys.map(function(name) { return byProduct[name].connected; });
    var seriesProduct = [];
    if (state.metric === 'sales') {
      seriesProduct = [
        { name: '판매', type: 'bar', data: salesDataP, barMaxWidth: 22, itemStyle: { color: COLOR_MAP.sales }, label: { show: true, position: 'right', formatter: function(p) { var m = byProduct[orderedKeys[p.dataIndex]]; var ratio = m && m.sales > 0 ? (m.smart_sales / m.sales * 100).toFixed(1) : '-'; return fmtNum(p.value) + ' (' + ratio + '%)'; } } },
        { name: '스마트 판매', type: 'bar', data: smartSalesDataP, barMaxWidth: 14, barGap: '-100%', itemStyle: { color: COLOR_MAP.smart_sales }, label: { show: true, position: 'insideBottom', formatter: function(p) { var m = byProduct[orderedKeys[p.dataIndex]]; var ratio = m && m.sales > 0 ? (m.smart_sales / m.sales * 100).toFixed(1) : '-'; return fmtNum(p.value) + ' (' + ratio + '%)'; } } }
      ];
    } else if (state.metric === 'smart_sales') {
      seriesProduct = [
        { name: '스마트 판매', type: 'bar', data: smartSalesDataP, barMaxWidth: 22, itemStyle: { color: COLOR_MAP.smart_sales }, label: { show: true, position: 'right', formatter: function(p) { return fmtNum(p.value); } } },
        { name: '연결대수', type: 'bar', data: connectedDataP, barMaxWidth: 14, barGap: '-100%', itemStyle: { color: COLOR_MAP.connected }, label: { show: true, position: 'insideBottom', formatter: function(p) { var m = byProduct[orderedKeys[p.dataIndex]]; var ratio = m && m.smart_sales > 0 ? (m.connected / m.smart_sales * 100).toFixed(1) : '-'; return fmtNum(p.value) + ' (' + ratio + '%)'; } } }
      ];
    } else {
      seriesProduct = [
        { name: '연결 수', type: 'bar', data: connectedDataP, barMaxWidth: 22, itemStyle: { color: COLOR_MAP.connected }, label: { show: true, position: 'right', formatter: function(p) { return fmtNum(p.value); } } }
      ];
    }
    chartBarProduct.setOption({
      grid: { left: 72, right: 64, top: 16, bottom: 24 },
      barCategoryGap: '50%',
      tooltip: {
        trigger: 'axis',
        formatter: (function() {
          return function(params) {
            if (!params || !params.length) return '';
            var idx = params[0].dataIndex;
            var name = orderedKeys[idx];
            if (!name || !byProduct[name]) return '';
            var m = byProduct[name];
            var smartPct = m.sales > 0 ? (m.smart_sales / m.sales * 100) : null;
            var connPct = m.smart_sales > 0 ? (m.connected / m.smart_sales * 100) : null;
            return name + '<br/>판매: ' + fmtNum(m.sales) + ' · 스마트: ' + fmtNum(m.smart_sales) + ' · 연결: ' + fmtNum(m.connected) + '<br/>스마트 비율: ' + fmtPct(smartPct) + ' · 연결률: ' + fmtPct(connPct);
          };
        })()
      },
      xAxis: { type: 'value', axisLabel: { formatter: '{value}' } },
      yAxis: { type: 'category', data: orderedKeys, inverse: true, axisLabel: { width: 72, overflow: 'break', interval: 0, fontSize: 11 } },
      series: seriesProduct
    }, true);
    chartBarProduct.off('click');
    chartBarProduct.on('click', function(params) {
      if (params.componentType !== 'series') return;
      var idx = params.dataIndex;
      var name = orderedKeys[idx];
      if (name == null) return;
      var current = (drillLevel === 1 && filterProduct.level1 === name) || (drillLevel === 2 && filterProduct.level2 === name) || (drillLevel === 3 && filterProduct.level3 === name);
      setProductFilterLevel(drillLevel, current ? null : name);
      if (!current) showToast('필터: ' + name, true);
    });
  }

  function updateSelection() {
    /* 선택 상태는 우측 필터 영역에 반영됨 */
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
    var n = getFilteredData().length;
    el.textContent = '표시 데이터: ' + fmtNum(n) + '건';
  }

  function updateKPIActiveMetric() {
    document.querySelectorAll('.kpi-card-metric').forEach(function(card) {
      var m = card.getAttribute('data-metric');
      card.classList.toggle('metric-active', m === state.metric);
    });
  }

  function updateState() {
    setThemeByMetric(state.metric);
    updateSelection();
    updateDataRowCount();
    updateKPI();
    updateKPIActiveMetric();
    adjustBarChartHeight();
    renderLineChart();
    renderBarChartRegion();
    renderBarChartProduct();
  }

  function adjustBarChartHeight() {
    var main = document.getElementById('main');
    if (!main) return;
    var target = 960;
    var minH = 440;
    while (target >= minH) {
      document.documentElement.style.setProperty('--bar-chart-height', target + 'px');
      if (main.scrollHeight <= main.clientHeight + 2) break;
      target = Math.round(target * 0.9);
    }
    if (target < minH) document.documentElement.style.setProperty('--bar-chart-height', minH + 'px');
    else document.documentElement.style.setProperty('--bar-chart-height', target + 'px');
  }

  /** Pivot: 지역 1~3단계(지역/법인/국가), 제품 1~3단계(L1/L2/L3) 선택 시 해당 컬럼 추가. 상위→하위 순 */
  function getPivotRows() {
    var list = getFilteredData();
    var rDepth = pivotRegionDepth;
    var pDepth = pivotProductDepth;
    var maps = getRegionLabelMaps();
    var byRow = {};
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var rKeys = [r.region || '', (r.entity || ''), (r.country || '')];
      var pKeys = [(r.product_level1 || ''), (r.product_level2 || ''), (r.product_level3 || '')];
      var key = rKeys.slice(0, rDepth).join('\t') + '\t' + pKeys.slice(0, pDepth).join('\t');
      if (!byRow[key]) {
        var rec = { sales: 0, smart_sales: 0, connected: 0 };
        for (var ri = 0; ri < rDepth; ri++) rec['region' + ri] = (ri === 0 ? (maps.region && maps.region[rKeys[0]]) : (ri === 1 ? (maps.corporation && maps.corporation[rKeys[1]]) : (maps.country && maps.country[rKeys[2]]))) || rKeys[ri] || '—';
        for (var pi = 0; pi < pDepth; pi++) rec['product' + pi] = pKeys[pi] || '—';
        byRow[key] = rec;
      }
      byRow[key].sales += r.sales;
      byRow[key].smart_sales += r.smart_sales;
      byRow[key].connected += r.connected;
    }
    return Object.keys(byRow).sort().map(function(k) {
      var row = byRow[k];
      var smartRate = row.sales > 0 ? (row.smart_sales / row.sales * 100) : null;
      var connRate = row.smart_sales > 0 ? (row.connected / row.smart_sales * 100) : null;
      var out = { sales: row.sales, smart_sales: row.smart_sales, connected: row.connected, smart_sales_rate_pct: smartRate != null ? Math.round(smartRate * 10) / 10 : null, connected_rate_pct: connRate != null ? Math.round(connRate * 10) / 10 : null };
      for (var ri = 0; ri < rDepth; ri++) out['region' + ri] = row['region' + ri];
      for (var pi = 0; pi < pDepth; pi++) out['product' + pi] = row['product' + pi];
      return out;
    });
  }

  function renderPivot() {
    var rows = getPivotRows();
    if (pivotSort.key) {
      rows.sort(function(a, b) {
        var va = a[pivotSort.key] != null ? a[pivotSort.key] : 0;
        var vb = b[pivotSort.key] != null ? b[pivotSort.key] : 0;
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

    var metricLabel = state.metric === 'sales' ? '판매량' : state.metric === 'smart_sales' ? '스마트 판매량' : '연결 수';
    var rDepth = pivotRegionDepth;
    var pDepth = pivotProductDepth;
    var regionHeaders = ['지역', '법인', '국가'].slice(0, rDepth);
    var productHeaders = ['제품군 L1', '제품군 L2', '제품군 L3'].slice(0, pDepth);
    var filteredCount = getFilteredData().length;
    var pivotCaptionEl = document.querySelector('.pivot-caption');
    if (pivotCaptionEl) pivotCaptionEl.innerHTML = '행 차원: 지역(1~3단계) · 열 차원: 제품군(1~3단계) · Metric: <span id="pivot-metric-label">' + metricLabel + '</span> &nbsp;|&nbsp; 집계 행 <strong>' + rows.length + '</strong>개 (표시 데이터 ' + fmtNum(filteredCount) + '건 기준)';
    var theadRow = document.getElementById('pivot-thead-row');
    if (theadRow) {
      var ths = regionHeaders.map(function(h) { return '<th>' + h + '</th>'; }).join('') + productHeaders.map(function(h) { return '<th>' + h + '</th>'; }).join('') + '<th class="numeric" data-sort="sales">판매량</th><th class="numeric" data-sort="smart_sales">스마트 판매량</th><th class="numeric" data-sort="connected">연결 수</th><th class="numeric" data-sort="smart_sales_rate_pct">스마트 판매 비율</th><th class="numeric" data-sort="connected_rate_pct">연결률</th>';
      theadRow.innerHTML = ths;
      var table = document.getElementById('pivot-table');
      if (table) {
        var numericThs = table.querySelectorAll('th.numeric');
        for (var ni = 0; ni < numericThs.length; ni++) {
          (function(th) {
            th.onclick = function() {
              var key = th.getAttribute('data-sort');
              if (pivotSort.key === key) pivotSort.asc = !pivotSort.asc;
              else { pivotSort.key = key; pivotSort.asc = true; }
              renderPivot();
            };
          })(numericThs[ni]);
        }
      }
    }
    var tfootSummary = document.getElementById('pivot-tfoot-summary');
    if (tfootSummary) { tfootSummary.colSpan = rDepth + pDepth; tfootSummary.textContent = '합계'; }

    var pageSize = pivotPageSize;
    var totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (pivotPage >= totalPages) pivotPage = Math.max(0, totalPages - 1);
    var start = pivotPage * pageSize;
    var pageList = rows.slice(start, start + pageSize);
    var tbody = document.querySelector('#pivot-table tbody');
    if (tbody) {
      tbody.innerHTML = pageList.map(function(r) {
        var regionTds = [];
        for (var ri = 0; ri < rDepth; ri++) regionTds.push('<td>' + (r['region' + ri] || '—') + '</td>');
        var productTds = [];
        for (var pi = 0; pi < pDepth; pi++) productTds.push('<td>' + (r['product' + pi] || '—') + '</td>');
        return '<tr>' + regionTds.join('') + productTds.join('') + '<td class="numeric">' + fmtNum(r.sales) + '</td><td class="numeric">' + fmtNum(r.smart_sales) + '</td><td class="numeric">' + fmtNum(r.connected) + '</td><td class="numeric">' + fmtPct(r.smart_sales_rate_pct) + '</td><td class="numeric">' + fmtPct(r.connected_rate_pct) + '</td></tr>';
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

    var pageInfo = document.getElementById('pivot-page-info');
    if (pageInfo) pageInfo.textContent = (pivotPage + 1) + ' / ' + totalPages;
    var prev = document.getElementById('pivot-prev');
    var next = document.getElementById('pivot-next');
    if (prev) prev.onclick = function() { if (pivotPage > 0) { pivotPage--; renderPivot(); } };
    if (next) next.onclick = function() { if (pivotPage < totalPages - 1) { pivotPage++; renderPivot(); } };
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
    var rightColumn = document.getElementById('right-column');
    var right = document.getElementById('right-panel');
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
    var filterRegionList = document.getElementById('filter-region-list');

    var items = [];
    items.push({ name: 'L1 가로 오버플로우', pass: doc.scrollWidth <= doc.clientWidth + 1, detail: 'scrollWidth=' + doc.scrollWidth + ' clientWidth=' + doc.clientWidth });
    var topbarBottom = topbar ? topbar.getBoundingClientRect().bottom : 0;
    var mainTop = main ? main.getBoundingClientRect().top : 0;
    items.push({ name: 'topbar vs main 겹침 없음', pass: mainTop >= topbarBottom - 2, detail: 'topbarBottom=' + topbarBottom + ' mainTop=' + mainTop });
    var rightCollapsed = rightColumn && rightColumn.classList.contains('collapsed');
    items.push({ name: '우측 패널 접기 시 가로 오버플로우 없음', pass: rightCollapsed ? (doc.scrollWidth <= doc.clientWidth + 1) : true, detail: rightCollapsed ? ('scrollWidth=' + doc.scrollWidth) : 'N/A' });
    items.push({ name: '라인 차트(ECharts) 존재', pass: !!chartLine, detail: chartLine ? 'OK' : '미초기화' });
    items.push({ name: '계층 가로 막대 차트 존재', pass: !!chartBarRegion, detail: chartBarRegion ? 'OK' : '미초기화' });
    items.push({ name: '제품군 가로 막대 차트 존재', pass: !!chartBarProduct, detail: chartBarProduct ? 'OK' : '미초기화' });
    items.push({ name: '필터 지역 목록 존재', pass: !!filterRegionList, detail: filterRegionList ? 'OK' : 'N/A' });
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

    var rightCollapsedNow = rightColumn && rightColumn.classList.contains('collapsed');
    items.push({ name: '지역 필터 경로', pass: Array.isArray(filterRegionPath), detail: 'length=' + (filterRegionPath ? filterRegionPath.length : 0) });
    var bodyFont = document.body ? window.getComputedStyle(document.body).fontSize : '';
    var bodyFontNum = bodyFont ? parseFloat(bodyFont) : 0;
    items.push({ name: '정보시각화: 본문 폰트 크기(11~14pt 권장)', pass: bodyFontNum >= 10 && bodyFontNum <= 16, detail: 'body fontSize=' + bodyFont });
    var textColor = document.body ? window.getComputedStyle(document.body).color : '';
    var bgColor = document.body ? window.getComputedStyle(document.body).backgroundColor : '';
    items.push({ name: '정보시각화: 텍스트/배경 대비 존재', pass: !!(textColor && bgColor), detail: 'text=' + textColor + ' bg=' + bgColor });

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

  var guideMessages = [
    '1단계: 우측 <strong>필터</strong>에서 지역 버튼을 클릭해 보세요. 선택하면 다음 단계가 아래에 표시됩니다.',
    '2단계: <strong>제품군</strong> 필터에서 항목을 선택해 보세요.',
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
        var barRegion = document.getElementById('bar-chart-region');
        if (barRegion) {
          var rect = barRegion.getBoundingClientRect();
          spotlight.style.top = rect.top + 'px';
          spotlight.style.left = rect.left + 'px';
          spotlight.style.width = rect.width + 'px';
          spotlight.style.height = rect.height + 'px';
          spotlight.classList.add('highlight');
        }
      } else if (step === 2) {
        var productList = document.getElementById('filter-product-list');
        if (productList) {
          var rect = productList.getBoundingClientRect();
          spotlight.style.top = rect.top + 'px';
          spotlight.style.left = rect.left + 'px';
          spotlight.style.width = rect.width + 'px';
          spotlight.style.height = rect.height + 'px';
          spotlight.classList.add('highlight');
        }
      } else if (step === 3) {
        var pivotBtn = document.getElementById('btn-pivot-card');
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

    try {
      if (sessionStorage.getItem('ccm_guide_done') !== '1') {
        setTimeout(function() { showGuide(1); }, 400);
      }
    } catch (_) {}

    var leftNavLinks = document.querySelectorAll('#left-nav a');
    leftNavLinks.forEach(function(a, idx) {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        leftNavLinks.forEach(function(x) { x.classList.remove('active'); });
        a.classList.add('active');
        if (idx === 0) switchView('overview');
        else if (idx === 2) switchView('advanced');
      });
    });

    var treemapMetricEl = document.getElementById('treemap-metric');
    var treemapColorEl = document.getElementById('treemap-color-metric');
    if (treemapMetricEl) treemapMetricEl.addEventListener('change', function() { if (currentView === 'advanced') renderTreemap(); });
    if (treemapColorEl) treemapColorEl.addEventListener('change', function() { if (currentView === 'advanced') renderTreemap(); });
    var advRootRegion = document.getElementById('adv-rootmode-region');
    var advRootProduct = document.getElementById('adv-rootmode-product');
    if (advRootRegion) advRootRegion.addEventListener('click', function() {
      if (currentView !== 'advanced') return;
      advRootRegion.classList.add('active'); advRootRegion.setAttribute('aria-pressed', 'true');
      if (advRootProduct) { advRootProduct.classList.remove('active'); advRootProduct.setAttribute('aria-pressed', 'false'); }
      renderTreemap();
    });
    if (advRootProduct) advRootProduct.addEventListener('click', function() {
      if (currentView !== 'advanced') return;
      advRootProduct.classList.add('active'); advRootProduct.setAttribute('aria-pressed', 'true');
      if (advRootRegion) { advRootRegion.classList.remove('active'); advRootRegion.setAttribute('aria-pressed', 'false'); }
      renderTreemap();
    });
    var advSizeSelect = document.getElementById('adv-size-metric-select');
    var advColorSelect = document.getElementById('adv-color-metric-select');
    if (advSizeSelect) advSizeSelect.addEventListener('change', function() { if (currentView === 'advanced') renderTreemap(); });
    if (advColorSelect) advColorSelect.addEventListener('change', function() { if (currentView === 'advanced') renderTreemap(); });
    ['adv-preset-region-sales', 'adv-preset-region-conn', 'adv-preset-region-rate', 'adv-preset-product-sales'].forEach(function(id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', function() {
        if (currentView !== 'advanced') return;
        if (id === 'adv-preset-region-sales') { if (advRootRegion) advRootRegion.click(); advSizeSelect && (advSizeSelect.value = 'sales_count'); }
        if (id === 'adv-preset-region-conn') { if (advRootRegion) advRootRegion.click(); advSizeSelect && (advSizeSelect.value = 'connected_count'); }
        if (id === 'adv-preset-region-rate') { if (advRootRegion) advRootRegion.click(); advColorSelect && (advColorSelect.value = 'connection_rate_pct'); }
        if (id === 'adv-preset-product-sales') { if (advRootProduct) advRootProduct.click(); advSizeSelect && (advSizeSelect.value = 'sales_count'); }
        renderTreemap();
      });
    });
    var treemapAxisRegion = document.getElementById('treemap-axis-region');
    var treemapAxisProduct = document.getElementById('treemap-axis-product');
    if (treemapAxisRegion) treemapAxisRegion.addEventListener('click', function() {
      if (currentView !== 'advanced') return;
      treemapAxisRegion.classList.add('active');
      treemapAxisRegion.setAttribute('aria-pressed', 'true');
      if (treemapAxisProduct) { treemapAxisProduct.classList.remove('active'); treemapAxisProduct.setAttribute('aria-pressed', 'false'); }
      renderTreemap();
    });
    if (treemapAxisProduct) treemapAxisProduct.addEventListener('click', function() {
      if (currentView !== 'advanced') return;
      treemapAxisProduct.classList.add('active');
      treemapAxisProduct.setAttribute('aria-pressed', 'true');
      if (treemapAxisRegion) { treemapAxisRegion.classList.remove('active'); treemapAxisRegion.setAttribute('aria-pressed', 'false'); }
      renderTreemap();
    });
    var treemapContainerEl = document.getElementById('advanced-treemap-container') || document.getElementById('treemap-container');
    if (treemapContainerEl && typeof ResizeObserver !== 'undefined') {
      var treemapResizeObserver = new ResizeObserver(function() {
        if (chartTreemap) chartTreemap.resize();
      });
      treemapResizeObserver.observe(treemapContainerEl);
    }

    document.querySelectorAll('.kpi-card-metric').forEach(function(card) {
      card.addEventListener('click', function() {
        var m = this.getAttribute('data-metric');
        if (!m) return;
        state.metric = m;
        updateState();
      });
    });
    var btnLineSingle = document.getElementById('btn-line-single');
    if (btnLineSingle) btnLineSingle.addEventListener('click', function() {
      state.lineChartSingleRate = !state.lineChartSingleRate;
      this.classList.toggle('active', state.lineChartSingleRate);
      this.setAttribute('aria-pressed', state.lineChartSingleRate ? 'true' : 'false');
      this.textContent = state.lineChartSingleRate ? '나눠보기' : '합쳐보기';
      if (state.lineChartSingleRate) selectedLineName = null;
      updateState();
    });
    var btnPivotCard = document.getElementById('btn-pivot-card');
    if (btnPivotCard) btnPivotCard.addEventListener('click', function() {
      pivotPage = 0;
      renderPivot();
      var overlay = document.getElementById('pivot-overlay');
      if (overlay) { overlay.classList.add('show'); overlay.setAttribute('aria-hidden', 'false'); }
      advanceGuideIfStep(3);
    });

    var pivotPageSizeEl = document.getElementById('pivot-page-size');
    if (pivotPageSizeEl) {
      pivotPageSizeEl.value = String(pivotPageSize);
      pivotPageSizeEl.addEventListener('change', function() {
        pivotPageSize = parseInt(this.value, 10) || DEFAULT_PAGE_SIZE;
        pivotPage = 0;
        renderPivot();
      });
    }
    var pivotRegionDepthEl = document.getElementById('pivot-region-depth');
    if (pivotRegionDepthEl) {
      pivotRegionDepthEl.value = String(pivotRegionDepth);
      pivotRegionDepthEl.addEventListener('change', function() {
        pivotRegionDepth = Math.min(3, Math.max(1, parseInt(this.value, 10) || 1));
        pivotPage = 0;
        renderPivot();
      });
    }
    var pivotProductDepthEl = document.getElementById('pivot-product-depth');
    if (pivotProductDepthEl) {
      pivotProductDepthEl.value = String(pivotProductDepth);
      pivotProductDepthEl.addEventListener('change', function() {
        pivotProductDepth = Math.min(3, Math.max(1, parseInt(this.value, 10) || 1));
        pivotPage = 0;
        renderPivot();
      });
    }

    window.addEventListener('resize', function() {
      checkHorizontalOverflow();
      adjustBarChartHeight();
      if (chartLine) chartLine.resize();
      if (chartBarRegion) chartBarRegion.resize();
      if (chartBarProduct) chartBarProduct.resize();
      if (chartTreemap) chartTreemap.resize();
      var overlay = document.getElementById('pivot-overlay');
      if (overlay && overlay.classList.contains('show')) renderPivot();
    });

    var btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', function() {
      filterRegionPath = [];
      filterProduct = { level1: null, level2: null, level3: null };
      filterPeriodStart = MONTHS[0];
      filterPeriodEnd = MONTHS[MONTHS.length - 1];
      filterPeriodUnit = PERIOD_UNITS[0].value;
      selectedLineName = null;
      filteredDataCacheKey = '';
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
    var rightColumn = document.getElementById('right-column');
    var expandBtn = document.getElementById('btn-expand-filter');
    if (btnTogglePanel && rightColumn) btnTogglePanel.addEventListener('click', function() {
      rightColumn.classList.add('collapsed');
      var app = document.getElementById('app');
      if (app) app.classList.add('right-collapsed');
      if (expandBtn) { expandBtn.innerHTML = '<span class="filter-collapse-icon" aria-hidden="true">▲</span> 필터 펼치기'; expandBtn.style.display = ''; }
      this.style.display = 'none';
      setTimeout(function() {
        if (chartLine) chartLine.resize();
        if (chartBarRegion) chartBarRegion.resize();
        if (chartBarProduct) chartBarProduct.resize();
        if (chartTreemap) chartTreemap.resize();
        adjustBarChartHeight();
      }, 220);
      checkHorizontalOverflow();
    });
    if (expandBtn && rightColumn) expandBtn.addEventListener('click', function() {
      rightColumn.classList.remove('collapsed');
      var app = document.getElementById('app');
      if (app) app.classList.remove('right-collapsed');
      if (btnTogglePanel) { btnTogglePanel.innerHTML = '<span class="filter-collapse-icon" aria-hidden="true">▼</span> 필터 접기'; btnTogglePanel.style.display = ''; }
      this.style.display = 'none';
      setTimeout(function() {
        if (chartLine) chartLine.resize();
        if (chartBarRegion) chartBarRegion.resize();
        if (chartBarProduct) chartBarProduct.resize();
        if (chartTreemap) chartTreemap.resize();
        adjustBarChartHeight();
      }, 220);
      checkHorizontalOverflow();
    });

    var btnDrillReset = document.getElementById('btn-drill-reset');
    if (btnDrillReset) btnDrillReset.addEventListener('click', function() {
      var changed = filterRegionPath.length > 0 || filterProduct.level1 || filterProduct.level2 || filterProduct.level3;
      filterRegionPath = [];
      filterProduct = { level1: null, level2: null, level3: null };
      if (changed) {
        updateState();
        renderFilterLists();
      }
    });

    (function initTreemapDescPopup() {
      var popup = document.getElementById('treemap-desc-popup');
      var dragHandle = document.getElementById('treemap-desc-drag');
      var resizeHandle = document.getElementById('treemap-desc-resize');
      var toggleBtn = document.getElementById('treemap-desc-toggle');
      if (!popup || !dragHandle) return;
      if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          popup.classList.toggle('collapsed');
          toggleBtn.textContent = popup.classList.contains('collapsed') ? '+' : '−';
        });
      }
      var dragStart = { x: 0, y: 0, left: 0, top: 0 };
      dragHandle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        dragStart.left = popup.offsetLeft;
        dragStart.top = popup.offsetTop;
        function onMove(ev) {
          var dx = ev.clientX - dragStart.x, dy = ev.clientY - dragStart.y;
          popup.style.left = (dragStart.left + dx) + 'px';
          popup.style.top = (dragStart.top + dy) + 'px';
        }
        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
      if (resizeHandle) {
        var resizeStart = { x: 0, y: 0, w: 0, h: 0 };
        resizeHandle.addEventListener('mousedown', function(e) {
          e.preventDefault();
          resizeStart.x = e.clientX;
          resizeStart.y = e.clientY;
          resizeStart.w = popup.offsetWidth;
          resizeStart.h = popup.offsetHeight;
          function onMove(ev) {
            var w = Math.max(200, resizeStart.w + (ev.clientX - resizeStart.x));
            var h = Math.max(80, resizeStart.h + (ev.clientY - resizeStart.y));
            popup.style.width = w + 'px';
            popup.style.height = h + 'px';
          }
            function onUp() {
              document.removeEventListener('mousemove', onMove);
              document.removeEventListener('mouseup', onUp);
            }
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      }
    })();

    checkHorizontalOverflow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
