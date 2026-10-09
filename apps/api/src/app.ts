import cookieParser from 'cookie-parser';
import express from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { requireJson } from './middleware/require-json';
import { requestId } from './middleware/request-id';
import { adminRouter } from './modules/admin/admin.routes';
import { authRouter, publicAuthRouter } from './modules/auth/auth.routes';
import { healthRouter } from './modules/health/health.routes';
import { meRouter } from './modules/me/me.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { searchRouter } from './modules/search/search.routes';
import { usersRouter } from './modules/users/users.routes';

/**
 * Builds the Express app without starting a server, so it can be reused by tests
 * and by server.ts. Middleware order matters: id → logging → cookies + body parsing → JSON guard
 * → routes → errors. See docs/design/detail/logic/DD-AUTH-02-api-guards.md.
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
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.use(requireJson);
  // Public routes. Every other router is protected: its own first middleware is requireAuth.
  api.use('/health', healthRouter);
  api.use('/auth', publicAuthRouter);
  // Protected routes.
  api.use('/auth', authRouter);
  api.use('/projects', projectsRouter);
  api.use('/users', usersRouter);
  api.use('/me', meRouter);
  api.use('/search', searchRouter);
  api.use('/admin', adminRouter);
  api.use(notFound);

  app.use('/api', api);
  app.use(errorHandler);

  return app;
}
