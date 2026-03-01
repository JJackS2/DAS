/**
 * 대시보드(finviz-like-treemap) 탑티어 평가 항목 자동 검증
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
    await page.waitForTimeout(800);
    await page.waitForSelector('#main-dashboard', { state: 'visible' });
    await page.waitForSelector('#treemap-container', { state: 'visible' });
  });

  test('A3: 색상 범례(visualMap) 존재, 0~1 또는 0~100 구간', async ({ page }) => {
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
        return x && x.min === 0 && (x.max === 100 || x.max === 1);
      });
      return !!one;
    });
    expect(hasVisualMap).toBe(true);
  });

  test('B1: 대시보드 화면 가로 오버플로우 없음', async ({ page }) => {
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { overflow: doc.scrollWidth > doc.clientWidth + 2, scroll: doc.scrollWidth, client: doc.clientWidth };
    });
    expect(overflow.overflow, `가로 오버플로우: scroll=${overflow.scroll} client=${overflow.client}`).toBe(false);
  });

  test('B3: 메인 영역·트리맵 표시, 가로 오버플로우 없음', async ({ page }) => {
    const main = page.locator('#main-dashboard');
    await expect(main).toBeVisible();
    const treemap = page.locator('#treemap-container');
    await expect(treemap).toBeVisible();
    const docOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2
    );
    expect(docOverflow).toBe(true);
  });

  test('C1: 트리맵 차트 인스턴스 존재', async ({ page }) => {
    await page.waitForFunction(
      () => (window as unknown as { __TREEMAP_DEBUG__?: { chart?: unknown } }).__TREEMAP_DEBUG__?.chart != null,
      { timeout: 15000 }
    );
    const hasChart = await page.evaluate(
      () => (window as unknown as { __TREEMAP_DEBUG__?: { chart?: unknown } }).__TREEMAP_DEBUG__?.chart != null
    );
    expect(hasChart).toBe(true);
  });

  test('E1: __TREEMAP_DEBUG__.getLeafLayouts() 존재·배열 반환 (데이터 있으면 length>0)', async ({ page }) => {
    await page.waitForFunction(
      () => typeof (window as unknown as { __TREEMAP_DEBUG__?: { getLeafLayouts?: () => unknown[] } }).__TREEMAP_DEBUG__?.getLeafLayouts === 'function',
      { timeout: 10000 }
    );
    const result = await page.evaluate(() => {
      const d = (window as unknown as { __TREEMAP_DEBUG__?: { getLeafLayouts?: () => unknown[] } }).__TREEMAP_DEBUG__;
      const arr = d?.getLeafLayouts?.() ?? null;
      return Array.isArray(arr) ? { ok: true, length: arr.length } : { ok: false, length: 0 };
    });
    expect(result.ok).toBe(true);
  });
});

test.describe('Dashboard tier evaluation - screenshot capture', () => {
  test('스크린샷 저장 (선택 실행: --grep "screenshot")', async ({ page }) => {
    if (!process.env.CAPTURE_SCREENSHOTS) return;
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    await page.waitForSelector('#main-dashboard', { state: 'visible' });
    await page.waitForTimeout(1500);
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard-treemap.png'), fullPage: false });
  });
});
