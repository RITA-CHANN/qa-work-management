import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminAuditPage } from '@/features/admin/AdminAuditPage';
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage';
import { AdminLayout } from '@/features/admin/AdminLayout';
import { AdminProjectsPage } from '@/features/admin/AdminProjectsPage';
import { AdminSettingsPage } from '@/features/admin/AdminSettingsPage';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ActivityTab } from '@/features/projects/ActivityTab';
import { MembersTab } from '@/features/projects/MembersTab';
import { AreaRoute } from '@/features/projects/AreaRoute';
import { DashboardTab } from '@/features/projects/DashboardTab';
import { ProjectLayout } from '@/features/projects/ProjectLayout';
import { ProjectListPage } from '@/features/projects/ProjectListPage';
import { ReleasesTab } from '@/features/projects/ReleasesTab';
import { DangerZoneSettings } from '@/features/projects/settings/DangerZoneSettings';
import { GeneralSettings } from '@/features/projects/settings/GeneralSettings';
import { GuestSettings } from '@/features/projects/settings/GuestSettings';
import { SettingsRoute } from '@/features/projects/settings/SettingsLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Every other page needs a logged-in user (BR-AUTH-08).
    element: <RequireAuth />,
    children: [
      { path: 'change-password', element: <ChangePasswordPage /> },
      {
        // Admin UI (BR-ADMIN-01): its own layout; non-Admins get the not-found page (MSG-COMMON-13).
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'projects', element: <AdminProjectsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'audit', element: <AdminAuditPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'projects', element: <ProjectListPage /> },
          {
            // SCR-PROJECT-02..06: one URL per tab. A Guest gets "not found" for areas switched off.
            path: 'projects/:key',
            element: <ProjectLayout />,
            children: [
              {
                index: true,
                element: (
                  <AreaRoute area="dashboard">
                    <DashboardTab />
                  </AreaRoute>
                ),
              },
              {
                path: 'members',
                element: (
                  <AreaRoute area="members">
                    <MembersTab />
                  </AreaRoute>
                ),
              },
              {
                path: 'releases',
                element: (
                  <AreaRoute area="releases">
                    <ReleasesTab />
                  </AreaRoute>
                ),
              },
              {
                path: 'activity',
                element: (
                  <AreaRoute area="activity">
                    <ActivityTab />
                  </AreaRoute>
                ),
              },
              {
                // SCR-PROJECT-06: one URL per section; an unknown section is "not found".
                path: 'settings',
                element: <SettingsRoute />,
                children: [
                  { index: true, element: <GeneralSettings /> },
                  { path: 'guests', element: <GuestSettings /> },
                  { path: 'danger-zone', element: <DangerZoneSettings /> },
                  { path: '*', element: <NotFoundPage /> },
                ],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
