type Entry = { failures: number; windowEndsAt: number };

/**
 * Counts failed logins per email in a fixed window that starts at the first failure (BR-AUTH-04).
 * Kept in memory: enough for one API process, cleared on restart (ADR-0006).
 */
export class LoginRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly maxFailures: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  private current(email: string): Entry | undefined {
    const entry = this.entries.get(email);
    if (entry && entry.windowEndsAt <= this.now()) {
      this.entries.delete(email);
      return undefined;
    }
    return entry;
  }

  isBlocked(email: string): boolean {
    return (this.current(email)?.failures ?? 0) >= this.maxFailures;
  }

  recordFailure(email: string): void {
    const entry = this.current(email);
    if (entry) entry.failures += 1;
    else this.entries.set(email, { failures: 1, windowEndsAt: this.now() + this.windowMs });
  }

  /** A successful login starts the count again (BR-AUTH-14). */
  clear(email: string): void {
    this.entries.delete(email);
  }
}
