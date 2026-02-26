/**
 * Advanced Treemap v4 — 품질 지표 (AR, MIN, TINY) 및 acceptance 판정
 */

export interface LeafLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  dataIndex?: number;
}

export interface QualityMetrics {
  arP95: number;
  arMax: number;
  minP50: number;
  tinyPct: number;
}

export type Acceptance = 'GOAL' | 'SOFT' | 'HARD' | 'FAIL';

export function computeQualityFromLayouts(layouts: LeafLayout[]): QualityMetrics {
  if (!layouts.length) return { arP95: 0, arMax: 0, minP50: 0, tinyPct: 0 };
  const ars: number[] = [];
  const mins: number[] = [];
  for (let i = 0; i < layouts.length; i++) {
    const w = layouts[i].w || 0;
    const h = layouts[i].h || 0;
    if (w <= 0 || h <= 0) continue;
    ars.push(Math.max(w / h, h / w));
    mins.push(Math.min(w, h));
  }
  ars.sort((a, b) => a - b);
  mins.sort((a, b) => a - b);
  const p95Idx = Math.floor(ars.length * 0.95);
  const p50Idx = Math.floor(mins.length * 0.5);
  const arP95 = ars[p95Idx] ?? 0;
  const arMax = Math.max(...ars);
  const minP50 = mins[p50Idx] ?? 0;
  let tinyCount = 0;
  for (let j = 0; j < mins.length; j++) if (mins[j] < 10) tinyCount++;
  const tinyPct = layouts.length ? (tinyCount / layouts.length) * 100 : 0;
  return { arP95, arMax, minP50, tinyPct };
}

export function getAcceptance(metrics: QualityMetrics): Acceptance {
  if (metrics.arP95 <= 6 && metrics.arMax <= 12 && metrics.minP50 >= 18 && metrics.tinyPct <= 15) return 'GOAL';
  if (metrics.arP95 <= 8 && metrics.arMax <= 16 && metrics.minP50 >= 14 && metrics.tinyPct <= 25) return 'SOFT';
  if (metrics.arP95 <= 10 && metrics.arMax <= 20 && metrics.minP50 >= 12 && metrics.tinyPct <= 35) return 'HARD';
  return 'FAIL';
}

export type FailReason =
  | 'ASPECT_RATIO_TOO_HIGH'
  | 'TINY_TOO_MANY'
  | 'MIN_SIDE_TOO_LOW'
  | 'TOP_LIST_MISMATCH';

export type RecommendedAction =
  | 'INCREASE_GROUPING'
  | 'DECREASE_LEAF_DEPTH'
  | 'CONSIDER_D3_LAYOUT';

export function getFailReason(metrics: QualityMetrics): FailReason | null {
  if (metrics.arP95 > 10 || metrics.arMax > 20) return 'ASPECT_RATIO_TOO_HIGH';
  if (metrics.tinyPct > 35) return 'TINY_TOO_MANY';
  if (metrics.minP50 < 12) return 'MIN_SIDE_TOO_LOW';
  return null;
}

export function getRecommendedAction(reason: FailReason | null): RecommendedAction | null {
  if (reason === 'TINY_TOO_MANY' || reason === 'MIN_SIDE_TOO_LOW') return 'DECREASE_LEAF_DEPTH';
  if (reason === 'ASPECT_RATIO_TOO_HIGH') return 'INCREASE_GROUPING';
  if (reason) return 'CONSIDER_D3_LAYOUT';
  return null;
}
