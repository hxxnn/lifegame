import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// 클라우드 환경처럼 브라우저가 따로 설치된 경우에만 그 경로를 쓴다. 로컬에서는 `npx playwright install chromium`으로 받은 기본 브라우저를 쓴다.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';
const launchOptions = existsSync(PREINSTALLED_CHROMIUM) ? { executablePath: PREINSTALLED_CHROMIUM, args: ['--no-sandbox'] } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  // CI에서는 실패 시 볼 수 있는 HTML 리포트를 남기고, 일시적인 흔들림은 한 번 다시 시도한다.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    launchOptions,
    trace: 'off',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
