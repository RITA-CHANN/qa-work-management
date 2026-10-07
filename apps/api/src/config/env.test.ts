import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const validDbUrl = 'postgresql://postgres:postgres@localhost:5432/qawm_dev';

describe('parseEnv', () => {
  it('applies defaults when optional values are missing', () => {
    const env = parseEnv({ DATABASE_URL: validDbUrl });

    expect(env.API_PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.AI_PROVIDER).toBe('mock');
  });

  it('uses DATABASE_URL_TEST when NODE_ENV is test', () => {
    const testUrl = 'postgresql://postgres:postgres@localhost:5432/qawm_test';
    const env = parseEnv({
      NODE_ENV: 'test',
      DATABASE_URL: validDbUrl,
      DATABASE_URL_TEST: testUrl,
    });

    expect(env.DATABASE_URL).toBe(testUrl);
  });

  it('fails with a readable message when DATABASE_URL is missing', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL: is required/);
  });

  it('rejects a port outside the valid range', () => {
    expect(() => parseEnv({ DATABASE_URL: validDbUrl, API_PORT: '70000' })).toThrow(/API_PORT/);
  });
});
