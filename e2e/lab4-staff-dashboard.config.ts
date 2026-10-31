import { defineConfig } from '@playwright/test'
import dashboard from './lab4-dashboard.config'
export default defineConfig({
  ...dashboard,
  testMatch: /actions-taken-flow\.spec\.ts|responsive-accessibility\.spec\.ts|failure-states\.spec\.ts|ticket-resolution\.spec\.ts|dashboards\.spec\.ts|staff-dashboard\.spec\.ts/,
  outputDir: '../tmp/lab4-staff-dashboard-verification/playwright-results',
  reporter: [['list'],['html',{outputFolder:'../tmp/lab4-staff-dashboard-verification/playwright-report',open:'never'}]],
})
