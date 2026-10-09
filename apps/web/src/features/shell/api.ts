import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiSuccess, SearchResult } from '@qawm/shared';
import { apiFetch, apiSend } from '@/lib/api-client';

export const CURRENT_PROJECT_KEY = ['me', 'current-project'] as const;

/** The project the shell shows (BR-SHELL-04): last opened, else the first one the user can see. */
export function useCurrentProject() {
  return useQuery({
    queryKey: CURRENT_PROJECT_KEY,
    queryFn: () =>
      apiFetch<ApiSuccess<{ key: string | null }>>('/me/current-project').then((r) => r.data.key),
  });
}

/** Remembers a project as the current one. A project the user can't see answers 404 and is ignored. */
export function useSetCurrentProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) =>
      apiSend<ApiSuccess<{ key: string }>>('PUT', '/me/current-project', { key }).then(
        (r) => r.data.key,
      ),
    onSuccess: (key) => queryClient.setQueryData(CURRENT_PROJECT_KEY, key),
  });
}

/** ⌘K results (API-SEARCH-01). Runs only for a non-empty query. */
export function useSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['search', q],
    queryFn: () =>
      apiFetch<ApiSuccess<SearchResult[]>>(`/search?q=${encodeURIComponent(q)}`).then(
        (r) => r.data,
      ),
    enabled: q.length > 0,
    staleTime: 10_000,
  });
}
