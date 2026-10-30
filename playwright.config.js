import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8000',
    browserName: 'chromium',
    bypassCSP: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'compacto', use: { viewport: { width: 800, height: 600 }, reducedMotion: 'reduce' } },
  ],
  webServer: {
    command: 'npm start -- --bind 127.0.0.1',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: !process.env.CI,
  },
});
