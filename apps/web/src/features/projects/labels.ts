import {
  ACCESS_LABELS,
  JOB_TITLE_NAMES,
  MILESTONE_STATUS_LABELS,
  RELEASE_STATUS_LABELS,
  type ProjectAccess,
} from '@qawm/shared';

export { ACCESS_LABELS, JOB_TITLE_NAMES, MILESTONE_STATUS_LABELS, RELEASE_STATUS_LABELS };

export const accessLabel = (access: ProjectAccess | null) => (access ? ACCESS_LABELS[access] : '—');

/** "2026-10-08 14:02" in the browser's time zone. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "3 days ago", "today" for the project list's Updated column. */
export function relativeDays(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
