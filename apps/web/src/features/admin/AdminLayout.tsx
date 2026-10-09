import {
  ArrowLeft,
  FolderKanban,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { useMe } from '@/features/auth/use-me';
import { AccountMenu } from '@/features/shell/AccountMenu';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { cn } from '@/lib/utils';

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

/**
 * Admin UI (SCR-ADMIN-01..05): its own deep-indigo top bar and side nav (BR-ADMIN-01). A non-Admin gets
 * the normal not-found page (MSG-COMMON-13), the same as any unknown URL.
 */
export function AdminLayout() {
  const { data: user } = useMe();
  if (user?.globalRole !== 'ADMIN') return <NotFoundPage />;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-admin px-6 text-admin-foreground">
        <p className="font-bold">QA Work Management · Admin console</p>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to workspace
          </Link>
          <div className="rounded-lg bg-white text-foreground">
            <AccountMenu />
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <nav aria-label="Admin" className="w-56 shrink-0 border-r bg-card p-3">
          <ul className="flex flex-col gap-0.5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
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
        </nav>
        <main id="main-content" className="min-w-0 flex-1 px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
