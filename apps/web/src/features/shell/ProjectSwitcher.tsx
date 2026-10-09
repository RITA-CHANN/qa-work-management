import { useLocation, useNavigate } from 'react-router';
import { Menu, type MenuItem } from '@/components/ui/menu';
import { useProjects } from '@/features/projects/api';
import { useSetCurrentProject } from './api';

/**
 * Top of the side nav: the project every page shows (BR-SHELL-03). Choosing another project keeps the
 * same page when it exists for that project (Releases stays Releases), otherwise opens its dashboard.
 */
export function ProjectSwitcher({ currentKey }: { currentKey: string | null }) {
  const projects = useProjects('', true);
  const setCurrent = useSetCurrentProject();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const list = [...(projects.data ?? [])].sort(
    (a, b) => Number(!!a.archivedAt) - Number(!!b.archivedAt),
  );
  const current = list.find((p) => p.key === currentKey);

  if (projects.isSuccess && list.length === 0) return null;

  const items: MenuItem[] = list.map((project) => ({
    label: `${project.name} (${project.key})${project.archivedAt ? ' · Archived' : ''}`,
    onSelect: () => {
      setCurrent.mutate(project.key);
      const inProject = pathname.match(/^\/projects\/[^/]+(\/.*)?$/);
      if (inProject) void navigate(`/projects/${project.key}${inProject[1] ?? ''}`);
    },
  }));

  return (
    <div className="px-3 pb-3">
      <Menu
        label="Switch project"
        align="left"
        items={items}
        trigger={
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-tint font-mono text-[11px] font-bold text-primary-tint-foreground"
            >
              {(current?.key ?? '—').slice(0, 4)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {current?.name ?? 'Choose a project'}
              </span>
              {current && (
                <span className="block font-mono text-xs text-muted-foreground">{current.key}</span>
              )}
            </span>
          </span>
        }
      />
    </div>
  );
}
