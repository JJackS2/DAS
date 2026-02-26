/**
 * Advanced Treemap v4 — 품질 리포트 JSON/MD 산출
 */

import * as fs from 'fs';
import * as path from 'path';
import type { QualityMetrics } from './quality_metrics';
import { getFailReason, getRecommendedAction } from './quality_metrics';

export interface CaseResult {
  rootMode: string;
  sizeMetric: string;
  colorMetric: string;
  acceptance: string;
  metrics: QualityMetrics;
  fail_reason?: string;
  recommended_action?: string;
  final_option_signature?: {
    leafDepth: number;
    visibleMin: number;
    childrenVisibleMin: number;
    areaScale: string;
    topN?: number;
    leafCap?: number;
  };
}

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const TREEMAP_REPORTS_DIR = path.join(REPORTS_DIR, 'treemap');

export function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  if (!fs.existsSync(TREEMAP_REPORTS_DIR)) fs.mkdirSync(TREEMAP_REPORTS_DIR, { recursive: true });
}

export function writeQualityReportJson(results: CaseResult[]): string {
  ensureReportsDir();
  const outPath = path.join(TREEMAP_REPORTS_DIR, 'treemap_quality_report.json');
  const payload = {
    generatedAt: new Date().toISOString(),
    totalCases: results.length,
    results,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  return outPath;
}

export function writeQualityReportMd(results: CaseResult[]): string {
  ensureReportsDir();
  const outPath = path.join(TREEMAP_REPORTS_DIR, 'treemap_quality_report.md');
  const lines: string[] = [
    '# Treemap Quality Report',
    '',
    'Generated: ' + new Date().toISOString(),
    '',
    '| rootMode | sizeMetric | colorMetric | acceptance | AR P95 | MIN P50 | TINY% | fail_reason | recommended_action |',
    '|----------|------------|-------------|------------|--------|---------|-------|-------------|---------------------|',
  ];
  for (const r of results) {
    const reason = r.fail_reason ?? getFailReason(r.metrics) ?? '—';
    const action = r.recommended_action ?? getRecommendedAction(r.fail_reason as any) ?? '—';
    lines.push(
      [
        r.rootMode,
        r.sizeMetric,
        r.colorMetric,
        r.acceptance,
        r.metrics.arP95.toFixed(1),
        r.metrics.minP50.toFixed(0),
        r.metrics.tinyPct.toFixed(1),
        reason,
        action,
      ].join(' | ')
    );
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  return outPath;
}
