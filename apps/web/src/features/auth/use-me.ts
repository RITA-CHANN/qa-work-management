import { useQuery } from '@tanstack/react-query';
import type { ApiSuccess, AuthUser } from '@qawm/shared';
import { ApiRequestError, apiFetch } from '@/lib/api-client';

export const ME_QUERY_KEY = ['me'] as const;

/** The logged-in user, or null for a guest (GET /api/auth/me returned 401). */
export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        const res = await apiFetch<ApiSuccess<AuthUser>>('/auth/me');
        return res.data;
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
  });
}
