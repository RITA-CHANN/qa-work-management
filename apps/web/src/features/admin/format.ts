/** Date and time as the Admin tables show them: "9 Oct 2026, 14:05". */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Calendar date "9 Oct 2026" for a YYYY-MM-DD value. */
export const formatDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const tableClass = 'w-full border-collapse text-left text-sm';
export const thClass =
  'border-b px-3 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase';
export const tdClass = 'border-b px-3 py-3 align-middle';
