import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { purgeOldAuditEvents } from './modules/admin/settings.service';

const server = createApp().listen(env.API_PORT, () => {
  logger.info(`API listening on http://localhost:${env.API_PORT} (${env.NODE_ENV})`);
});

/** BR-ADMIN-17: audit events older than the retention setting are deleted at start and then daily. */
const DAY_MS = 24 * 60 * 60 * 1000;
const purge = () =>
  purgeOldAuditEvents()
    .then((count) => count > 0 && logger.info(`Deleted ${count} audit events past retention`))
    .catch((error: unknown) => logger.error({ err: error }, 'Audit retention cleanup failed'));
void purge();
const purgeTimer = setInterval(() => void purge(), DAY_MS);
purgeTimer.unref();

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  clearInterval(purgeTimer);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
