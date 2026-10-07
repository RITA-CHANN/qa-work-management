import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('stores an argon2id hash, never the password', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain('Password123!');
  });

  it('verifies the right password only', async () => {
    const hash = await hashPassword('Password123!');
    expect(await verifyPassword(hash, 'Password123!')).toBe(true);
    expect(await verifyPassword(hash, 'password123!')).toBe(false);
  });

  it('returns false for a missing or broken hash instead of throwing', async () => {
    expect(await verifyPassword(null, 'x')).toBe(false);
    expect(await verifyPassword('not-a-hash', 'x')).toBe(false);
  });
});
