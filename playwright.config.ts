/**
 * Playwright Configuration for Skyvera Demo Validation
 * Phase 05-04: E2E and smoke tests with real API calls
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',

  // Run tests sequentially to avoid port conflicts and rate limiting issues
  fullyParallel: false,

  // Retry once on failure to handle network flakiness
  retries: 1,

  // Workers: 1 to ensure sequential execution
  workers: 1,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',

    // Trace on first retry and on failure
    trace: 'retain-on-failure',

    // Screenshot only on failure
    screenshot: 'only-on-failure',

    // Video only on failure
    video: 'retain-on-failure',

    // Timeout for individual actions (15s for Claude API calls)
    actionTimeout: 15000,
  },

  // Test timeout: 60 seconds per test
  timeout: 60000,

  // Expect timeout: 10 seconds for assertions
  expect: {
    timeout: 10000,
  },

  // Project configuration - Chromium only for demo
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Ensure viewport is large enough for desktop tab view (md: breakpoint is 768px)
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Web server configuration - start Next.js dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120000, // 2 minutes to start
    reuseExistingServer: true, // Don't restart if already running
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
