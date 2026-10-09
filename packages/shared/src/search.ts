import { z } from 'zod';

/** Query of GET /api/search (API-SEARCH-01), the ⌘K palette (BR-SHELL-06). */
export const searchQuerySchema = z.strictObject({ q: z.string().trim().min(1).max(100) });

export const SEARCH_GROUPS = ['project', 'release', 'milestone', 'user'] as const;
export type SearchGroup = (typeof SEARCH_GROUPS)[number];

/** One result. `href` is the page the palette opens. */
export const searchResultSchema = z.object({
  group: z.enum(SEARCH_GROUPS),
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  href: z.string(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

/** At most this many results per group (BR-SHELL-06). */
export const SEARCH_GROUP_LIMIT = 5;
