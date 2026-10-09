/**
 * Deterministic seed data. Safe to run repeatedly: users are upserted by email, and the seed projects
 * (data/projects.ts) are deleted and created again, so every test run starts from the same state.
 * Projects that tests create with their own keys are left alone.
 */
import { addDays, ROLE_LABELS, todayIso } from '@qawm/shared';
import { toDbDate } from '../../src/lib/dates';
import { hashPassword } from '../../src/modules/auth/password';
import { prisma } from '../../src/lib/prisma';
import { projects, type SeedProject } from './data/projects';
import { SEED_PASSWORD, users } from './data/users';

const today = todayIso();
const day = (offset: number) => toDbDate(addDays(today, offset));

async function seedUsers(): Promise<Map<string, { id: string; name: string }>> {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const byEmail = new Map<string, { id: string; name: string }>();
  for (const user of users) {
    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, globalRole: user.globalRole, passwordHash },
      create: { ...user, passwordHash },
    });
    byEmail.set(row.email, { id: row.id, name: row.name });
  }
  return byEmail;
}

async function seedProject(seed: SeedProject, byEmail: Map<string, { id: string; name: string }>) {
  const user = (email: string) => {
    const found = byEmail.get(email);
    if (!found) throw new Error(`Seed user ${email} missing`);
    return found;
  };
  const creator = user(seed.createdBy);

  await prisma.$transaction(async (tx) => {
    // Start over: children first, because releases and milestones block deleting a project.
    const old = await tx.project.findMany({ where: { key: seed.key }, select: { id: true } });
    for (const { id } of old) {
      await tx.milestone.deleteMany({ where: { projectId: id } });
      await tx.release.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    }

    const createdAt = day(-90);
    const project = await tx.project.create({
      data: {
        key: seed.key,
        name: seed.name,
        description: seed.description,
        archivedAt: seed.archived ? day(-30) : null,
        createdById: creator.id,
        createdAt,
        members: {
          create: seed.members.map(([email, role]) => ({
            userId: user(email).id,
            role,
            createdAt,
          })),
        },
      },
    });

    // A few activity entries so the Activity tab is not empty (docs/database/tables/activity_logs.md).
    const entries = [
      {
        action: 'project.created',
        entityType: 'project',
        entityId: project.id,
        summary: `${creator.name} created the project`,
      },
      ...seed.members
        .filter(([email]) => email !== seed.createdBy)
        .map(([email, role]) => ({
          action: 'member.added',
          entityType: 'member',
          entityId: user(email).id,
          summary: `${creator.name} added ${user(email).name} as ${ROLE_LABELS[role]}`,
        })),
    ];
    await tx.activityLog.createMany({
      data: entries.map((entry, index) => ({
        ...entry,
        projectId: project.id,
        actorId: creator.id,
        createdAt: new Date(createdAt.getTime() + index * 1000),
      })),
    });

    for (const release of seed.releases) {
      const row = await tx.release.create({
        data: {
          projectId: project.id,
          name: release.name,
          nameNormalized: release.name.toLowerCase(),
          status: release.status,
          startDate: day(release.start),
          targetDate: day(release.target),
        },
      });
      for (const milestone of release.milestones) {
        await tx.milestone.create({
          data: {
            projectId: project.id,
            releaseId: row.id,
            name: milestone.name,
            nameNormalized: milestone.name.toLowerCase(),
            goal: milestone.goal,
            startDate: day(milestone.start),
            endDate: day(milestone.end),
            status: milestone.status,
          },
        });
      }
    }
  });
}

async function main() {
  const byEmail = await seedUsers();
  for (const project of projects) await seedProject(project, byEmail);
  console.log(`Seeded ${users.length} users and ${projects.length} projects`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
