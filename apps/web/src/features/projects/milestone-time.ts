import { daysBetween, todayIso } from '@qawm/shared';

/**
 * BR-PROJECT-34: "N days left" until the end date of an active milestone, or "Overdue by N days" once it
 * has passed. Shown only; a person still completes the milestone.
 */
export function timeLeft(endDate: string, today: string = todayIso()): string {
  const days = daysBetween(today, endDate);
  if (days < 0) return `Overdue by ${-days} ${-days === 1 ? 'day' : 'days'}`;
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

/** AC-PROJECT-105: "20 days to target" until a release's target date, then "Overdue by N days". */
export function toTarget(targetDate: string, today: string = todayIso()): string {
  const days = daysBetween(today, targetDate);
  if (days < 0) return `Overdue by ${-days} ${-days === 1 ? 'day' : 'days'}`;
  return `${days} ${days === 1 ? 'day' : 'days'} to target`;
}
