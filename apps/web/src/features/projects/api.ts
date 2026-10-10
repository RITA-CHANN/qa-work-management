import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import type {
  ActivityActor,
  ActivityEntityType,
  ActivityEntry,
  ApiCursorPage,
  ApiSuccess,
  GuestVisibility,
  Member,
  MemberAdd,
  Milestone,
  MilestoneCreate,
  MilestoneUpdate,
  Project,
  ProjectCreate,
  MemberUpdate,
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
  activity: (key: string, limit: number, filters: ActivityFilters = {}) =>
    ['project', key.toUpperCase(), 'activity', limit, filters] as const,
  activityActors: (key: string) => ['project', key.toUpperCase(), 'activity', 'actors'] as const,
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

export function useProject(key: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.one(key),
    enabled,
    queryFn: () => apiFetch<ApiSuccess<Project>>(base(key)).then(data),
    retry: false,
  });
}

export function useMembers(key: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.members(key),
    enabled,
    queryFn: () => apiFetch<ApiSuccess<Member[]>>(`${base(key)}/members`).then(data),
  });
}

export function useReleases(key: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.releases(key),
    enabled,
    queryFn: () => apiFetch<ApiSuccess<Release[]>>(`${base(key)}/releases`).then(data),
  });
}

export function useMilestones(key: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.milestones(key),
    enabled,
    queryFn: () => apiFetch<ApiSuccess<Milestone[]>>(`${base(key)}/milestones`).then(data),
  });
}

/** Activity pages: "Load more" fetches the page after the last entry (cursor). */
/** API filters of the activity log (BR-PROJECT-38): `from` inclusive, `to` exclusive, ISO date-times. */
export type ActivityFilters = {
  entityType?: ActivityEntityType;
  actorId?: string;
  from?: string;
  to?: string;
};

export function useActivity(
  key: string,
  limit = 20,
  enabled = true,
  filters: ActivityFilters = {},
) {
  return useInfiniteQuery({
    queryKey: projectKeys.activity(key, limit, filters),
    enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      for (const [name, value] of Object.entries(filters)) if (value) params.set(name, value);
      if (pageParam) params.set('cursor', pageParam);
      return apiFetch<ApiCursorPage<ActivityEntry>>(`${base(key)}/activity?${params}`);
    },
    getNextPageParam: (page) => page.meta.nextCursor,
  });
}

/** API-PROJECT-14: the people of the Person filter. */
export function useActivityActors(key: string) {
  return useQuery({
    queryKey: projectKeys.activityActors(key),
    queryFn: () => apiFetch<ApiSuccess<ActivityActor[]>>(`${base(key)}/activity/actors`).then(data),
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

/** PUT guest-visibility (API-PROJECT-13). Refreshes the whole project, the activity log included. */
export function useGuestVisibility(key: string) {
  return useWrite(
    (body: GuestVisibility) =>
      apiSend<ApiSuccess<Project>>('PUT', `${base(key)}/guest-visibility`, body).then(data),
    [['project', key.toUpperCase()]],
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

export function useUpdateMember(key: string) {
  return useWrite(
    ({ userId, ...body }: { userId: string } & MemberUpdate) =>
      apiSend<ApiSuccess<Member>>('PATCH', `${base(key)}/members/${userId}`, body).then(data),
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
