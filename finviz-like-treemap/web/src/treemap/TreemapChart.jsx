import React, { useMemo, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { buildTreemapChildren, isRateMetric, fmtMetricValue } from "./buildTree.js";
import RegionBarStrip from "../ui/RegionBarStrip.jsx";

function getLeafLayoutsFromChart(chart) {
  if (!chart || typeof chart.getModel !== "function") return [];
  try {
    const model = chart.getModel();
    const seriesModel =
      (typeof model.getSeriesByIndex === "function" ? model.getSeriesByIndex(0) : null) ||
      (typeof model.getSeries === "function" ? model.getSeries()[0] : null);
    if (!seriesModel || typeof seriesModel.getData !== "function") return [];

    const data = seriesModel.getData();
    const out = [];
    data.each(function (idx) {
      const layout = data.getItemLayout(idx);
      if (layout && (layout.width != null || layout.w != null))
        out.push({
          x: layout.x ?? 0,
          y: layout.y ?? 0,
          w: layout.width ?? layout.w ?? 0,
          h: layout.height ?? layout.h ?? 0
        });
    });
    return out;
  } catch (_) {
    return [];
  }
}

function clamp01(x) {
  if (x == null || Number.isNaN(x)) return null;
  return Math.max(0, Math.min(1, x));
}

function flattenNodes(nodes) {
  const out = [];
  for (const n of nodes || []) {
    out.push(n);
    if (n.children && n.children.length) out.push(...flattenNodes(n.children));
  }
  return out;
}

/** Volume 메트릭일 때 min/max 계산 */
function getVolumeRange(allNodes) {
  let min = Infinity;
  let max = -Infinity;
  for (const c of allNodes) {
    const v = c.colorValue;
    if (v == null || Number.isNaN(v)) continue;
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    min = 0;
    max = 1;
  }
  return { min, max };
}

function buildVisualMap(allNodes, colorMetric, volumeRange) {
  const isRate = isRateMetric(colorMetric);

  if (isRate) {
    return {
      type: "continuous",
      min: 0,
      max: 1,
      calculable: true,
      formatter: (v) => {
        if (v == null || Number.isNaN(v)) return "NA";
        return (Number(v) * 100).toFixed(1) + "%";
      },
      inRange: {
        color: ["#b71c1c", "#f5f5f5", "#1b5e20"]
      }
    };
  }

  const { min, max } = volumeRange;
  return {
    type: "continuous",
    min: 0,
    max: 1,
    calculable: true,
    formatter: (v) => {
      if (v == null || Number.isNaN(v)) return "NA";
      const real = min + Number(v) * (max - min);
      return fmtMetricValue(colorMetric, real);
    },
    inRange: {
      color: ["#e3f2fd", "#1565c0"]
    }
  };
}

function toEchartsNode(node, colorMetric, isRate, volumeRange) {
  const raw = node.colorValue;
  const isNA = raw == null || Number.isNaN(raw);
  let colorVal;
  if (isRate) {
    colorVal = clamp01(raw);
  } else {
    const { min, max } = volumeRange;
    colorVal = isNA ? null : (max > min ? (raw - min) / (max - min) : 0);
  }

  const base = {
    name: node.name ?? "",
    value: Math.max(0, Number(node.value) || 0),
    colorValue: colorVal,
    tooltipHtml: node.tooltipHtml ?? "",
    displayLabel: node.displayLabel ?? node.name ?? "",
    pathToNode: node.pathToNode || [],
    isDrillable: !!node.isDrillable
  };
  if (isNA) base.itemStyle = { opacity: 0.22 };
  if (node.children && node.children.length) {
    base.children = node.children.map((c) => toEchartsNode(c, colorMetric, isRate, volumeRange));
  }
  return base;
}

export default function TreemapChart({ rows, state, onChartEvent }) {
  const chartRef = useRef(null);
  const leafLayoutsCacheRef = useRef([]);

  const { treeData, isLeaf, othersItems } = useMemo(
    () => buildTreemapChildren(rows, state),
    [rows, state]
  );

  const isRate = isRateMetric(state.colorMetric);
  const allNodes = useMemo(() => flattenNodes(treeData), [treeData]);
  const volumeRange = useMemo(() => getVolumeRange(allNodes), [allNodes]);
  const visualMap = useMemo(
    () => buildVisualMap(allNodes, state.colorMetric, volumeRange),
    [allNodes, state.colorMetric, volumeRange]
  );

  const showRegionBar = state.path.length === 0 && treeData.length > 0;

  useEffect(() => {
    const t = setTimeout(() => {
      const chart = chartRef.current?.getEchartsInstance?.();
      if (chart) chart.resize();
    }, 150);
    return () => clearTimeout(t);
  }, [state.path, state.axis, treeData.length]);

  const option = useMemo(() => {
    const data = treeData.map((c) => toEchartsNode(c, state.colorMetric, isRate, volumeRange));

    return {
      tooltip: {
        formatter: (info) => {
          const d = info?.data;
          if (!d) return "";
          return "<b>" + (d.name || "") + "</b><br/>" + (d.tooltipHtml || "");
        }
      },
      visualMap,
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            overflow: "break",
            formatter: (p) => {
              const d = p?.data;
              if (!d) return "";
              const name = (d.name ?? "").trim();
              const full = (d.displayLabel != null ? String(d.displayLabel) : name).trim();
              if (!full) return name || "—";
              if (full === name) return name;
              const rest = full.startsWith(name) ? full.slice(name.length).trim() : full;
              return rest ? name + "\n" + rest : full;
            }
          },
          itemStyle: { gapWidth: 2 },
          data,
          squareRatio: 1,
          leafDepth: 2,
          levels: [
            {
              itemStyle: { borderWidth: 2, borderColor: "rgba(0,0,0,0.2)" },
              upperLabel: {
                show: true,
                height: 36,
                fontSize: 14,
                fontWeight: "bold",
                color: "#0f172a",
                backgroundColor: "#cbd5e1",
                padding: [6, 10],
                overflow: "truncate",
                formatter: (p) => {
                  const name = (p?.data?.displayLabel ?? p?.data?.name ?? "").trim();
                  return name || "(No name)";
                }
              },
              label: { show: false }
            },
            {
              upperLabel: { show: false },
              label: {
                show: true,
                overflow: "break",
                formatter: (p) => {
                  const d = p?.data;
                  if (!d) return "";
                  const name = (d.name ?? "").trim();
                  const full = (d.displayLabel != null ? String(d.displayLabel) : name).trim();
                  if (!full) return name || "—";
                  if (full === name) return name;
                  const rest = full.startsWith(name) ? full.slice(name.length).trim() : full;
                  return rest ? name + "\n" + rest : full;
                }
              }
            }
          ]
        }
      ]
    };
  }, [treeData, state.colorMetric, isRate, visualMap, volumeRange, showRegionBar]);

  const onEvents = useMemo(() => {
    return {
      click: (params) => {
        const d = params?.data;
        const name = d?.name;
        if (name == null || name === "") return;

        if (name === "Others") {
          onChartEvent({ type: "others", othersItems });
          return;
        }

        const pathToNode = d.pathToNode;
        const isDrillable = d.isDrillable;
        if (!isDrillable) return;
        if (pathToNode && pathToNode.length) {
          onChartEvent({ type: "node", name, path: pathToNode });
        } else {
          onChartEvent({ type: "node", name });
        }
      }
    };
  }, [isLeaf, othersItems, onChartEvent]);

  const onRegionBarClick = useMemo(() => {
    if (!showRegionBar) return undefined;
    return (node) => {
      if (node.pathToNode && node.pathToNode.length) {
        onChartEvent({ type: "node", name: node.name, path: node.pathToNode });
      }
    };
  }, [showRegionBar, onChartEvent]);

  return (
    <div style={{ height: "78vh", width: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {showRegionBar && (
        <RegionBarStrip
          items={treeData}
          sizeMetric={state.sizeMetric}
          colorMetric={state.colorMetric}
          onRegionClick={onRegionBarClick}
        />
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReactECharts
          ref={chartRef}
          option={option}
          opts={{ notMerge: true }}
          onEvents={onEvents}
          onChartReady={(chart) => {
            if (typeof window !== "undefined") {
              window.__TREEMAP_DEBUG__ = window.__TREEMAP_DEBUG__ || {};
              window.__TREEMAP_DEBUG__.chart = chart;

              const updateCache = () => {
                const layouts = getLeafLayoutsFromChart(chart);
                leafLayoutsCacheRef.current = layouts;
                window.__TREEMAP_DEBUG__.leafLayoutsCache = layouts;
              };

              // 초기 1회 및 이후 렌더 완료 시마다 캐시 업데이트
              updateCache();
              chart.off?.("finished", updateCache);
              chart.on?.("finished", updateCache);

              // 테스트는 캐시만 조회(무거운 재계산 방지)
              window.__TREEMAP_DEBUG__.getLeafLayouts = () => leafLayoutsCacheRef.current || [];
            }
          }}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
