---
title: Admin console business rules
type: rules
feature: admin
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Admin console business rules

One rule per row, and one testable statement per rule (ISO/IEC/IEEE 29148: singular, unambiguous, verifiable).
"Admin" means System admin (global role `ADMIN`).

## Console and projects

| ID          | Rule                                                                                                                                                                                                                                                                                                                                  | Source                                   | Status   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------- |
| BR-ADMIN-01 | The Admin console lives under `/admin` with its own top bar (deep indigo), side nav and a "Back to workspace" link. For a non-Admin every `/admin` page and `/api/admin/*` endpoint behaves as if it does not exist (404).                                                                                                            | Linh comment "UI rieng cho 2 role"       | proposed |
| BR-ADMIN-02 | **All-projects dashboard** shows, per project: key, name, status, members, active release and its days to target, current sprint, last activity date. KPIs: active projects, archived projects, active users / total users, Admins, failed sign-ins in the last 7 days.                                                               | Linh comment (all projects = Admin only) | proposed |
| BR-ADMIN-03 | **Projects** lists every project (archived included) with search and a status filter, and a "New project" button (BR-ADMIN-18). Actions per row: Open, Archive / Restore, Delete (archived only, BR-PROJECT-09 applies), Change project admin.                                                                                        | Linh request (1)                         | proposed |
| BR-ADMIN-18 | Only a System admin can **create a project**, from Admin console › Projects › "New project": key, name, description and the first Project admin (an active user, required). The System admin is not added as a member. The User UI has no "New project" button and `POST /api/projects` returns 403 for everyone else (MSG-ADMIN-09). | Linh 2026-10-09 (role model v2)          | proposed |
| BR-ADMIN-04 | **Change project admin** makes a chosen user Project admin (adding them as a member if needed) and, if chosen, turns the current Project admin(s) into Members, in one step. A project always keeps at least one Project admin.                                                                                                       | Linh request (1), role model v2          | proposed |
| BR-ADMIN-05 | When an Admin opens a project they are **not a member of** (User UI), a banner "You are viewing this project as Admin" (MSG-ADMIN-08) stays visible on every page of that project.                                                                                                                                                    | Redesign proposal §8                     | proposed |

## Users

| ID          | Rule                                                                                                                                                                                                                                          | Source                         | Status   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------- |
| BR-ADMIN-06 | **Users** lists all accounts with name, email, global role, status (Active / Deactivated), projects count, last sign-in, with search and filters by role and status.                                                                          | Redesign proposal §8           | proposed |
| BR-ADMIN-07 | An Admin can **create** a user: name (2–100 chars), email (valid, unique, stored lower case, BR-AUTH-01), global role. The system shows a one-time password **once** (MSG-ADMIN-02); the user must change it at first sign-in (MSG-ADMIN-07). | Q-ADMIN-01 default             | proposed |
| BR-ADMIN-08 | An Admin can change a user's **global role** (Admin / User). The change applies on the user's next request.                                                                                                                                   | Redesign proposal §8           | proposed |
| BR-ADMIN-09 | There is always **at least one active Admin**. Demoting or deactivating the last active Admin is refused (MSG-ADMIN-03). An Admin cannot demote or deactivate **themselves** (MSG-ADMIN-04).                                                  | Redesign proposal §8           | proposed |
| BR-ADMIN-10 | **Deactivate** blocks sign-in (MSG-ADMIN-06) and ends all the user's sessions at once. Their memberships and history stay. **Reactivate** lets them sign in again. Accounts are never deleted (history keeps their name).                     | Redesign proposal §8           | proposed |
| BR-ADMIN-11 | A deactivated user cannot be the **last Project admin** of an active project: deactivating them is refused until another Project admin is set (MSG-ADMIN-05).                                                                                 | Phase 3C business requirements | proposed |
| BR-ADMIN-12 | **Reset password** issues a new one-time password (shown once), ends all the user's sessions, and forces a change at next sign-in.                                                                                                            | Redesign proposal §8           | proposed |
| BR-ADMIN-13 | **Sign out everywhere** ends all sessions of a user.                                                                                                                                                                                          | Redesign proposal §8           | proposed |

## Audit log

| ID          | Rule                                                                                                                                                                                                                                                                                                                  | Source                         | Status   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------- |
| BR-ADMIN-14 | **Audit log** records: sign-in success, sign-in failure (email tried, no password), sign-out; user created, role changed, deactivated, reactivated, password reset, signed out everywhere; and every write an Admin makes on a project they are not a member of, marked `actedAs = ADMIN`.                            | Redesign proposal §8 rule 3    | proposed |
| BR-ADMIN-15 | Each audit entry has time, actor (or "unknown" for a failed sign-in), action, target, project (if any), before → after values for changes, and IP address. Entries can't be edited or deleted; they are newest first, 50 per page, filterable by actor, action, project, date range and "only actions made as Admin". | Redesign proposal §8 rule 3    | proposed |
| BR-ADMIN-16 | A change and its audit entry are saved **together**; if one fails neither is saved (same as BR-PROJECT-22).                                                                                                                                                                                                           | Phase 3C business requirements | proposed |
| BR-ADMIN-17 | Audit entries are kept for 365 days (a setting).                                                                                                                                                                                                                                                                      | Q-ADMIN-05 default             | proposed |

## Change log

| Date       | Change                                                                                                                      | Why      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 (BR-ADMIN-18 added in v1.2: only System admins create projects) | Phase 3C |
