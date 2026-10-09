import { z } from 'zod';

/**
 * Calendar dates (`YYYY-MM-DD`, no time zone) used by releases and milestones.
 * Day arithmetic is done in UTC so a date never shifts by one with the local time zone.
 */

export const isoDateSchema = z.iso.date();

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** Days from `from` to `to` (0 for the same day, negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Length of a milestone, counting both its first and last day (BR-PROJECT-28): 1 for start = end. */
export function inclusiveDays(start: string, end: string): number {
  return daysBetween(start, end) + 1;
}

/** Today as `YYYY-MM-DD` in UTC (DD-PROJECT-04 "days left"). */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** `date` moved by `days` (negative goes back). */
export function addDays(date: string, days: number): string {
  return new Date(toUtc(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Two inclusive ranges overlap when each starts on or before the other ends (BR-PROJECT-30). */
export function rangesOverlap(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}
