import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ActivityTab } from '@/features/projects/ActivityTab';
import { MembersTab } from '@/features/projects/MembersTab';
import { OverviewTab } from '@/features/projects/OverviewTab';
import { ProjectLayout } from '@/features/projects/ProjectLayout';
import { ProjectListPage } from '@/features/projects/ProjectListPage';
import { ReleasesTab } from '@/features/projects/ReleasesTab';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Every other page needs a logged-in user (BR-AUTH-08).
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'projects', element: <ProjectListPage /> },
          {
            // SCR-PROJECT-02..05: one URL per tab.
            path: 'projects/:key',
            element: <ProjectLayout />,
            children: [
              { index: true, element: <OverviewTab /> },
              { path: 'members', element: <MembersTab /> },
              { path: 'releases', element: <ReleasesTab /> },
              { path: 'activity', element: <ActivityTab /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
