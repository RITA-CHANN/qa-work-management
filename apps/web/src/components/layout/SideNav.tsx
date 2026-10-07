import { FolderKanban, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: LucideIcon };

// New modules add their entry here as each phase lands.
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

export function SideNav() {
  return (
    <nav aria-label="Main" className="w-56 border-r p-4">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            {/* NavLink sets aria-current="page" on the active link. */}
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
                  isActive && 'bg-accent font-medium',
                )
              }
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
