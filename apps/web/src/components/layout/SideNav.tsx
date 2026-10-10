import {
  Activity,
  CalendarRange,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router';
import type { GuestArea } from '@qawm/shared';
import { useProjectAccess } from '@/features/projects/access';
import { useProject } from '@/features/projects/api';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** Hidden for a Guest when this area is switched off (BR-GUEST-03). */
  area?: GuestArea;
  /** Only for those who manage the project. */
  adminOnly?: boolean;
  /** Another path that shows the same page, where this item is current too. */
  alsoAt?: string;
};
type NavGroup = { label: string; items: NavItem[] };

/**
 * Module groups of the redesign (BR-SHELL-01). Only screens that exist are listed; each new phase adds
 * its screens to its module here (Test management, Defects, … appear when they are built).
 */
function groupsFor(projectKey: string | null): NavGroup[] {
  const project = projectKey ? `/projects/${projectKey}` : null;
  return [
    {
      label: 'Overview',
      // The project's own URL, so the item is current on /projects/:key; "/" shows the same dashboard.
      items: [
        {
          to: project ?? '/',
          label: 'Dashboard',
          icon: LayoutDashboard,
          end: true,
          area: 'dashboard',
          alsoAt: '/',
        },
      ],
    },
    ...(project
      ? [
          {
            label: 'Project & requirements',
            items: [
              {
                to: `${project}/releases`,
                label: 'Releases & sprints',
                icon: CalendarRange,
                area: 'releases',
              },
              { to: `${project}/members`, label: 'Members', icon: Users, area: 'members' },
              { to: `${project}/activity`, label: 'Activity', icon: Activity, area: 'activity' },
              {
                to: `${project}/settings`,
                label: 'Project settings',
                icon: Settings,
                adminOnly: true,
              },
            ],
          } satisfies NavGroup,
        ]
      : []),
    {
      label: 'Workspace',
      // end: a project's own pages are not "Projects".
      items: [{ to: '/projects', label: 'Projects', icon: FolderKanban, end: true }],
    },
  ];
}

export function SideNav({ projectKey }: { projectKey: string | null }) {
  const { pathname } = useLocation();
  // Same cache entry as the project page, so this costs no extra request there.
  const project = useProject(projectKey ?? '', !!projectKey);
  const access = useProjectAccess(project.data);
  const shown = (item: NavItem) =>
    (!item.area || access.sees(item.area)) &&
    (!item.adminOnly || access.canEvenArchived('project:guests'));
  const groups = groupsFor(projectKey)
    .map((group) => ({ ...group, items: group.items.filter(shown) }))
    .filter((group) => group.items.length > 0);
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
      {groups.map((group) => (
        <div key={group.label} className="mt-4 first:mt-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ to, label, icon: Icon, end, alsoAt }) => (
              <li key={to}>
                {alsoAt === pathname ? (
                  // NavLink can't be made current on another path, so this case is a plain link.
                  <Link to={to} aria-current="page" className={itemClass(true)}>
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </Link>
                ) : (
                  // NavLink sets aria-current="page" on the active link.
                  <NavLink to={to} end={end} className={({ isActive }) => itemClass(isActive)}>
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function itemClass(current: boolean) {
  return cn(
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted',
    current && 'bg-primary-tint text-primary-tint-foreground hover:bg-primary-tint',
  );
}
