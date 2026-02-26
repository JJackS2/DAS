/**
 * Advanced Treemap v4 — Playwright 품질 검증 러너
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

const ROOT_MODES = ['region', 'product'] as const;
const SIZE_METRICS = ['sales_count', 'smart_sales_count', 'connected_count', 'device_count'] as const;
const COLOR_METRICS = ['installation_rate_pct', 'connection_rate_pct'] as const;

// 서버 미사용 시에만 file URL 사용 (TREEMAP_BASE_URL 지정 시)
const baseURL = process.env.TREEMAP_BASE_URL || 'http://127.0.0.1:3000';

test('treemap quality: all combinations', async ({ page }) => {
  await page.goto(baseURL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600); // 가이드가 setTimeout(400)으로 뜨므로 대기

  // 가이드 오버레이가 떠 있으면 먼저 닫기 (Advanced 전환 후 클릭 방해 방지)
  const guideSkip = page.locator('#guide-skip');
  if (await guideSkip.isVisible().catch(() => false)) {
    await guideSkip.click();
    await page.waitForTimeout(500);
  }
  await page.locator('#guide-overlay.show').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

  await page.click('a[href="#"]:has-text("Advanced")');
  await page.waitForSelector('#main-advanced', { state: 'visible' });
  await page.waitForSelector('#advanced-treemap-container', { state: 'visible' });

  // 설명 팝업이 헤더를 가리지 않도록 접어 둠 (76x76으로 축소)
  const descToggle = page.locator('#treemap-desc-toggle');
  if (await descToggle.isVisible().catch(() => false)) {
    await descToggle.click();
    await page.waitForTimeout(200);
  }

  const results: CaseResult[] = [];

  for (const rootMode of ROOT_MODES) {
    for (const sizeMetric of SIZE_METRICS) {
      for (const colorMetric of COLOR_METRICS) {
        if (rootMode === 'region') {
          await page.click('#adv-rootmode-region', { force: true });
        } else {
          await page.click('#adv-rootmode-product', { force: true });
        }
        await page.selectOption('#adv-size-metric-select', sizeMetric);
        await page.selectOption('#adv-color-metric-select', colorMetric);

        const ok = await page
          .waitForFunction(
            () => {
              const d = (window as unknown as { __TREEMAP_DEBUG__?: { getLeafLayouts?: () => { length: number } } })
                .__TREEMAP_DEBUG__;
              return d && typeof d.getLeafLayouts === 'function' && d.getLeafLayouts().length > 0;
            },
            { timeout: 15000 }
          )
          .then(() => true)
          .catch(() => false);

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
  expect(softPlusCount >= 1 && failCount < total, `품질 리포트 생성 실패: SOFT+ ${softPlusCount}, FAIL ${failCount}/${total}`).toBeTruthy();
  if (failCount / total > 0.1) {
    console.warn(`[v5] FAIL 조합 ${failCount}/${total} (>10%) — 목표: 10% 이하, reports 참고 후 fallback 튜닝`);
  }
});
