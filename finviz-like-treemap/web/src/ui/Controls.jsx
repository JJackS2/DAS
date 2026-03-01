import React from "react";

const METRIC_LABELS = {
  sales: "Sales",
  wifi_sales: "WiFi Sales",
  connected: "Connected",
  attach_rate: "탑재율",
  connect_rate: "연결률"
};

export default function Controls({
  meta,
  state,
  onChangeDate,
  onChangeAxis,
  onChangeSize,
  onChangeColor,
  onChangeTopN,
  onBack
}) {
  const { availableDates, metrics, topNDefault } = meta;

  return (
    <div className="treemap-header treemap-preset-inline" style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>
      <div className="treemap-preset-btns" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "nowrap" }}>
        <div>
          Date:&nbsp;
          <select value={state.dateKey} onChange={(e) => onChangeDate(e.target.value)}>
            {availableDates.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div id="adv-rootmode-toggle">
          Axis:&nbsp;
          <button data-testid="axis-geo" className="treemap-axis-btn" onClick={() => onChangeAxis("geo")} disabled={state.axis === "geo"}>Geo</button>
          <button data-testid="axis-product" className="treemap-axis-btn" onClick={() => onChangeAxis("product")} disabled={state.axis === "product"} style={{ marginLeft: 6 }}>
            Product
          </button>
        </div>

        <div id="adv-size-metric-select" data-testid="size-metrics">
          Size:&nbsp;
          {metrics.map((m) => (
            <button
              key={m}
              className="treemap-axis-btn"
              onClick={() => onChangeSize(m)}
              style={{ marginRight: 6, fontWeight: state.sizeMetric === m ? 800 : 400 }}
            >
              {METRIC_LABELS[m] ?? m}
            </button>
          ))}
        </div>

        <div id="adv-color-metric-select" data-testid="color-metrics">
          Color:&nbsp;
          {metrics.map((m) => (
            <button
              key={m}
              className="treemap-axis-btn"
              onClick={() => onChangeColor(m)}
              style={{ marginRight: 6, fontWeight: state.colorMetric === m ? 800 : 400 }}
            >
              {METRIC_LABELS[m] ?? m}
            </button>
          ))}
        </div>

        <div>
          TopN:&nbsp;
          <select value={state.topN} onChange={(e) => onChangeTopN(Number(e.target.value))}>
            {[50, 100, 200].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div id="adv-preset-region-sales" style={{ visibility: "hidden", position: "absolute" }} aria-hidden="true">Preset</div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={onBack} disabled={state.path.length === 0}>Back</button>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color: "#444" }}>
        Breadcrumb: <b>Global</b>
        {state.path.map((p) => (
          <span key={p}> &gt; <b>{p}</b></span>
        ))}
        <span style={{ marginLeft: 10, color: "#777" }}>
          (Axis={state.axis}, TopN={state.topN ?? topNDefault})
        </span>
      </div>
    </div>
  );
}
