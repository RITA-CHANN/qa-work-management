/**
 * Deterministic seed data. Safe to run repeatedly (upserts by unique email).
 * Phase 1 seeds users only; each phase adds its own realistic data.
 */
import { prisma } from '../../src/lib/prisma';
import { users } from './data/users';

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, globalRole: user.globalRole },
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
