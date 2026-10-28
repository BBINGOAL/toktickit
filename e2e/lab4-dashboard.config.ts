import { defineConfig } from '@playwright/test'
import workflow from './lab4-workflow.config'
export default defineConfig({
  ...workflow,
  testMatch: /actions-taken-flow\.spec\.ts|responsive-accessibility\.spec\.ts|failure-states\.spec\.ts|ticket-resolution\.spec\.ts|dashboards\.spec\.ts/,
  outputDir: '../tmp/lab4-dashboard-verification/playwright-results',
  reporter: [['list'], ['html', { outputFolder: '../tmp/lab4-dashboard-verification/playwright-report', open: 'never' }]],
})
