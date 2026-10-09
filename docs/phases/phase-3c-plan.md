# Phase 3C Plan: UI foundation and Admin console

Status: **Requirements in review** · 2026-10-09
Business requirements: [shell](../requirements/shell/README.md), [dash](../requirements/dash/README.md),
[admin](../requirements/admin/README.md) and [guest](../requirements/guest/README.md) (what and why, with the
US / BR / AC / MSG IDs; decisions Q-ADMIN-01 to Q-ADMIN-05). This file says **how** we build it.

## 1. Starting point

- **Stacked on PR #13** (Phase 3A: projects, members, releases, milestones, activity). This branch starts from PR #13
  and is rebased onto `main` once #13 merges.
- **Role model v2 is done in PR #13**: System admin (global `ADMIN`), per-project access level Project admin /
  Member, and an optional job title (`QAE`, `QAL`, `PM`, …). 3C only adds the **Guest** access level.
- 3A pages use a plain layout with tabs (Overview · Members · Releases & milestones · Activity); the web app has the
  shadcn components added in 3A.

## 2. Scope

| In 3C                                                                                                                      | Later                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Design tokens (colour, type, radius, spacing) and KpiCard, ProgressBar, StatusBadge, DataTable, EmptyState, CommandPalette | Dark theme (same tokens)                                                                 |
| New shell for every existing page; login page unchanged                                                                    | Notifications centre, AI assistant panel (Phase 8+)                                      |
| Project dashboard v1 with 3A data (replaces the Overview tab, Q-ADMIN-04)                                                  | Test, defect and coverage widgets (Phases 4–7)                                           |
| ⌘K search over projects, releases, sprints and (Admins) users                                                              | Search over requirements, test cases, bugs                                               |
| Admin console: dashboard, Projects (incl. "New project"), Users, Audit log, Settings (Guest default, retention)            | Roles editor, Security, Cost, AI provider, Integrations (hidden until built, Q-ADMIN-03) |
| Guest access level and per-project Guest visibility                                                                        | Per-Guest overrides                                                                      |
| Comment / Attachment / Link tables: **moved to 3B** (Q-ADMIN-02)                                                           | Invitations by email, teams, SSO                                                         |

## 3. Order of work

One code PR, built in commits per area so the review stays readable:

1. **Shell and tokens.** CSS tokens (light indigo v2.1) in `apps/web/src/index.css`, shared components, new
   `AppShell` (side nav by module, project switcher, account menu, top bar without a generic Create button),
   ⌘K `CommandPalette` with `GET /api/search?q=` (same access checks as the list endpoints). Every existing page
   moves into the shell; changed accessible names are collected for the PR description (BR-SHELL-08).
2. **Admin backend.** `requireAdmin` guard that answers **404** for non-Admins on `/api/admin/*` (BR-ADMIN-01);
   users admin (`GET/POST /api/admin/users`, `PATCH …/:id` role and status, `POST …/:id/reset-password`,
   `POST …/:id/sign-out-everywhere`); `audit_events` with one `recordAudit(tx, …)` helper called in the same
   transaction as the change (BR-ADMIN-16); sign-in, sign-out and failed sign-in events from the auth module;
   first-sign-in password change; `POST /api/projects` restricted to Admins with a required first Project admin
   (BR-ADMIN-18); change project admin in one transaction (BR-ADMIN-04).
3. **Admin UI.** `/admin` layout (deep indigo top bar, own side nav, "Back to workspace"), all-projects dashboard,
   Projects, Users (create dialog that shows the one-time password once), Audit log with filters and 50-per-page
   cursor pagination, Settings. "Viewing as Admin" banner in the User UI (BR-ADMIN-05).
4. **Project dashboard.** `GET /api/projects/:key/dashboard` returning the card data in one call (release, sprint,
   deadlines in 14 days, team counts by access level and job title, 10 newest activity entries); `/projects/:key`
   renders it; project details move to Settings.
5. **Guest visibility.** `GUEST` access level, `project_guest_visibility` table and system default; one
   `assertArea(user, project, area)` check used by every project route (404 when off, BR-GUEST-03), by search and by
   the dashboard; Guests get 403 on every write (BR-GUEST-04); member lists drop emails and other Guests for a
   Guest (BR-GUEST-05); Project settings › Guests page.

## 4. Data changes

One migration (requirements: [admin README](../requirements/admin/README.md), phase 3C business requirements §8):

