import { expect, test as setup } from '@playwright/test';

const authFile = '.auth/user.json'; // relative to e2e/, where playwright.config.ts lives

setup('log in as a seed user', async ({ page }) => {
  // 1. Go to /login
  await page.goto('/login');
  // 2. Fill Email and Password (getByLabel), click the submit button (getByRole)
  //    Seed user: e.g. linh@qawm.test / Password123!
  await page.getByLabel('Email').fill('linh@qawm.test');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Log in' }).click();

  // 3. Wait until login has really finished BEFORE saving, e.g. assert the URL is '/'
  //    or that the user's name is visible in the header.
  //    If you save too early, the cookie may not be set yet and the file is useless.
  await expect(page).toHaveURL('/');

  // 4. Save the session
  await page.context().storageState({ path: authFile });
});
