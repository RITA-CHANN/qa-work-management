import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Outlet, useMatch } from 'react-router';
import { ApiStatus } from '@/features/health/ApiStatus';
import { AccountMenu } from '@/features/shell/AccountMenu';
import { useCurrentProject, useSetCurrentProject } from '@/features/shell/api';
import { CommandPalette } from '@/features/shell/CommandPalette';
import { ProjectSwitcher } from '@/features/shell/ProjectSwitcher';
import { SideNav } from './SideNav';

/**
 * App shell of the User UI (SCR-SHELL-01): side nav with the project switcher, top bar with search and
 * the account menu. Landmarks make pages easy to navigate and test.
 */
export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const routeKey = useMatch('/projects/:key/*')?.params.key?.toUpperCase() ?? null;
  const current = useCurrentProject();
  const setCurrent = useSetCurrentProject();
  const projectKey = routeKey ?? current.data ?? null;

  // Opening a project makes it the current one, for the next visit too (BR-SHELL-04).
  const { mutate: remember } = setCurrent;
  useEffect(() => {
    if (routeKey && routeKey !== current.data) remember(routeKey);
  }, [routeKey, current.data, remember]);

  // ⌘K / Ctrl+K opens search from anywhere (BR-SHELL-06).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2 px-5">
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground"
          >
            QA
          </span>
          <p className="font-bold">QA Work Management</p>
        </div>
        <ProjectSwitcher currentKey={projectKey} />
        <SideNav projectKey={projectKey} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b bg-card px-6">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <Search aria-hidden="true" className="size-4" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded border bg-card px-1.5 font-mono text-[11px]">⌘K</kbd>
          </button>
          <div className="flex items-center gap-4">
            <ApiStatus />
            <AccountMenu />
          </div>
        </header>
        <main id="main-content" className="flex-1 px-8 py-7">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
