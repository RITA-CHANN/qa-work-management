import { defineConfig, devices } from '@playwright/test';

/**
 * Tests run against their own servers and their own database (qawm_test),
 * on different ports from `npm run dev`, so they never touch your dev data.
 */
const TEST_API_PORT = 3100;
const TEST_WEB_PORT = 5174;
const TEST_API_URL = `http://localhost:${TEST_API_PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${TEST_WEB_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      // API tests use the `request` fixture only; no browser is launched.
      name: 'api',
      testDir: './tests/api',
      // Call the API directly: request.get('/api/health')
      use: { baseURL: TEST_API_URL },
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      testDir: './tests/ui',
      dependencies: ['setup'], // run setup first
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
    },
  ],

  webServer: [
    {
      // Reset + seed the test database, then start the API in test mode.
      command: 'npm run db:test:prepare -w @qawm/api && npm run start:test -w @qawm/api',
      cwd: '..',
      url: `${TEST_API_URL}/api/health`,
      env: { API_PORT: String(TEST_API_PORT), LOG_LEVEL: 'warn' },
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -w @qawm/web',
      cwd: '..',
      url: `http://localhost:${TEST_WEB_PORT}`,
      env: { WEB_PORT: String(TEST_WEB_PORT), API_PORT: String(TEST_API_PORT) },
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
