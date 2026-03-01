/**
 * 대시보드(finviz-like-treemap) — 헤더/컨트롤 레이아웃 테스트
 * 제목과 버튼이 주어진 공간을 넘지 않고, 배치·폰트 크기가 적절한지 검증
 */

import { test, expect } from '@playwright/test';

const baseURL = process.env.TREEMAP_BASE_URL || 'http://127.0.0.1:3000';

test.describe('Treemap header layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    await page.waitForSelector('#main-dashboard', { state: 'visible' });
    await page.waitForSelector('.treemap-header', { state: 'visible' });
  });

  test('헤더가 주어진 공간 내에서 가로 오버플로우 없음', async ({ page }) => {
    const header = page.locator('#main-dashboard .treemap-header').first();
    await expect(header).toBeVisible();
    const overflow = await page.evaluate(() => {
      const el = document.querySelector('#main-dashboard .treemap-header');
      if (!el) return { overflow: true, scrollWidth: 0, clientWidth: 0 };
      return {
        overflow: el.scrollWidth > el.clientWidth + 2,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      };
    });
    expect(overflow.overflow, `헤더 가로 오버플로우: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`).toBe(false);
  });

  test('제목과 버튼이 보이고 폰트 크기가 9px 이상', async ({ page }) => {
    const title = page.locator('#main-dashboard .treemap-header-title');
    await expect(title).toBeVisible();
    const titleFontSize = await title.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return parseFloat(s.fontSize) || 0;
    });
    expect(titleFontSize).toBeGreaterThanOrEqual(9);

    const firstBtn = page.locator('#main-dashboard .treemap-axis-btn').first();
    await expect(firstBtn).toBeVisible();
    const btnFontSize = await firstBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return parseFloat(s.fontSize) || 0;
    });
    expect(btnFontSize).toBeGreaterThanOrEqual(9);
  });

  test('Axis·Size·Color·Preset 컨트롤이 모두 존재', async ({ page }) => {
    await expect(page.locator('#adv-rootmode-toggle')).toBeVisible();
    await expect(page.locator('#adv-size-metric-select')).toBeVisible();
    await expect(page.locator('#adv-color-metric-select')).toBeVisible();
    await expect(page.locator('#adv-preset-region-sales')).toBeAttached();
  });

  test('Preset 버튼 그룹이 한 줄로 유지되어 배열이 깨지지 않음', async ({ page }) => {
    const presetBtns = page.locator('#main-dashboard .treemap-preset-inline .treemap-preset-btns');
    await expect(presetBtns).toBeVisible();
    const wrap = await presetBtns.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { flexWrap: s.flexWrap, display: s.display };
    });
    expect(wrap.flexWrap).toBe('nowrap');
    const btnCount = await page.locator('#main-dashboard .treemap-preset-inline .treemap-axis-btn').count();
    expect(btnCount).toBeGreaterThanOrEqual(2);
  });
});
