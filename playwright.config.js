import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: { baseURL: `http://127.0.0.1:5173${process.env.VITE_BASE_PATH || '/'}`, headless: true },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: [{
    command: 'npm run dev -- --host 127.0.0.1',
    url: `http://127.0.0.1:5173${process.env.VITE_BASE_PATH || '/'}`,
    reuseExistingServer: !process.env.CI,
  }, {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175',
    url: `http://127.0.0.1:4175${process.env.VITE_BASE_PATH || '/'}`,
    reuseExistingServer: !process.env.CI,
  }],
});
