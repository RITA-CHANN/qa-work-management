import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiSuccess, AuthUser, LoginRequest } from '@qawm/shared';
import { apiFetch } from '@/lib/api-client';
import { ME_QUERY_KEY } from './use-me';

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) =>
      apiFetch<ApiSuccess<AuthUser>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }).then((res) => res.data),
    onSuccess: (user) => {
      // Nothing cached from a previous user survives a new login.
      queryClient.clear();
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });
}
