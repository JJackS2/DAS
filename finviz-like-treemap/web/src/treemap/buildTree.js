function fmtNumber(n) {
  if (n == null || Number.isNaN(n)) return "NA";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
function fmtRate(r) {
  if (r == null || Number.isNaN(r)) return "NA";
  return (r * 100).toFixed(1) + "%";
}

export function isRateMetric(metric) {
  return metric === "attach_rate" || metric === "connect_rate";
}

export function fmtMetricValue(metric, value) {
  if (value == null || Number.isNaN(value)) return "NA";
  return isRateMetric(metric) ? fmtRate(value) : fmtNumber(value);
}

function aggInit() {
  return {
    sales: 0,
    wifi_sales: 0,
    connected: 0,
    attach_rate: null,
    connect_rate: null,
    count: 0
  };
}

function recomputeRates(agg) {
  agg.attach_rate = agg.sales > 0 ? agg.wifi_sales / agg.sales : null;
  agg.connect_rate = agg.wifi_sales > 0 ? agg.connected / agg.wifi_sales : null;
  return agg;
}

function keysForAxis(axis) {
  if (axis === "product") {
    return ["division", "product_l2", "product_l3", "region", "subsidiary"];
  }
  return ["region", "subsidiary", "division", "product_l2", "product_l3"];
}

function getKeyAt(axis, depth) {
  const keys = keysForAxis(axis);
  return keys[depth] ?? null;
}

function rowMatchesPath(row, axis, path) {
  const keys = keysForAxis(axis);
  for (let i = 0; i < path.length; i++) {
    const k = keys[i];
    if (!k) return false;
    if (row[k] !== path[i]) return false;
  }
  return true;
}

export function computeGlobalTotals(rows) {
  const agg = aggInit();
  for (const r of rows) {
    agg.sales += r.sales ?? 0;
    agg.wifi_sales += r.wifi_sales ?? 0;
    agg.connected += r.connected ?? 0;
    agg.count++;
  }
  return recomputeRates(agg);
}

function tooltipLines(node) {
  const m = node.metrics || {};
  return [
    "Sales: " + fmtNumber(m.sales),
    "WiFi Sales: " + fmtNumber(m.wifi_sales),
    "Connected: " + fmtNumber(m.connected),
    "탑재율: " + fmtRate(m.attach_rate),
    "연결률: " + fmtRate(m.connect_rate)
  ].join("<br/>");
}

/** 2레벨 트리 생성. 표시 박스는 레벨1+레벨2. 클릭 시 pathToNode로 한 레벨씩 드릴. */
export function buildTreemapChildren(rows, state) {
  const { axis, path, sizeMetric, colorMetric, topN } = state;
  const keys = keysForAxis(axis);
  const key0 = getKeyAt(axis, path.length);
  const key1 = getKeyAt(axis, path.length + 1);
  const key2 = getKeyAt(axis, path.length + 2);

  if (!key0) {
    return { treeData: [], isLeaf: true, othersItems: [] };
  }

  const filtered = rows.filter((r) => rowMatchesPath(r, axis, path));

  const map0 = new Map();
  for (const r of filtered) {
    const g = r[key0];
    if (g == null || g === "") continue;
    if (!map0.has(g)) map0.set(g, aggInit());
    const agg = map0.get(g);
    agg.sales += r.sales ?? 0;
    agg.wifi_sales += r.wifi_sales ?? 0;
    agg.connected += r.connected ?? 0;
    agg.count++;
  }

  const items0 = [];
  for (const [name0, agg0] of map0.entries()) {
    recomputeRates(agg0);
    const pathToNode0 = path.concat(name0);
    const isDrillable0 = key1 != null;

    let children = [];
    if (key1) {
      const map1 = new Map();
      for (const r of filtered) {
        if (r[key0] !== name0) continue;
        const g = r[key1];
        if (g == null || g === "") continue;
        if (!map1.has(g)) map1.set(g, aggInit());
        const agg = map1.get(g);
        agg.sales += r.sales ?? 0;
        agg.wifi_sales += r.wifi_sales ?? 0;
        agg.connected += r.connected ?? 0;
        agg.count++;
      }
      for (const [name1, agg1] of map1.entries()) {
        recomputeRates(agg1);
        const pathToNode1 = pathToNode0.concat(name1);
        const displayVal = fmtMetricValue(colorMetric, agg1[colorMetric]);
        children.push({
          name: String(name1),
          value: Math.max(0, agg1[sizeMetric] ?? 0),
          metrics: { ...agg1 },
          colorValue: agg1[colorMetric] != null && !Number.isNaN(agg1[colorMetric]) ? agg1[colorMetric] : null,
          tooltipHtml: tooltipLines({ metrics: agg1 }),
          displayLabel: String(name1) + " " + displayVal,
          pathToNode: pathToNode1,
          isDrillable: key2 != null
        });
      }
      children.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    }

    const displayVal0 = fmtMetricValue(colorMetric, agg0[colorMetric]);
    items0.push({
      name: String(name0),
      value: Math.max(0, agg0[sizeMetric] ?? 0),
      metrics: { ...agg0 },
      colorValue: agg0[colorMetric] != null && !Number.isNaN(agg0[colorMetric]) ? agg0[colorMetric] : null,
      tooltipHtml: tooltipLines({ metrics: agg0 }),
      displayLabel: String(name0) + " " + displayVal0,
      pathToNode: pathToNode0,
      isDrillable: isDrillable0,
      children
    });
  }

  items0.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  let final0 = items0;
  let othersItems = [];

  if (items0.length > topN) {
    const head = items0.slice(0, topN);
    const tail = items0.slice(topN);
    const o = aggInit();
    for (const t of tail) {
      o.sales += t.metrics.sales ?? 0;
      o.wifi_sales += t.metrics.wifi_sales ?? 0;
      o.connected += t.metrics.connected ?? 0;
      o.count += t.metrics.count ?? 0;
    }
    recomputeRates(o);
    const displayValO = fmtMetricValue(colorMetric, o[colorMetric]);
    othersItems = tail.flatMap((t) => (t.children || []).map((c) => ({ ...c })));
    final0 = [
      ...head,
      {
        name: "Others",
        value: Math.max(0, o[sizeMetric] ?? 0),
        metrics: { ...o },
        colorValue: o[colorMetric] != null && !Number.isNaN(o[colorMetric]) ? o[colorMetric] : null,
        tooltipHtml: tooltipLines({ metrics: o }),
        displayLabel: "Others " + displayValO,
        pathToNode: path.concat("Others"),
        isDrillable: false,
        children: []
      }
    ];
  }

  const treeData = final0.map((n) => ({
    ...n,
    tooltipHtml: n.tooltipHtml ?? "",
    displayLabel: n.displayLabel ?? n.name ?? ""
  }));

  return {
    treeData,
    isLeaf: key1 == null,
    othersItems
  };
}
