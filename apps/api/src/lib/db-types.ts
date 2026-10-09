import type { Prisma } from '../generated/prisma/client';

/** The client inside prisma.$transaction(async (tx) => …). Helpers that must run in a transaction take it. */
export type Tx = Prisma.TransactionClient;

/** Postgres unique violation (Prisma P2002), e.g. a duplicate key or a second ACTIVE release. */
export function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'P2002';
}
