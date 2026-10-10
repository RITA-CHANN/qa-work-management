import {
  ACCESS_LABELS,
  GUEST_AREA_LABELS,
  JOB_TITLE_NAMES,
  MILESTONE_STATUS_LABELS,
  RELEASE_STATUS_LABELS,
  type ActivityEntry,
} from '@qawm/shared';

export type ChangeLine = { field: string; label: string; from: string; to: string };

const EMPTY = '—';

const lookup =
  (labels: Record<string, string>) =>
  (value: unknown): string =>
    value === null || value === undefined || value === ''
      ? EMPTY
      : (labels[String(value)] ?? String(value));

const areas = (value: unknown): string =>
  Array.isArray(value) && value.length
    ? value
        .map((area) => GUEST_AREA_LABELS[area as keyof typeof GUEST_AREA_LABELS] ?? String(area))
        .join(', ')
    : EMPTY;

const text = (value: unknown): string =>
  value === null || value === undefined || value === '' ? EMPTY : `"${String(value)}"`;

const plain = (value: unknown): string =>
  value === null || value === undefined || value === '' ? EMPTY : String(value);

/** "targetDate" → "Target date". */
const fieldLabel = (field: string) =>
  field.charAt(0).toUpperCase() +
  field
    .slice(1)
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase();

const DATE_FIELD = /Date$/;

/**
 * The old → new values of an entry in display names, never internal codes (BR-PROJECT-20, SCR-PROJECT-05
 * "How changes are shown"). Stored values stay as they are; only the display changes.
 */
export function changeLines(entry: Pick<ActivityEntry, 'entityType' | 'changes'>): ChangeLine[] {
  return Object.entries(entry.changes ?? {}).map(([field, { from, to }]) => {
    let label = fieldLabel(field);
    let format: (value: unknown) => string = text;
    if (field === 'access') format = lookup(ACCESS_LABELS);
    else if (field === 'jobTitle') format = lookup(JOB_TITLE_NAMES);
    else if (field === 'status')
      format = lookup(
        entry.entityType === 'milestone' ? MILESTONE_STATUS_LABELS : RELEASE_STATUS_LABELS,
      );
    else if (field === 'guestAreas') {
      label = 'Guest can see';
      format = areas;
    } else if (DATE_FIELD.test(field)) format = plain;
    return { field, label, from: format(from), to: format(to) };
  });
}
