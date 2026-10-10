import { useId, useState } from 'react';
import type { ActivityEntry } from '@qawm/shared';
import { initials } from '@/lib/utils';
import { changeLines } from './activity-changes';
import { dayKey, dayLabel, formatDateTime, formatTime, timeAgo } from './labels';

/**
 * One entry: who did what and when, with the old → new values behind "Show changes" (BR-PROJECT-20).
 * `time`: "14:02" in the day-grouped log, where the day is already in the group heading; "2 h ago" on the dashboard.
 */
function Entry({ entry, time }: { entry: ActivityEntry; time: 'clock' | 'ago' }) {
  const [open, setOpen] = useState(false);
  const changesId = useId();
  const changes = changeLines(entry);
  return (
    <li className="flex gap-3 py-3" tabIndex={-1}>
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
      >
        {initials(entry.actor.name)}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span>{entry.summary}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)}>
            {time === 'clock' ? formatTime(entry.createdAt) : timeAgo(entry.createdAt)}
          </time>
          {changes.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={changesId}
                onClick={() => setOpen(!open)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {open ? 'Hide changes' : 'Show changes'}
              </button>
            </>
          )}
        </div>
        {open && (
          <ul id={changesId} className="ml-4 text-sm">
            {changes.map((line) => (
              <li key={line.field}>
                {line.label}: {line.from} → {line.to}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/** A flat list with "2 h ago" times (full date and time on hover): the Dashboard's "Recent activity" card (SCR-DASH-01). */
export function ActivityList({ entries, label }: { entries: ActivityEntry[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col divide-y">
      {entries.map((entry) => (
        <Entry key={entry.id} entry={entry} time="ago" />
      ))}
    </ol>
  );
}

/** The full log, grouped by the viewer's local day: "Today", "Yesterday", "Thu, 8 Oct 2026" (SCR-PROJECT-05). */
export function ActivityByDay({ entries }: { entries: ActivityEntry[] }) {
  const days: { key: string; label: string; entries: ActivityEntry[] }[] = [];
  for (const entry of entries) {
    const key = dayKey(entry.createdAt);
    const last = days.at(-1);
    if (last?.key === key) last.entries.push(entry);
    else days.push({ key, label: dayLabel(entry.createdAt), entries: [entry] });
  }
  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <div key={day.key}>
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {day.label}
          </h3>
          <ol aria-label={day.label} className="flex flex-col divide-y">
            {day.entries.map((entry) => (
              <Entry key={entry.id} entry={entry} time="clock" />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
