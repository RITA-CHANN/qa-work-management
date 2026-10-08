import { expect, request as playwrightRequest, test } from '@playwright/test';
import { authUserSchema } from '@qawm/shared';

const EMAIL = 'linh@qawm.test';
const PASSWORD = 'Password123!';

// Endpoints: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
// The `request` fixture keeps cookies between calls in the same test, like a browser.

test.describe('Auth API', () => {
  test(
    'login returns the user and /me works with the cookie',
    { tag: '@AC-AUTH-01' },
    async ({ request }) => {
      // Act 1: log in
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: EMAIL, password: PASSWORD },
      });
      const loginResponseBody = await loginResponse.json();

      // Assert 1: 200, body.data matches authUserSchema (use .parse so a failure names the field)
      expect(loginResponse.status()).toBe(200);
      authUserSchema.strict().parse(loginResponseBody.data);

      // Act 2: call /me with the same `request` (cookie is sent automatically)
      const meResponse = await request.get('/api/auth/me');
      const meResponseBody = await meResponse.json();

      // Assert 2: 200, same user
      expect(meResponse.status()).toBe(200);
      expect(authUserSchema.strict().parse(meResponseBody.data)).toEqual(loginResponseBody.data);
    },
  );

  test('/me without a session returns 401', { tag: '@AC-AUTH-16' }, async ({ baseURL }) => {
    // Arrange: a fresh client with no cookies
    const guest = await playwrightRequest.newContext({ baseURL });

    // Act: GET /api/auth/me
    const meResponse = await guest.get('/api/auth/me');

    // Assert: 401, body.error.code is 'UNAUTHENTICATED'
    expect(meResponse.status()).toBe(401);

    await guest.dispose();
  });

  test(
    'session cookie is HttpOnly and SameSite=Lax, body has no token',
    { tag: ['@AC-AUTH-31', '@AC-AUTH-32'] },
    async ({ request }) => {
      // Act: log in
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: EMAIL, password: PASSWORD },
      });

      // Assert: response.headers()['set-cookie'] contains 'HttpOnly' and 'SameSite=Lax'
      const setCookieHeader = loginResponse.headers()['set-cookie'];
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Lax');

      // Assert: the response body text does not contain the cookie value or the password
      const token = setCookieHeader?.match(/qawm_sid=([^;]+)/)?.[1];
      expect(token).toBeTruthy();

      const loginResponseText = await loginResponse.text();
      expect(loginResponseText).not.toContain(token);
      expect(loginResponseText).not.toContain(PASSWORD);
    },
  );

  test(
    'old cookie is rejected after logout',
    { tag: '@AC-AUTH-20' },
    async ({ request, baseURL }) => {
      // Arrange: log in, keep a copy of the cookie (request.storageState() or the set-cookie header)
      const loginResponse = await request.post('/api/auth/login', {
        data: { email: EMAIL, password: PASSWORD },
      });
      expect(loginResponse.status()).toBe(200);

      // Act 1: log out
      const logoutResponse = await request.post('/api/auth/logout', { data: {} });
      expect(logoutResponse.status()).toBe(204);

      // Act: log out, then call /me with the OLD cookie (e.g. a new context with that cookie,
      //      or send it yourself in the `Cookie` header)
      const token = loginResponse.headers()['set-cookie']?.match(/qawm_sid=([^;]+)/)?.[1];
      expect(token).toBeTruthy();
      const guest = await playwrightRequest.newContext({
        baseURL,
        extraHTTPHeaders: { Cookie: `qawm_sid=${token}` },
      });
      const meResponse = await guest.get('/api/auth/me');

      // Assert: 401, body.error.code is 'UNAUTHENTICATED'
      expect(meResponse.status()).toBe(401);

      await guest.dispose();
    },
  );

  test(
    'rate limit: 5th wrong attempt is 401, 6th with the right password is 429',
    { tag: ['@AC-AUTH-10', '@AC-AUTH-11'] },
    async ({ request }) => {
      // Use ONLY ratelimit@qawm.test here, so other tests are never blocked.
      const email = 'ratelimit@qawm.test';
      const password = 'wrongpassword';

      // Act 1: 5 wrong passwords (a for loop)
      await Promise.all(
        Array.from({ length: 5 }, async () => {
          const wrongEmailResponse = await request.post('/api/auth/login', {
            data: { email, password },
          });
          expect(wrongEmailResponse.status()).toBe(401);
        }),
      );

      // Act 2: 6th attempt with the RIGHT password
      const rightPasswordResponse = await request.post('/api/auth/login', {
        data: { email, password: 'Password123!' },
      });

      // Assert 2: 429, and /me is still 401 (not logged in)
      expect(rightPasswordResponse.status()).toBe(429);
      const meResponse = await request.get('/api/auth/me');
      expect(meResponse.status()).toBe(401);
    },
  );
});
