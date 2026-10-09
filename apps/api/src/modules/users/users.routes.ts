import { Router } from 'express';
import { userListQuerySchema, type ApiSuccess, type UserOption } from '@qawm/shared';
import { parseOrThrow } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/require-auth';

export const usersRouter = Router();
usersRouter.use(requireAuth);

/** GET /api/users (API-USER-01): people for the "Add member" picker. Only id, name and email. */
usersRouter.get('/', async (req, res) => {
  const query = parseOrThrow(userListQuerySchema, req.query);
  const users = await prisma.user.findMany({
    where: query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {},
    select: { id: true, name: true, email: true },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    take: query.limit,
  });
  res.json({ data: users } satisfies ApiSuccess<UserOption[]>);
});
