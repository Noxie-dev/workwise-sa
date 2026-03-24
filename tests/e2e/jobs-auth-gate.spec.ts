import { expect, test } from 'playwright/test';

test.describe('Anonymous Jobs Browser Flow', () => {
  test('lets an anonymous visitor search jobs and hits the auth gate for details', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Find Jobs' }).click();
    await expect(page).toHaveURL(/\/jobs$/);

    const searchInput = page.getByTestId('job-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('cashier');
    await page.getByTestId('job-search-submit').click();

    await expect(page).toHaveURL(/\/jobs\?q=cashier/);

    const firstCard = page.locator('[data-testid^="job-preview-card-"]').first();
    await expect(firstCard).toBeVisible();

    await firstCard.getByRole('button', { name: /view full job details/i }).click();

    const authModal = page.getByTestId('auth-prompt-modal');
    await expect(authModal).toBeVisible();
    await expect(authModal.getByText('Sign Up to Continue')).toBeVisible();
    await expect(authModal.getByRole('button', { name: 'Create Free Account' })).toBeVisible();
    await expect(authModal.getByRole('button', { name: 'Sign In to Existing Account' })).toBeVisible();
  });

  test('redirects an anonymous visitor to login when protected job details are opened directly', async ({ page }) => {
    await page.goto('/jobs/1');

    await expect(page.getByText('Authentication Required')).toBeVisible();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
