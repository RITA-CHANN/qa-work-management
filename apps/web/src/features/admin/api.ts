import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminOverview,
  AdminProject,
  AdminUser,
  AdminUserCreate,
  AdminUserDetail,
  ApiCursorPage,
  ApiSuccess,
  AuditEvent,
  GlobalRole,
  OneTimePassword,
  UserStatus,
} from '@qawm/shared';
import { apiFetch, apiSend } from '@/lib/api-client';

const data = <T>(response: ApiSuccess<T>) => response.data;
const qs = (params: Record<string, string | undefined | boolean>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== false) search.set(key, String(value));
  }
  return search.size ? `?${search}` : '';
};

export const adminKeys = {
  all: ['admin'] as const,
  overview: ['admin', 'overview'] as const,
  projects: (search: string, status: string) => ['admin', 'projects', { search, status }] as const,
  users: (filters: object) => ['admin', 'users', filters] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  audit: (filters: object) => ['admin', 'audit', filters] as const,
};

export function useAdminOverview() {
  return useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => apiFetch<ApiSuccess<AdminOverview>>('/admin/overview').then(data),
  });
}

export function useAdminProjects(search: string, status: 'all' | 'active' | 'archived') {
  return useQuery({
    queryKey: adminKeys.projects(search.trim(), status),
    queryFn: () =>
      apiFetch<ApiSuccess<AdminProject[]>>(
        `/admin/projects${qs({ search: search.trim(), status })}`,
      ).then(data),
  });
}

export type UserFilters = { search: string; role?: GlobalRole; status?: UserStatus };

export function useAdminUsers(filters: UserFilters) {
  const f = { ...filters, search: filters.search.trim() };
  return useQuery({
    queryKey: adminKeys.users(f),
    queryFn: () => apiFetch<ApiSuccess<AdminUser[]>>(`/admin/users${qs(f)}`).then(data),
  });
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: adminKeys.user(id ?? ''),
    queryFn: () => apiFetch<ApiSuccess<AdminUserDetail>>(`/admin/users/${id}`).then(data),
    enabled: !!id,
    retry: false,
  });
}

/** Any Admin write: refreshes everything under ['admin'] afterwards. */
function useAdminWrite<Input, Output>(write: (input: Input) => Promise<Output>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export const useCreateUser = () =>
  useAdminWrite((body: AdminUserCreate) =>
    apiSend<ApiSuccess<OneTimePassword>>('POST', '/admin/users', body).then(data),
  );

export const useChangeGlobalRole = (id: string) =>
  useAdminWrite((globalRole: GlobalRole) =>
    apiSend<ApiSuccess<AdminUser>>('PATCH', `/admin/users/${id}`, { globalRole }).then(data),
  );

export const useUserAction = (id: string) =>
  useAdminWrite((action: 'deactivate' | 'reactivate' | 'sign-out') =>
    apiSend<ApiSuccess<unknown>>('POST', `/admin/users/${id}/${action}`, {}).then(data),
  );

export const useResetPassword = (id: string) =>
  useAdminWrite(() =>
    apiSend<ApiSuccess<OneTimePassword>>('POST', `/admin/users/${id}/reset-password`, {}).then(
      data,
    ),
  );

/** Archive / restore / delete reuse the project endpoints: an Admin acts as Project admin there. */
export const useAdminProjectAction = () =>
  useAdminWrite(({ key, action }: { key: string; action: 'archive' | 'restore' | 'delete' }) =>
    action === 'delete'
      ? apiSend<null>('DELETE', `/projects/${key}`)
      : apiSend<unknown>('POST', `/projects/${key}/${action}`, {}),
  );

export type AuditFilters = {
  action?: string;
  projectKey?: string;
  from?: string;
  to?: string;
  asAdmin?: boolean;
};

export function useAudit(filters: AuditFilters) {
  return useInfiniteQuery({
    queryKey: adminKeys.audit(filters),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      apiFetch<ApiCursorPage<AuditEvent>>(
        `/admin/audit${qs({ ...filters, cursor: pageParam ?? undefined })}`,
      ),
    getNextPageParam: (page) => page.meta.nextCursor,
  });
}
