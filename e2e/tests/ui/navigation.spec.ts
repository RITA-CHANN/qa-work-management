import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange: every test starts on the dashboard (baseURL comes from playwright.config.ts).
    await page.goto('/');
  });

  test('home page shows the dashboard', async ({ page }) => {
    // Assert: page title and level-1 heading
    await expect(page).toHaveTitle('Dashboard · QA Work Management');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  });

  test('main nav link opens the projects page', async ({ page }) => {
    // Arrange: scope locators to the "Main" navigation landmark
    const mainNav = page.getByRole('navigation', { name: 'Main' });

    // Act: click the Projects link
    await page.getByRole('link', { name: 'Projects' }).click();

    // Assert: URL, heading, active link, empty state
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'No projects yet' })).toBeVisible();
  });

  test('navigate back to the dashboard when open not exist page', async ({ page }) => {
    // Arrange: scope locators to the "Main" navigation landmark
    const mainNav = page.getByRole('navigation', { name: 'Main' });

    // Act: go to a non-existent page
    await page.goto('/does-not-exist');

    // Assert: URL, heading, active link, empty state
    await expect(page).toHaveURL('/does-not-exist');
    await expect(page.getByRole('heading', { level: 1, name: 'Page Not Found' })).toBeVisible();

    // Act: click the Dashboard link
    await page.getByRole('link', { name: 'Back to Dashboard' }).click();

    // Assert: URL, heading, active link, empty state
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
