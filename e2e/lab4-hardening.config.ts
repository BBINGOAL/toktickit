import { defineConfig } from '@playwright/test'
import actions from './lab4-actions.config'

// Run every application suite, including earlier labs; exclude the external example.
export default defineConfig({
  ...actions,
  testDir: '.',
  testMatch: ['**/lab-02/*.spec.ts', '**/lab-03/*.spec.ts', '**/lab-04/*.spec.ts'],
  outputDir: '../tmp/lab4-hardening-verification/playwright-results',
  reporter: [['list'], ['html', { outputFolder: '../tmp/lab4-hardening-verification/playwright-report', open: 'never' }]],
})
