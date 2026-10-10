import { describe, expect, it } from 'vitest';
import { timeLeft, toTarget } from './milestone-time';

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

describe('toTarget (AC-PROJECT-105)', () => {
  it.each([
    ['2026-10-29', '20 days to target'],
    ['2026-10-10', '1 day to target'],
    ['2026-10-09', '0 days to target'],
    ['2026-10-08', 'Overdue by 1 day'],
  ])('target %s → %s', (targetDate, text) => {
    expect(toTarget(targetDate, '2026-10-09')).toBe(text);
  });
});
