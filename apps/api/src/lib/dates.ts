/** `@db.Date` columns come back as a Date at UTC midnight; the API speaks `YYYY-MM-DD`. */
export function toDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDbDateOrNull(date: Date | null): string | null {
  return date ? fromDbDate(date) : null;
}
