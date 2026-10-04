import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45000,
  expect: { timeout: 15000 },
  workers: 2,
  reporter: 'list',
  use: { baseURL: process.env.NICKVECTOR_URL || 'http://127.0.0.1:5187', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'ipad-webkit', use: { browserName: 'webkit', viewport: { width: 1024, height: 1366 }, hasTouch: true, isMobile: true } },
    { name: 'phone', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: process.env.NICKVECTOR_URL ? undefined : { command: 'npm run dev -- --host 0.0.0.0 --port 5187 --strictPort', url: 'http://127.0.0.1:5187', reuseExistingServer: true },
})