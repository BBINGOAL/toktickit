import { defineConfig } from '@playwright/test'
import actions from './lab4-actions.config'
export default defineConfig({
  ...actions,
  testMatch: /actions-taken-flow\.spec\.ts|responsive-accessibility\.spec\.ts|failure-states\.spec\.ts|ticket-resolution\.spec\.ts/,
  outputDir: '../tmp/lab4-workflow-verification/playwright-results',
  reporter: [['list'],['html',{outputFolder:'../tmp/lab4-workflow-verification/playwright-report',open:'never'}]],
})
