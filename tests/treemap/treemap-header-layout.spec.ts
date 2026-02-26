/**
 * Advanced Treemap — 상단 Treemap 헤더/버튼 레이아웃 테스트
 * 제목과 버튼이 주어진 공간을 넘지 않고, 배치·버튼 크기·폰트 크기가 적절한지 검증
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';

const baseURL = process.env.TREEMAP_BASE_URL || 'http://127.0.0.1:3000';

test.describe('Treemap header layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    const guideSkip = page.locator('#guide-skip');
    if (await guideSkip.isVisible().catch(() => false)) await guideSkip.click();
    await page.click('a[href="#"]:has-text("Advanced")');
    await page.waitForSelector('#main-advanced', { state: 'visible' });
    await page.waitForSelector('.treemap-header', { state: 'visible' });
  });

  test('헤더가 주어진 공간 내에서 가로 오버플로우 없음', async ({ page }) => {
    const header = page.locator('#main-advanced .treemap-header').first();
    await expect(header).toBeVisible();
    const overflow = await page.evaluate(() => {
      const el = document.querySelector('#main-advanced .treemap-header');
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
    const title = page.locator('#main-advanced .treemap-header-title');
    await expect(title).toBeVisible();
    const titleFontSize = await title.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return parseFloat(s.fontSize) || 0;
    });
    expect(titleFontSize).toBeGreaterThanOrEqual(9);

    const firstBtn = page.locator('#main-advanced .treemap-axis-btn').first();
    await expect(firstBtn).toBeVisible();
    const btnFontSize = await firstBtn.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return parseFloat(s.fontSize) || 0;
    });
    expect(btnFontSize).toBeGreaterThanOrEqual(9);
  });

  test('Root Mode·Size·Color·Preset 컨트롤이 모두 존재', async ({ page }) => {
    await expect(page.locator('#adv-rootmode-toggle')).toBeVisible();
    await expect(page.locator('#adv-size-metric-select')).toBeVisible();
    await expect(page.locator('#adv-color-metric-select')).toBeVisible();
    await expect(page.locator('#adv-preset-region-sales')).toBeVisible();
  });

  test('Preset 버튼 그룹이 한 줄로 유지되어 배열이 깨지지 않음', async ({ page }) => {
    const presetBtns = page.locator('#main-advanced .treemap-preset-inline .treemap-preset-btns');
    await expect(presetBtns).toBeVisible();
    const wrap = await presetBtns.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { flexWrap: s.flexWrap, display: s.display };
    });
    expect(wrap.flexWrap).toBe('nowrap');
    const btnCount = await page.locator('#main-advanced .treemap-preset-inline .treemap-axis-btn').count();
    expect(btnCount).toBeGreaterThanOrEqual(4);
  });
});