| Table                       | Change                                                                                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project_members`           | `access` enum gets `GUEST`                                                                                                                                                                                                                                 |
| `project_guest_visibility`  | **new**: project_id, area, visible; unique(project_id, area). A system default setting is copied into it when a project is created                                                                                                                         |
| `users`                     | add `status` (ACTIVE / DEACTIVATED), `must_change_password`, `last_sign_in_at`, `last_project_id`                                                                                                                                                          |
| `audit_events`              | **new**: id, at, actor_id (null for failed sign-in), action, target_type, target_id, project_id (null), before jsonb, after jsonb, acted_as, ip. Generic by target type so later modules reuse it; append-only, cleaned after `AUDIT_RETENTION_DAYS` (365) |
| Comment / Attachment / Link | **not** in 3C; built in 3B where comments are first used (Q-ADMIN-02)                                                                                                                                                                                      |

Seed: Sam Stakeholder becomes a Guest of SHOP (default switches); add **Hoa Inactive** `inactive@qawm.test`
(Deactivated); a few audit entries (sign-ins, one failed sign-in, one Admin action on SECRET). Ada Admin stays the
only Admin.

## 5. Architecture decisions

| Decision                                                                    | Reason                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `/admin` and `/api/admin/*` answer **404** to non-Admins, not 403           | Same idea as ADR-0008: don't reveal what exists                                             |
| Audit entry in the same transaction as the change, through one helper       | The log can't drift from the data (BR-ADMIN-16), same pattern as `recordActivity`           |
| Account status and global role read from the database on every request      | Deactivation and role changes apply on the next request; deactivation also deletes sessions |
| Guest visibility checked on the server per route, not only hidden in the UI | An area that is off must return 404 through the API too (BR-GUEST-03)                       |
| Dashboard data from one endpoint                                            | One request per page load; easy to test with the API                                        |
| Tokens as CSS variables, components read only tokens                        | Dark theme later is a token change only                                                     |

## 6. Risks

| Risk                                                                        | Mitigation                                                                                                     |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| PR #13 changes again before it merges                                       | 3C is stacked on it and rebased after the merge; role model v2 is not touched here                             |
| The new shell breaks Linh's existing Playwright tests                       | Keep accessible names (BR-SHELL-08); list every changed one with old → new locator in the PR (Q-ADMIN-04)      |
| A Guest reaches an area that is off through some route                      | One `assertArea` helper; unit test over every route × area; Linh's API tests cover a sample                    |
| An admin action is not audited, or a password lands in the audit log        | `recordAudit` is the only writer; unit tests per action; the failed sign-in stores the email only              |
| The last Admin or last Project admin is removed by a race                   | Checks run inside the transaction with a row lock (AC-ADMIN-21)                                                |
| `POST /api/projects` now 403 for Users breaks 3A tests that create projects | Tests create projects as Ada Admin (API) and pass the first Project admin; listed in the PR                    |
| Phase too big for one review                                                | Commits per area in the order of section 3; the dashboard and Guest parts can split into a second PR if needed |

## 7. How I'll verify before handing over

- Migration on a clean DB; seed runs twice without errors.
- Unit tests (guards, Guest areas × routes, last-Admin and last-Project-admin rules, audit writer), typecheck, lint,
  format, `docs:check`, axe on every page (AC-SHELL-06).
- By hand: `/admin` as Linh (404), create user → first sign-in, deactivate with two browsers, Guest Sam with default
  switches, ⌘K as Linh never shows SECRET.

## 8. Changed locators for existing tests

The Phase 3C code PR moves every page into the new app shell ([SCR-SHELL-01](../design/basic/screens/SCR-SHELL-01-app-shell.md)).
Accessible names that Linh's Playwright tests use and that changed (BR-SHELL-08, AC-SHELL-08):

| Where                   | Before (Phase 2 / 3A)                                     | Now (Phase 3C)                                                                                                                                                                                                                                                            |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Log out                 | `getByRole('button', { name: 'Log out' })` in the header  | The account menu replaces the header name and the "Log out" button: click `getByRole('button', { name: 'Account: Linh QA' })`, then `getByRole('menuitem', { name: 'Log out' })`                                                                                          |
| Signed-in user's name   | `getByText('Linh QA')`                                    | No longer unique: the dashboard's recent activity shows names too. Use `getByRole('button', { name: 'Account: Linh QA' })`                                                                                                                                                |
| `/`                     | Placeholder dashboard ("Nothing to show yet")             | The current project's dashboard ([SCR-DASH-01](../design/basic/screens/SCR-DASH-01-project-dashboard.md)). `<h1>` still "Dashboard", page title still "Dashboard · QA Work Management". After a fresh seed Linh's current project is MOBI (first of her projects by name) |
| Side nav                | `navigation` "Main" with links "Dashboard" and "Projects" | Still `navigation` "Main" with "Dashboard" and "Projects", plus "Project overview", "Releases & sprints", "Members" and "Activity" when a project is current                                                                                                              |
| Project page tab links  | `page.getByRole('link', { name: 'Members' })` was unique  | "Members" and "Activity" now also exist in the side nav, and "Overview" matches "Project overview" as a substring: scope to `getByRole('navigation', { name: 'Project sections' })`                                                                                       |
| Admin console           | (none)                                                    | Account menu item "Admin console" for Ada only; `/admin` for anyone else shows "Page not found"                                                                                                                                                                           |
| One-time password users | (none)                                                    | Every page redirects to `/change-password` ([SCR-AUTH-03](../design/basic/screens/SCR-AUTH-03-set-new-password.md)) until the password is changed                                                                                                                         |

API tests: the login and `GET /api/auth/me` bodies gain `mustChangePassword` (false for every seed user). A test that
compares the whole body with `toEqual` needs the new field.

## 9. Not done yet in the Phase 3C code PR

These wait for the role model change in PR #13 (role model v2: Project admin / Member, job titles), or follow in
a second 3C PR:

| Not built yet                                                                                                                               | Requirements                             |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Guest access level and the per-project Guest visibility settings                                                                            | [guest](../requirements/guest/README.md) |
| Project settings page; moving project details from Overview to Settings, dashboard on `/projects/:key`                                      | Q-ADMIN-04, BR-DASH-01, AC-DASH-04       |
| Project creation by System admins only, with a first Project admin ("New project" in Admin › Projects; `POST /api/projects` 403 for others) | BR-ADMIN-18, AC-ADMIN-12, AC-ADMIN-13    |
| "Change project admin"                                                                                                                      | BR-ADMIN-04, AC-ADMIN-09                 |
| "You are viewing this project as Admin" banner                                                                                              | BR-ADMIN-05, AC-ADMIN-03                 |
| Admin console › Settings and audit retention clean-up (365 days)                                                                            | BR-ADMIN-17, AC-ADMIN-19                 |
| `GET /api/projects/:key/dashboard` (the dashboard reads the existing endpoints instead)                                                     | Section 3 step 4                         |

Until role model v2 lands, "Project admin" in the Admin console (Project admins column, BR-ADMIN-11 check) means a
member with role `OWNER` (`apps/api/src/modules/admin/project-admins.ts`).
