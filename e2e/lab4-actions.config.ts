import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const database = new URL(process.env.DATABASE_URL || 'postgresql://invalid/').pathname
if (!database.startsWith('/toktickit_lab4_verify_')) throw new Error('Actions E2E requires an isolated toktickit_lab4_verify_* DATABASE_URL for both API and fixtures.')

export default defineConfig({
  testDir: './lab-04', testMatch: /actions-taken-flow\.spec\.ts|responsive-accessibility\.spec\.ts|failure-states\.spec\.ts/,
  fullyParallel: false, workers: 1, retries: 0, forbidOnly: true,
  outputDir: '../tmp/lab4-ui-verification/playwright-results',
  reporter: [['list'], ['html', { outputFolder: '../tmp/lab4-ui-verification/playwright-report', open: 'never' }]],
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npx tsx src/index.ts', cwd: path.resolve(__dirname, '../server'), url: 'http://localhost:4000/health', reuseExistingServer: false, timeout: 60000 },
    { command: 'npm run dev -- --host localhost', cwd: path.resolve(__dirname, '../client'), url: 'http://localhost:5173', reuseExistingServer: false, timeout: 60000 },
  ],
})
