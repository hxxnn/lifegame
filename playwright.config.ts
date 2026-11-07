import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    launchOptions: { executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] },
    trace: 'off',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
