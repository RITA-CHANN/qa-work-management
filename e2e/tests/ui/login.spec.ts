import { expect, test } from '@playwright/test';
import { msg } from '@qawm/shared';

// Login valid credentials:
const EMAIL = 'linh@qawm.test';
const PASSWORD = 'Password123!';

//Test data
const LoginDatas = [
  {
    id: 'TC001',
    title: 'valid email and password',
    email: EMAIL,
    password: PASSWORD,
    tag: '@AC-AUTH-01',
    cm_err: [],
    email_err: '',
    pw_err: '',
  },
  {
    id: 'TC002',
    title: 'wrong password',
    email: EMAIL,
    password: 'wrongpassword',
    tag: '@AC-AUTH-02',
    cm_err: [msg('MSG-AUTH-01')],
    email_err: '',
    pw_err: '',
  },
  {
    id: 'TC003',
    title: 'non-existent email',
    email: 'unknown@example.com',
    password: PASSWORD,
    tag: '@AC-AUTH-03',
    cm_err: [msg('MSG-AUTH-01')],
    email_err: '',
    pw_err: '',
  },
  {
    id: 'TC004',
    title: 'empty fields',
    email: '',
    password: '',
    tag: '@AC-AUTH-04',
    cm_err: [],
    email_err: msg('MSG-AUTH-03'),
    pw_err: msg('MSG-AUTH-05'),
  },
  {
    id: 'TC005',
    title: 'invalid email format',
    email: 'abc',
    password: PASSWORD,
    tag: '@AC-AUTH-05',
    cm_err: [],
    email_err: msg('MSG-AUTH-04'),
    pw_err: '',
  },
];

// Reset the storage state for each test to avoid using the shared session from .auth/
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  for (const data of LoginDatas) {
    if (data.id !== 'TC001') {
      // Skip the happy case
      // eslint-disable-next-line playwright/valid-test-tags -- tag comes from the data table
      test(
        `${data.id}: failed login with ${data.title} shows the error message`,
        { tag: data.tag },
        async ({ page }) => {
          await page.goto('/login');
          // Act
          await page.getByLabel('Email').fill(data.email);
          await page.getByLabel('Password').fill(data.password);
          await page.getByRole('button', { name: 'Log in' }).click();
          // Assert
          await expect(page).toHaveURL('/login');
          await expect(page.getByRole('alert')).toHaveText(data.cm_err);
          await expect(page.getByLabel('Email')).toHaveAccessibleDescription(data.email_err);
          await expect(page.getByLabel('Password')).toHaveAccessibleDescription(data.pw_err);
        },
      );
    } else {
      // eslint-disable-next-line playwright/valid-test-tags -- tag comes from the data table
      test(
        `${data.id}: successful login with ${data.title}`,
        { tag: data.tag },
        async ({ page }) => {
          // Arrange
          await page.goto('/login');

          // Act
          await page.getByLabel('Email').fill(EMAIL);
          await page.getByLabel('Password').fill(PASSWORD);
          await page.getByRole('button', { name: 'Log in' }).click();

          // Assert
          await expect(page).toHaveURL('/');
          await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
          await expect(page.getByText('Linh QA')).toBeVisible();
        },
      );
    }
  }

  test(
    'TC006: guest opening a protected page returns there after login',
    { tag: '@AC-AUTH-22' },
    async ({ page }) => {
      // Act 1: open /projects as a guest
      await page.goto('/projects');

      // Assert 1: sent to /login (URL contains returnTo)
      await expect(page).toHaveURL(/\/login\?returnTo=%2Fprojects/);
      // Act 2: log in
      await page.getByLabel('Email').fill(EMAIL);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Log in' }).click();
      // Assert 2: back on /projects
      await expect(page).toHaveURL('/projects');
      await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
    },
  );

  test(
    'TC007: returnTo to an outside site falls back to the dashboard',
    { tag: '@AC-AUTH-24' },
    async ({ page }) => {
      await page.goto('/login?returnTo=https://evil.com');

      // Act: log in
      await page.getByLabel('Email').fill(EMAIL);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Log in' }).click();
      // Assert: URL is '/' on our app, not evil.com
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    },
  );

  test(
    'TC008: log out returns to login and Back does not show the page',
    { tag: ['@AC-AUTH-18', '@AC-AUTH-19'] },
    async ({ page }) => {
      // Arrange: log in here (never log out the shared session from .auth/)
      await page.goto('/login');
      await page.getByLabel('Email').fill(EMAIL);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Log in' }).click();
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
      // Build history with a protected page to go Back to:
      // [/, /projects, /] -> logout replaces the last entry -> [/, /projects, /login]
      const mainNav = page.getByRole('navigation', { name: 'Main' });
      await mainNav.getByRole('link', { name: 'Projects' }).click();
      await expect(page).toHaveURL('/projects');
      await mainNav.getByRole('link', { name: 'Dashboard', exact: true }).click();
      await expect(page).toHaveURL('/');

      // Act 1: click "Log out"
      await page.getByRole('button', { name: 'Log out' }).click();
      // Assert 1: on /login
      await expect(page).toHaveURL('/login');

      // Act 2: Back goes to /projects (a protected page)
      await page.goBack();
      // Assert 2: the guard sends us to /login with returnTo=/projects. This URL can only appear
      // if Back really reached /projects, so the test can't pass by staying on /login.
      // Wait for the login form FIRST, so the toBeHidden checks run on the final page.
      await expect(page).toHaveURL('/login?returnTo=%2Fprojects');
      await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeHidden();
    },
  );
});
