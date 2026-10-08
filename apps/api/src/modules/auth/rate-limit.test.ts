import { describe, expect, it } from 'vitest';
import { LoginRateLimiter } from './rate-limit';

const WINDOW = 15 * 60 * 1000;

function limiter() {
  let now = 0;
  const rl = new LoginRateLimiter(5, WINDOW, () => now);
  return { rl, advance: (ms: number) => (now += ms) };
}

function fail(rl: LoginRateLimiter, email: string, times: number) {
  for (let i = 0; i < times; i++) rl.recordFailure(email);
}

describe('LoginRateLimiter', () => {
  it('is not blocked after 4 failures and is blocked after 5 (BR-AUTH-04)', () => {
    const { rl } = limiter();
    fail(rl, 'a@x.test', 4);
    expect(rl.isBlocked('a@x.test')).toBe(false);
    fail(rl, 'a@x.test', 1);
    expect(rl.isBlocked('a@x.test')).toBe(true);
  });

  it('blocks per email', () => {
    const { rl } = limiter();
    fail(rl, 'a@x.test', 5);
    expect(rl.isBlocked('b@x.test')).toBe(false);
  });

  it('unblocks when the window that started at the first failure ends', () => {
    const { rl, advance } = limiter();
    fail(rl, 'a@x.test', 1);
    advance(10 * 60 * 1000);
    fail(rl, 'a@x.test', 4);
    expect(rl.isBlocked('a@x.test')).toBe(true);
    advance(5 * 60 * 1000 - 1);
    expect(rl.isBlocked('a@x.test')).toBe(true);
    advance(1);
    expect(rl.isBlocked('a@x.test')).toBe(false);
  });

  it('starts counting again after a success (BR-AUTH-14)', () => {
    const { rl } = limiter();
    fail(rl, 'a@x.test', 4);
    rl.clear('a@x.test');
    fail(rl, 'a@x.test', 1);
    expect(rl.isBlocked('a@x.test')).toBe(false);
  });
});
