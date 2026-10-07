import { hash, verify } from '@node-rs/argon2';

/** argon2id with the library defaults (ADR-0007). */
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

// Verified against when the email is unknown, so both cases take about the same time (BR-AUTH-03).
let dummyHash: Promise<string> | undefined;

/** True only when `storedHash` exists and matches. Never throws for a bad or missing hash. */
export async function verifyPassword(
  storedHash: string | null,
  password: string,
): Promise<boolean> {
  if (!storedHash) {
    dummyHash ??= hashPassword('dummy-password-for-timing');
    await verify(await dummyHash, password).catch(() => false);
    return false;
  }
  return verify(storedHash, password).catch(() => false);
}
