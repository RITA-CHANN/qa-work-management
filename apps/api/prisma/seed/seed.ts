/**
 * Deterministic seed data. Safe to run repeatedly (upserts by unique email).
 * Phase 1 seeds users; Phase 2 gives every user the same dev/test password.
 */
import { hashPassword } from '../../src/modules/auth/password';
import { prisma } from '../../src/lib/prisma';
import { SEED_PASSWORD, users } from './data/users';

async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, globalRole: user.globalRole, passwordHash },
      create: { ...user, passwordHash },
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
