import React from "react";
import { fmtMetricValue } from "../treemap/buildTree.js";

/** 글로벌 기준 지역 타이틀 + 지역별 메트릭 크기 막대 (상단) */
export default function RegionBarStrip({ items, sizeMetric, colorMetric, onRegionClick }) {
  if (!items || items.length === 0) return null;

  const total = items.reduce((s, n) => s + (Number(n.value) || 0), 0);
  const max = Math.max(...items.map((n) => Number(n.value) || 0), 1);

  return (
    <div style={{
      marginBottom: 10,
      padding: "8px 12px",
      background: "#f8f9fa",
      borderRadius: 6,
      border: "1px solid #eee"
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 6 }}>
        Region
      </div>
      <div style={{
        display: "flex",
        alignItems: "stretch",
        gap: 4,
        height: 28,
        minHeight: 28
      }}>
        {items.map((node) => {
          const val = Math.max(0, Number(node.value) || 0);
          const pct = total > 0 ? (val / total) * 100 : 0;
          const flex = total > 0 ? val / max : 0;
          const label = node.name ?? "";
          const sub = fmtMetricValue(sizeMetric, val);
          return (
            <div
              key={label}
              role="button"
              tabIndex={0}
              onClick={() => onRegionClick && onRegionClick(node)}
              onKeyDown={(e) => e.key === "Enter" && onRegionClick && onRegionClick(node)}
              title={label + " " + sub}
              style={{
                flex: flex || 0.001,
                minWidth: 2,
                backgroundColor: "#1565c0",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor: onRegionClick ? "pointer" : "default",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600
              }}
            >
              {pct >= 8 ? label : ""}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", marginTop: 6, fontSize: 11, color: "#555" }}>
        {items.map((node) => {
          const val = Math.max(0, Number(node.value) || 0);
          const label = node.name ?? "";
          const sub = fmtMetricValue(sizeMetric, val);
          return (
            <span key={label}>
              <strong>{label}</strong> {sub}
            </span>
          );
        })}
      </div>
    </div>
  );
}
