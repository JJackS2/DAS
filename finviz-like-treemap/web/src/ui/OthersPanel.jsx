import React, { useMemo, useState } from "react";

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

export default function OthersPanel({ open, items, onClose, onPick }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((x) => (x.name ?? "").toLowerCase().includes(qq));
  }, [items, q]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", right: 12, top: 120, bottom: 12, width: 420,
      background: "#fff", border: "1px solid #ddd", borderRadius: 8,
      boxShadow: "0 6px 18px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 50
    }}>
      <div style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
        <b>Others breakdown</b>
        <span style={{ color: "#666", fontSize: 12 }}>({filtered.length} items)</span>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>

      <div style={{ padding: 10, borderBottom: "1px solid #eee" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name…"
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ overflow: "auto", height: "100%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ position: "sticky", top: 0, background: "#fafafa" }}>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Name</th>
              <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Sales</th>
              <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Attach</th>
              <th style={{ textAlign: "right", padding: 8, borderBottom: "1px solid #eee" }}>Connect</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x) => (
              <tr key={x.name} onClick={() => onPick(x.name)} style={{ cursor: "pointer" }}>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{x.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>
                  {fmtNumber(x.metrics?.sales)}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>
                  {fmtRate(x.metrics?.attach_rate)}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0", textAlign: "right" }}>
                  {fmtRate(x.metrics?.connect_rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
