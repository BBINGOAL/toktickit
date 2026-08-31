import { test, expect } from '@playwright/test';

test.describe('E2E-01: Create Ticket Flow', () => {
  test('Complete responsive submission flow', async ({ page }) => {
    // Navigate to the app (assuming client runs on localhost:5173)
    await page.goto('http://localhost:5173/');

    // 1. Select a Development Requester
    await expect(page.getByRole('heading', { name: /Development Requester Selection/i })).toBeVisible();
    try {
        await expect(page.locator('select')).toBeVisible({ timeout: 10000 });
    } catch (e) {
        console.log(await page.content());
        throw e;
    }
    await page.locator('select').selectOption({ label: 'Jennifer Anderson' });
    await page.getByRole('button', { name: /Select Requester/i }).click();

    // 2. We should be redirected to Create Ticket page
    await expect(page.getByRole('heading', { name: /Create New Ticket/i })).toBeVisible();

    // Fill out the ticket form
    await page.locator('select').nth(0).selectOption({ label: 'Hardware' });
    await page.locator('select').nth(1).selectOption({ label: 'Corporate Laptop' });
    await page.locator('select').nth(2).selectOption({ label: 'MEDIUM' });

    const uniqueSuffix = Date.now().toString();
    const summaryText = `Laptop screen flickering (E2E Test ${uniqueSuffix})`;
    const summaryInput = page.getByPlaceholder(/Brief description of the issue/i);
    await summaryInput.fill(summaryText);

    const descriptionInput = page.getByPlaceholder(/Detailed description of the issue/i);
    await descriptionInput.fill('The screen flickers continuously when not plugged into power.');

    // Wait for a short moment to ensure form state updates
    await page.waitForTimeout(500);

    // 3. Submit the ticket
    await page.getByRole('button', { name: /Submit Ticket/i }).click();

    // 4. Verify confirmation shows official number
    await expect(page.getByText(/Ticket Created!/i)).toBeVisible();
    await expect(page.getByText(/Your ticket number is:/i)).toBeVisible();
    
    // Check if official ticket number TKT-YYYY-NNNNNN is shown
    const ticketNumberElement = page.locator('text=/TKT-\\d{4}-\\d{6}/i').first();
    await expect(ticketNumberElement).toBeVisible();
    const createdTicketNumber = await ticketNumberElement.textContent();

    // 5. Click "View My Tickets"
    await page.getByRole('button', { name: /View My Tickets/i }).click();

    // 6. Verify we are on My Tickets page
    await expect(page.getByRole('heading', { name: /My Tickets/i, exact: true })).toBeVisible();

    // Check if the ticket appears in the list
    if (createdTicketNumber) {
        await expect(page.getByText(createdTicketNumber)).toBeVisible();
    }
    await expect(page.getByText(summaryText)).toBeVisible();
  });
});
