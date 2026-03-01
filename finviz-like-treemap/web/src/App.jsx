import React, { useEffect, useMemo, useState } from "react";
import { fetchData } from "./api.js";
import TreemapChart from "./treemap/TreemapChart.jsx";
import { computeGlobalTotals } from "./treemap/buildTree.js";
import HeaderBar from "./ui/HeaderBar.jsx";
import Controls from "./ui/Controls.jsx";
import OthersPanel from "./ui/OthersPanel.jsx";

export default function App() {
  const [meta, setMeta] = useState({ availableDates: [], metrics: [], topNDefault: 50 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [state, setState] = useState({
    dateKey: "",
    axis: "geo",
    path: [],
    sizeMetric: "sales",
    colorMetric: "connect_rate",
    topN: 50
  });

  const [othersOpen, setOthersOpen] = useState(false);
  const [othersItems, setOthersItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchData(state.dateKey || undefined);
        if (cancelled) return;

        setMeta(res.meta);
        setRows(res.rows);

        setState((s) => ({
          ...s,
          dateKey: res.dateKey,
          sizeMetric: res.meta.defaultSize ?? s.sizeMetric,
          colorMetric: res.meta.defaultColor ?? s.colorMetric,
          topN: res.meta.topNDefault ?? s.topN
        }));
      } catch (e) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [state.dateKey]);

  const globalTotals = useMemo(() => computeGlobalTotals(rows), [rows]);

  function onChartEvent(evt) {
    if (evt?.type === "others") {
      setOthersItems(evt.othersItems ?? []);
      setOthersOpen(true);
      return;
    }
    if (evt?.type === "node") {
      setOthersOpen(false);
      setState((s) => ({
        ...s,
        path: Array.isArray(evt.path) ? evt.path : [...s.path, evt.name].filter(Boolean)
      }));
    }
  }

  function handleBack() {
    setOthersOpen(false);
    setState((s) => ({ ...s, path: s.path.slice(0, -1) }));
  }

  function changeAxis(axis) {
    setOthersOpen(false);
    setState((s) => ({ ...s, axis, path: [] }));
  }

  if (loading) return <div style={{ padding: 14 }}>Loading...</div>;
  if (error) return <div style={{ padding: 14, color: "crimson" }}>Error: {error}</div>;

  return (
    <div id="main-dashboard" data-testid="dashboard" style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <HeaderBar globalTotals={globalTotals} />
      <Controls
        meta={meta}
        state={state}
        onChangeDate={(d) => {
          setOthersOpen(false);
          setState((s) => ({ ...s, dateKey: d, path: [] }));
        }}
        onChangeAxis={changeAxis}
        onChangeSize={(m) => setState((s) => ({ ...s, sizeMetric: m }))}
        onChangeColor={(m) => setState((s) => ({ ...s, colorMetric: m }))}
        onChangeTopN={(n) => setState((s) => ({ ...s, topN: n }))}
        onBack={handleBack}
      />

      <div id="treemap-container" data-testid="treemap-container" style={{ padding: 12 }}>
        <TreemapChart rows={rows} state={state} onChartEvent={onChartEvent} />
      </div>

      <OthersPanel
        open={othersOpen}
        items={othersItems}
        onClose={() => setOthersOpen(false)}
        onPick={(name) => {
          setOthersOpen(false);
          setState((s) => ({ ...s, path: [...s.path, name].filter(Boolean) }));
        }}
      />
    </div>
  );
}
