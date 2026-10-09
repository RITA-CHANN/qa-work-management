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

/** "Just now", "5 min ago", "3 h ago", "Yesterday", else the date: recent activity on the dashboard (SCR-DASH-01). */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (then.toDateString() === now.toDateString()) return `${Math.floor(minutes / 60)} h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (then.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "3 days ago", "today" for the project list's Updated column. */
export function relativeDays(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
