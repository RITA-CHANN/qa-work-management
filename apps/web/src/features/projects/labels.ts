import {
  MILESTONE_STATUS_LABELS,
  RELEASE_STATUS_LABELS,
  ROLE_LABELS,
  type ProjectRole,
} from '@qawm/shared';

export { MILESTONE_STATUS_LABELS, RELEASE_STATUS_LABELS, ROLE_LABELS };

export const roleLabel = (role: ProjectRole | null) => (role ? ROLE_LABELS[role] : '—');

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
