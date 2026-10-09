import { useId, useState } from 'react';
import type { ActivityEntry } from '@qawm/shared';
import { formatDateTime } from './labels';

const show = (value: unknown) =>
  value === null || value === undefined || value === '' ? '—' : `"${String(value)}"`;
const fieldName = (field: string) =>
  field.charAt(0).toUpperCase() +
  field
    .slice(1)
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();

/** One entry: who did what and when, with the old → new values behind "Show changes" (BR-PROJECT-20). */
function Entry({ entry }: { entry: ActivityEntry }) {
  const [open, setOpen] = useState(false);
  const changesId = useId();
  const changes = entry.changes ? Object.entries(entry.changes) : [];
  return (
    <li className="flex flex-col gap-1 border-b py-3 last:border-0" tabIndex={-1}>
      <span>{entry.summary}</span>
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <time dateTime={entry.createdAt} title={new Date(entry.createdAt).toString()}>
          {formatDateTime(entry.createdAt)}
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
    </li>
  );
}

export function ActivityList({ entries, label }: { entries: ActivityEntry[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {entries.map((entry) => (
        <Entry key={entry.id} entry={entry} />
      ))}
    </ol>
  );
}
