import { useQuery } from '@tanstack/react-query';
import type { ApiSuccess, HealthResponse } from '@qawm/shared';
import { apiFetch } from '@/lib/api-client';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<ApiSuccess<HealthResponse>>('/health').then((res) => res.data),
    refetchInterval: 30_000,
    retry: false,
  });
}
