import { describe, expect, it } from 'vitest';
import { timeLeft } from './milestone-time';

describe('timeLeft (BR-PROJECT-34)', () => {
  it.each([
    ['2026-10-12', '3 days left'],
    ['2026-10-10', '1 day left'],
    ['2026-10-09', '0 days left'],
    ['2026-10-08', 'Overdue by 1 day'],
    ['2026-10-07', 'Overdue by 2 days'],
  ])('ends %s → %s', (endDate, text) => {
    expect(timeLeft(endDate, '2026-10-09')).toBe(text);
  });
});
