import React from "react";

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

export default function HeaderBar({ globalTotals }) {
  return (
    <div className="treemap-header" style={{ padding: "10px 12px", borderBottom: "1px solid #ddd" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <div className="treemap-header-title" style={{ fontWeight: 800, fontSize: 18 }}>GLOBAL</div>
        <div>Sales: <b>{fmtNumber(globalTotals.sales)}</b></div>
        <div>WiFi Sales: <b>{fmtNumber(globalTotals.wifi_sales)}</b></div>
        <div>Connected: <b>{fmtNumber(globalTotals.connected)}</b></div>
        <div>탑재율: <b>{fmtRate(globalTotals.attach_rate)}</b></div>
        <div>연결률: <b>{fmtRate(globalTotals.connect_rate)}</b></div>
      </div>
    </div>
  );
}
