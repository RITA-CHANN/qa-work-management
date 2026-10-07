import express from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { requestId } from './middleware/request-id';
import { healthRouter } from './modules/health/health.routes';

/**
 * Builds the Express app without starting a server, so it can be reused by tests
 * and by server.ts. Middleware order matters: id → logging → body parsing → routes → errors.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      // One short line per request instead of full header dumps.
      serializers: {
        req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.use('/health', healthRouter);
  api.use(notFound);

  app.use('/api', api);
  app.use(errorHandler);

  return app;
}
