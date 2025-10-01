import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './',
  testMatch: ['test-response-debug.spec.ts'],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://dev.np-topvitaminsupply.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Ignore HTTPS certificate errors */
    ignoreHTTPSErrors: true,
    
    /* Set a longer timeout for local development */
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    /* Run in non-headless mode to see browser */
    headless: false,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        headless: false,
      },
    },
  ],

});
