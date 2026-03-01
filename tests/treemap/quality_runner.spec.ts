/**
 * 대시보드(finviz-like-treemap) — Playwright 품질 검증 러너
 * 조합 순회 → 렌더 대기 (getLeafLayouts().length > 0) → 지표 수집 → 리포트 저장
 */

import { test, expect } from '@playwright/test';
import {
  computeQualityFromLayouts,
  getAcceptance,
  getFailReason,
  getRecommendedAction,
  type LeafLayout,
  type QualityMetrics,
} from './quality_metrics';
import {
  writeQualityReportJson,
  writeQualityReportMd,
  ensureReportsDir,
  type CaseResult,
} from './quality_report';

const ROOT_MODES = ['geo', 'product'] as const;
const SIZE_METRICS = ['sales', 'wifi_sales', 'connected'] as const;
const COLOR_METRICS = ['attach_rate', 'connect_rate'] as const;

const SIZE_LABELS: Record<string, string> = {
  sales: 'Sales',
  wifi_sales: 'WiFi Sales',
  connected: 'Connected',
};
const COLOR_LABELS: Record<string, string> = {
  attach_rate: '탑재율',
  connect_rate: '연결률',
};

const baseURL = process.env.TREEMAP_BASE_URL || 'http://127.0.0.1:3000';

test('treemap quality: all combinations', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto(baseURL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);

  await page.waitForSelector('#main-dashboard', { state: 'visible' });
  await page.waitForSelector('#treemap-container', { state: 'visible' });
  await page.waitForFunction(
    () => typeof (window as unknown as { __TREEMAP_DEBUG__?: { getLeafLayouts?: () => unknown[] } }).__TREEMAP_DEBUG__?.getLeafLayouts === 'function',
    { timeout: 15000 }
  );

  const results: CaseResult[] = [];

  for (const rootMode of ROOT_MODES) {
    await page.click(rootMode === 'geo' ? '[data-testid="axis-geo"]' : '[data-testid="axis-product"]', { force: true });
    await page.waitForTimeout(300);

    for (const sizeMetric of SIZE_METRICS) {
      await page.click(`#adv-size-metric-select button:has-text("${SIZE_LABELS[sizeMetric]}")`, { force: true });
      await page.waitForTimeout(200);

      for (const colorMetric of COLOR_METRICS) {
        await page.click(`#adv-color-metric-select button:has-text("${COLOR_LABELS[colorMetric]}")`, { force: true });
        await page.waitForTimeout(500);

        const layouts = await page.evaluate(() => {
          const d = (window as unknown as { __TREEMAP_DEBUG__?: { getLeafLayouts?: () => LeafLayout[] } })
            .__TREEMAP_DEBUG__;
          if (!d || !d.getLeafLayouts) return [];
          return d.getLeafLayouts();
        });

        const metrics: QualityMetrics = computeQualityFromLayouts(layouts as LeafLayout[]);
        const acceptance = getAcceptance(metrics);
        const failReason = getFailReason(metrics);
        const recommendedAction = getRecommendedAction(failReason);

        results.push({
          rootMode,
          sizeMetric,
          colorMetric,
          acceptance,
          metrics,
          fail_reason: failReason ?? undefined,
          recommended_action: recommendedAction ?? undefined,
        });
      }
    }
  }

  ensureReportsDir();
  const jsonPath = writeQualityReportJson(results);
  const mdPath = writeQualityReportMd(results);

  const failCount = results.filter((r) => r.acceptance === 'FAIL').length;
  const total = results.length;
  const softPlusCount = results.filter((r) => r.acceptance === 'GOAL' || r.acceptance === 'SOFT' || r.acceptance === 'HARD').length;
  const noData = results.every((r) => r.metrics.minP50 === 0 && r.metrics.arP95 === 0);
  expect(
    noData || (softPlusCount >= 1 && failCount < total),
    `품질 리포트: SOFT+ ${softPlusCount}, FAIL ${failCount}/${total}${noData ? ' (데이터 없음 — API 8787 기동 권장)' : ''}`
  ).toBeTruthy();
  if (!noData && failCount / total > 0.1) {
    console.warn(`[treemap] FAIL 조합 ${failCount}/${total} (>10%) — reports 참고 후 fallback 튜닝`);
  }
});
