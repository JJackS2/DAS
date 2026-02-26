/**
 * 탑티어 대시보드 평가 항목 자동 검증
 * docs/dashboard_tier_evaluation.md 기준
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const baseURL = process.env.TREEMAP_BASE_URL || 'http://127.0.0.1:3000';
const screenshotsDir = path.join(process.cwd(), 'reports', 'screenshots');

test.describe('Dashboard tier evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    const guideSkip = page.locator('#guide-skip');
    if (await guideSkip.isVisible().catch(() => false)) await guideSkip.click();
    await page.click('a[href="#"]:has-text("Advanced")');
    await page.waitForSelector('#main-advanced', { state: 'visible' });
    await page.waitForSelector('#advanced-treemap-container', { state: 'visible' });
  });

  test('A3: 색상 범례가 1개만 존재하고 0~100 구간 표시 (ECharts visualMap)', async ({ page }) => {
    await page.waitForFunction(
      () => (window as unknown as { __TREEMAP_DEBUG__?: { chart?: unknown } }).__TREEMAP_DEBUG__?.chart != null,
      { timeout: 15000 }
    );
    const hasVisualMap = await page.evaluate(() => {
      const w = window as unknown as { __TREEMAP_DEBUG__?: { chart?: { getOption?: () => { visualMap?: unknown } } } };
      const opt = w.__TREEMAP_DEBUG__?.chart?.getOption?.();
      const vm = opt?.visualMap;
      const arr = Array.isArray(vm) ? vm : (vm != null ? [vm] : []);
      const one = arr.find((m: unknown) => {
        const x = m as { min?: number; max?: number };
        return x && x.min === 0 && x.max === 100;
      });
      return !!one;
    });
    expect(hasVisualMap).toBe(true);
    const htmlLegendVisible = await page.locator('#treemap-legend.treemap-legend-mini').isVisible();
    expect(htmlLegendVisible).toBe(false);
  });

  test('B1: Advanced 화면 가로 오버플로우 없음', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { overflow: doc.scrollWidth > doc.clientWidth + 2, scroll: doc.scrollWidth, client: doc.clientWidth };
    });
    expect(overflow.overflow, `가로 오버플로우: scroll=${overflow.scroll} client=${overflow.client}`).toBe(false);
  });

  test('B3: Advanced에서 우측 패널 360px 표시, 트리맵은 메인 영역에 있음(overflow 0)', async ({ page }) => {
    const layout = await page.evaluate(() => {
      const app = document.getElementById('app');
      const right = document.getElementById('right-column');
      const main = document.getElementById('main-advanced');
      const style = right ? window.getComputedStyle(right) : null;
      const isAdvanced = app?.classList.contains('view-advanced') === true;
      const rightVisible = right && style?.display !== 'none' && right.offsetParent !== null;
      const rightWidth = right ? parseFloat(style?.width || '0') : 0;
      const mainVisible = main && main.offsetParent !== null;
      const docOverflow = document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;
      return { isAdvanced, rightVisible, rightWidth, mainVisible, docOverflow };
    });
    expect(layout.isAdvanced).toBe(true);
    expect(layout.rightVisible).toBe(true);
    expect(layout.rightWidth).toBe(360);
    expect(layout.mainVisible).toBe(true);
    expect(layout.docOverflow).toBe(true);
  });

  test('C1: 휠 스크롤(roam) 옵션 적용 확인', async ({ page }) => {
    await page.waitForFunction(
      () => {
        const w = window as unknown as { __TREEMAP_DEBUG__?: { chart?: unknown } };
        return w.__TREEMAP_DEBUG__?.chart != null;
      },
      { timeout: 15000 }
    );
    const hasRoam = await page.evaluate(() => {
      const debug = (window as unknown as Record<string, unknown>).__TREEMAP_DEBUG__ as Record<string, unknown> | undefined;
      const chart = debug?.chart as { getOption?: () => { series?: { roam?: boolean }[] } } | undefined;
      const opt = chart?.getOption?.();
      const series = opt?.series?.[0];
      return series?.roam === true;
    });
    expect(hasRoam).toBe(true);
  });

  test('D2: 좌측 서술형 설명이 문장으로 표시됨', async ({ page }) => {
    await page.waitForFunction(
      () => (window as unknown as { __TREEMAP_DEBUG__?: { getLeafLayouts?: () => unknown[] } }).__TREEMAP_DEBUG__?.getLeafLayouts?.()?.length > 0,
      { timeout: 15000 }
    ).catch(() => {});
    await page.waitForTimeout(300);
    const descEl = page.locator('#left-treemap-desc');
    await expect(descEl).toBeVisible();
    const desc = await descEl.textContent();
    expect(desc?.trim().length ?? 0).toBeGreaterThan(20);
  });

  test('E1: 품질 배지가 표시됨', async ({ page }) => {
    await page.waitForFunction(
      () => (window as unknown as { __TREEMAP_DEBUG__?: { getLeafLayouts?: () => unknown[] } }).__TREEMAP_DEBUG__?.getLeafLayouts?.()?.length > 0,
      { timeout: 15000 }
    );
    const badge = page.locator('#adv-quality-badge');
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/GOAL|SOFT|HARD|FAIL/);
  });
});

test.describe('Dashboard tier evaluation - screenshot capture', () => {
  test('스크린샷 저장 (선택 실행: --grep "screenshot")', async ({ page }) => {
    if (!process.env.CAPTURE_SCREENSHOTS) return;
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    const guideSkip = page.locator('#guide-skip');
    if (await guideSkip.isVisible().catch(() => false)) await guideSkip.click();
    await page.click('a[href="#"]:has-text("Advanced")');
    await page.waitForSelector('#main-advanced', { state: 'visible' });
    await page.waitForTimeout(1500);
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotsDir, 'advanced-treemap.png'), fullPage: false });
  });
});
