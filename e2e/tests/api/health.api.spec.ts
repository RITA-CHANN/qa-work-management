import { expect, test } from '@playwright/test';
import { healthResponseSchema } from '@qawm/shared';

test.describe('Health API', () => {
  test('GET /api/health reports the API and database are up', async ({ request }) => {
    // Act: call the endpoint (baseURL is the API for the "api" project)
    const response = await request.get('/api/health');

    // Assert: status code
    expect(response.status()).toBe(200);

    // Assert: body fields
    const body = await response.json();
    expect(body.data.status).toBe('ok');
    expect(body.data.database).toBe('up');
    healthResponseSchema.parse(body.data);

  });

  test('unknown route returns 404 with the request id', async ({ request }) => {
    // Act
    const response = await request.get('/api/does-not-exist');

    // Assert: status code and error code
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');

    // Assert: error.requestId matches the x-request-id response header
    expect(body.error.requestId).toBe(response.headers()['x-request-id']);
  });

  test('echoes a custom X-Request-Id header', async ({ request }) => {
    // Bonus. Arrange: pick your own id
    const requestId = 'my-test-request-id';

    // Act: send it as a header
    const response = await request.get('/api/health', { headers: { 'X-Request-Id': requestId } });

    // Assert: the same id comes back in the response header
    expect(response.headers()['x-request-id']).toBe(requestId);
  });
});
