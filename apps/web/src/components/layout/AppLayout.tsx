import { Outlet } from 'react-router';
import { UserMenu } from '@/features/auth/UserMenu';
import { ApiStatus } from '@/features/health/ApiStatus';
import { SideNav } from './SideNav';

/** App shell: header + navigation + main content. Landmarks make pages easy to navigate and test. */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <header className="flex h-14 items-center justify-between border-b px-6">
        <p className="font-semibold">QA Work Management</p>
        <div className="flex items-center gap-4">
          <ApiStatus />
          <UserMenu />
        </div>
      </header>
      <div className="flex flex-1">
        <SideNav />
        <main id="main-content" className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
