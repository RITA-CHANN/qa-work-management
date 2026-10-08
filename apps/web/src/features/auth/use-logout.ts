import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { apiFetch } from '@/lib/api-client';
import { ME_QUERY_KEY } from './use-me';

/** Ends the session on the server, forgets all cached data and replaces history (AC-AUTH-19). */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST', body: '{}' }),
    // Even if the request fails (network), the browser forgets the user.
    onSettled: () => {
      // Mark the user as a guest before leaving, so /login doesn't bounce back to the dashboard.
      queryClient.setQueryData(ME_QUERY_KEY, null);
      void navigate('/login', { replace: true });
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_QUERY_KEY[0] });
    },
  });
}
