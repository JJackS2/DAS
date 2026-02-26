import { defineConfig, devices } from '@playwright/test';

const useServer = process.env.TREEMAP_BASE_URL === undefined || process.env.TREEMAP_BASE_URL === '';

export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: process.env.TREEMAP_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'off',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: useServer
    ? {
        command: 'npx serve dashboard_demo -l 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 15000,
      }
    : undefined,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
