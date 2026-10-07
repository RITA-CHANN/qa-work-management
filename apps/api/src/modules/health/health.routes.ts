import { Router } from 'express';
import type { ApiSuccess, HealthResponse } from '@qawm/shared';
import { prisma } from '../../lib/prisma';
import { version } from '../../../package.json';

export const healthRouter = Router();

async function isDatabaseUp(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** GET /api/health: 200 when everything is reachable, 503 when the database is down. */
healthRouter.get('/', async (_req, res) => {
  const databaseUp = await isDatabaseUp();
  const body: ApiSuccess<HealthResponse> = {
    data: {
      status: databaseUp ? 'ok' : 'degraded',
      version,
      uptimeSeconds: Math.round(process.uptime()),
      database: databaseUp ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    },
  };
  res.status(databaseUp ? 200 : 503).json(body);
});
