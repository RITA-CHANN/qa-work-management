import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';
const SAFE_ID = /^[\w-]{1,64}$/;

/**
 * Gives every request an id, returned in the X-Request-Id header and in error bodies.
 * A client (e.g. a Playwright test) may send its own id to make logs easy to find.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER);
  const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
};
