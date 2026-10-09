import { defineConfig, devices } from '@playwright/test';

// The service worker only exists in the production build, so these tests run
// against `astro preview` of a fresh build rather than the dev server.
export default defineConfig({
  testDir: './browser-tests',
  testMatch: '**/*.offline.spec.ts',
  // These tests rewrite dist/sw.js to simulate deployments, so they must not
  // run at the same time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4322',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4322',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: 'http://127.0.0.1:4322',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
});
