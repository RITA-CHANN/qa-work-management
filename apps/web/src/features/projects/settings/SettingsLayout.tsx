import { NavLink, Outlet } from 'react-router';
import { cn } from '@/lib/utils';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useProjectAccess } from '../access';
import { useProjectOutlet, type ProjectOutletContext } from '../project-outlet';

/** Sections that exist so far (SCR-PROJECT-06 "Sections now and later"); later phases add theirs here. */
const SECTIONS = [
  { to: '', label: 'General', end: true },
  { to: 'guests', label: 'Guests' },
  { to: 'danger-zone', label: 'Danger zone' },
];

/** SCR-PROJECT-06: section nav and the current section. Only Project admins and System admins get here. */
export function SettingsRoute() {
  const { project } = useProjectOutlet();
  if (!useProjectAccess(project).canEvenArchived('project:guests')) return <NotFoundPage />;
  return (
    <div className="grid items-start gap-5 md:grid-cols-[12rem_1fr]">
      <nav aria-label="Settings sections">
        <ul className="flex flex-wrap gap-1 md:flex-col">
          {SECTIONS.map((section) => (
            <li key={section.label}>
              <NavLink
                to={section.to}
                end={section.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-9 items-center rounded-md px-3 text-sm hover:bg-muted',
                    isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground',
                  )
                }
              >
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet context={{ project } satisfies ProjectOutletContext} />
    </div>
  );
}
