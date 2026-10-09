import { useId, useState } from 'react';
import type { ActivityEntry } from '@qawm/shared';
import { cn } from '@/lib/utils';
import { formatDateTime, timeAgo } from './labels';

const show = (value: unknown) =>
  value === null || value === undefined || value === '' ? '—' : `"${String(value)}"`;
const fieldName = (field: string) =>
  field.charAt(0).toUpperCase() +
  field
    .slice(1)
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

/**
 * One entry: who did what and when, with the old → new values behind "Show changes" (BR-PROJECT-20).
 * `compact` (dashboard): the actor's initials and "2 h ago" instead of the full date and time.
 */
function Entry({ entry, compact }: { entry: ActivityEntry; compact: boolean }) {
  const [open, setOpen] = useState(false);
  const changesId = useId();
  const changes = entry.changes ? Object.entries(entry.changes) : [];
  return (
    <li
      className={cn('flex gap-3 border-b last:border-0', compact ? 'py-2.5' : 'py-3')}
      tabIndex={-1}
    >
      {compact && (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-semibold text-primary-tint-foreground"
        >
          {initials(entry.actor.name)}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn(compact && 'text-sm')}>{entry.summary}</span>
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <time
            dateTime={entry.createdAt}
            title={compact ? formatDateTime(entry.createdAt) : new Date(entry.createdAt).toString()}
          >
            {compact ? timeAgo(entry.createdAt) : formatDateTime(entry.createdAt)}
          </time>
          {changes.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={changesId}
              onClick={() => setOpen(!open)}
              className="underline-offset-4 hover:underline"
            >
              {open ? 'Hide changes' : 'Show changes'}
            </button>
          )}
        </div>
        {open && (
          <ul id={changesId} className="ml-4 text-sm">
            {changes.map(([field, { from, to }]) => (
              <li key={field}>
                {fieldName(field)}: {show(from)} → {show(to)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function ActivityList({
  entries,
  label,
  compact = false,
}: {
  entries: ActivityEntry[];
  label: string;
  compact?: boolean;
}) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {entries.map((entry) => (
        <Entry key={entry.id} entry={entry} compact={compact} />
      ))}
    </ol>
  );
}
