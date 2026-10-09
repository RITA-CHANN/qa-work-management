import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import type {
  ActivityEntry,
  ApiCursorPage,
  ApiSuccess,
  Member,
  MemberAdd,
  Milestone,
  MilestoneCreate,
  MilestoneUpdate,
  Project,
  ProjectCreate,
  ProjectRole,
  ProjectSummary,
  ProjectUpdate,
  Release,
  ReleaseCreate,
  ReleaseUpdate,
  UserOption,
} from '@qawm/shared';
import { apiFetch, apiSend } from '@/lib/api-client';

/** Query keys. Everything of one project starts with ['project', KEY], so one invalidation refreshes it all. */
export const projectKeys = {
  list: (search: string, archived: boolean) => ['projects', { search, archived }] as const,
  all: ['projects'] as const,
  one: (key: string) => ['project', key.toUpperCase()] as const,
  members: (key: string) => ['project', key.toUpperCase(), 'members'] as const,
  releases: (key: string) => ['project', key.toUpperCase(), 'releases'] as const,
  milestones: (key: string) => ['project', key.toUpperCase(), 'milestones'] as const,
  activity: (key: string, limit: number) =>
    ['project', key.toUpperCase(), 'activity', limit] as const,
};

const base = (key: string) => `/projects/${encodeURIComponent(key)}`;
const data = <T>(response: ApiSuccess<T>) => response.data;

export function useProjects(search: string, archived: boolean) {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (archived) params.set('archived', 'true');
  const query = params.size ? `?${params}` : '';
  return useQuery({
    queryKey: projectKeys.list(search.trim(), archived),
    queryFn: () => apiFetch<ApiSuccess<ProjectSummary[]>>(`/projects${query}`).then(data),
  });
}

export function useProject(key: string) {
  return useQuery({
    queryKey: projectKeys.one(key),
    queryFn: () => apiFetch<ApiSuccess<Project>>(base(key)).then(data),
    retry: false,
  });
}

export function useMembers(key: string) {
  return useQuery({
    queryKey: projectKeys.members(key),
    queryFn: () => apiFetch<ApiSuccess<Member[]>>(`${base(key)}/members`).then(data),
  });
}

export function useReleases(key: string) {
  return useQuery({
    queryKey: projectKeys.releases(key),
    queryFn: () => apiFetch<ApiSuccess<Release[]>>(`${base(key)}/releases`).then(data),
  });
}

export function useMilestones(key: string) {
  return useQuery({
    queryKey: projectKeys.milestones(key),
    queryFn: () => apiFetch<ApiSuccess<Milestone[]>>(`${base(key)}/milestones`).then(data),
  });
}

/** Activity pages: "Load more" fetches the page after the last entry (cursor). */
export function useActivity(key: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: projectKeys.activity(key, limit),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      apiFetch<ApiCursorPage<ActivityEntry>>(
        `${base(key)}/activity?limit=${limit}${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    getNextPageParam: (page) => page.meta.nextCursor,
  });
}

export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<ApiSuccess<UserOption[]>>('/users?limit=50').then(data),
    enabled,
  });
}

/** A mutation that refreshes the given queries when it succeeds. */
function useWrite<Input, Output>(write: (input: Input) => Promise<Output>, refresh: QueryKey[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: async () => {
      await Promise.all(refresh.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}

export function useCreateProject() {
  return useWrite(
    (body: ProjectCreate) => apiSend<ApiSuccess<Project>>('POST', '/projects', body).then(data),
    [projectKeys.all],
  );
}

export function useUpdateProject(key: string) {
  return useWrite(
    (body: ProjectUpdate) => apiSend<ApiSuccess<Project>>('PATCH', base(key), body).then(data),
    [projectKeys.one(key), projectKeys.all],
  );
}

export function useProjectAction(key: string, action: 'archive' | 'restore') {
  return useWrite(
    () => apiSend<ApiSuccess<Project>>('POST', `${base(key)}/${action}`, {}).then(data),
    [projectKeys.one(key), projectKeys.all],
  );
}

export function useDeleteProject(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiSend<null>('DELETE', base(key)),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: projectKeys.one(key) });
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useAddMember(key: string) {
  return useWrite(
    (body: MemberAdd) =>
      apiSend<ApiSuccess<Member>>('POST', `${base(key)}/members`, body).then(data),
    [projectKeys.one(key)],
  );
}

export function useChangeRole(key: string) {
  return useWrite(
    ({ userId, role }: { userId: string; role: ProjectRole }) =>
      apiSend<ApiSuccess<Member>>('PATCH', `${base(key)}/members/${userId}`, { role }).then(data),
    [projectKeys.one(key)],
  );
}

export function useRemoveMember(key: string) {
  return useWrite(
    (userId: string) => apiSend<null>('DELETE', `${base(key)}/members/${userId}`),
    [projectKeys.one(key), projectKeys.all],
  );
}

export function useSaveRelease(key: string) {
  return useWrite(
    ({ id, body }: { id?: string; body: ReleaseCreate | ReleaseUpdate }) =>
      (id
        ? apiSend<ApiSuccess<Release>>('PATCH', `${base(key)}/releases/${id}`, body)
        : apiSend<ApiSuccess<Release>>('POST', `${base(key)}/releases`, body)
      ).then(data),
    [projectKeys.one(key), projectKeys.all],
  );
}

export function useDeleteRelease(key: string) {
  return useWrite(
    (id: string) => apiSend<null>('DELETE', `${base(key)}/releases/${id}`),
    [projectKeys.one(key)],
  );
}

export function useSaveMilestone(key: string) {
  return useWrite(
    ({ id, body }: { id?: string; body: MilestoneCreate | MilestoneUpdate }) =>
      (id
        ? apiSend<ApiSuccess<Milestone>>('PATCH', `${base(key)}/milestones/${id}`, body)
        : apiSend<ApiSuccess<Milestone>>('POST', `${base(key)}/milestones`, body)
      ).then(data),
    [projectKeys.one(key)],
  );
}

export function useDeleteMilestone(key: string) {
  return useWrite(
    (id: string) => apiSend<null>('DELETE', `${base(key)}/milestones/${id}`),
    [projectKeys.one(key)],
  );
}
