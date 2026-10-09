import {
  Activity,
  CalendarRange,
  FolderKanban,
  LayoutDashboard,
  Info,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };
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
      items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
    },
    ...(project
      ? [
          {
            label: 'Project & requirements',
            items: [
              { to: project, label: 'Project overview', icon: Info, end: true },
              { to: `${project}/releases`, label: 'Releases & sprints', icon: CalendarRange },
              { to: `${project}/members`, label: 'Members', icon: Users },
              { to: `${project}/activity`, label: 'Activity', icon: Activity },
            ],
          },
        ]
      : []),
    { label: 'Workspace', items: [{ to: '/projects', label: 'Projects', icon: FolderKanban }] },
  ];
}

export function SideNav({ projectKey }: { projectKey: string | null }) {
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
      {groupsFor(projectKey).map((group) => (
        <div key={group.label} className="mt-4 first:mt-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                {/* NavLink sets aria-current="page" on the active link. */}
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted',
                      isActive &&
                        'bg-primary-tint text-primary-tint-foreground hover:bg-primary-tint',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
