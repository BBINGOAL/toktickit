import { test, expect, login, screenshot } from '../fixtures';

test.describe('E2E-01: Create Ticket Flow', () => {
  test('Complete requester submission flow', async ({ page, accounts }) => {
    await login(page, accounts.requester);
    await expect(page).toHaveURL(/\/tickets$/);
    await page.goto('/create');
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
    await screenshot(page, '10-requester-created-ticket');
  });
});
