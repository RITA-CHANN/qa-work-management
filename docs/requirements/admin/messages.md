---
title: Admin console messages
type: messages
feature: admin
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-10
---

# Admin console messages

Code: `packages/shared/src/messages.ts`, used as `msg('MSG-ADMIN-05', { name, projects })`. `npm run docs:check`
fails if the text below and the code differ. Tests should assert these exact texts. Shared texts (403, 404,
validation): [../common/messages.md](../common/messages.md). `{name}` and similar are filled in at run time.

| ID           | Where                                                | Kind    | Shown as | Message                                                                          |
| ------------ | ---------------------------------------------------- | ------- | -------- | -------------------------------------------------------------------------------- |
| MSG-ADMIN-01 | Create user: email already used (409)                | error   | field    | An account with this email already exists                                        |
| MSG-ADMIN-02 | One-time password shown (create, reset)              | warning | status   | Copy this password now. It will not be shown again.                              |
| MSG-ADMIN-03 | Last active Admin (422)                              | error   | alert    | There must be at least one active Admin                                          |
| MSG-ADMIN-04 | Change own role or status (422)                      | error   | alert    | You cannot change your own role or status                                        |
| MSG-ADMIN-05 | Deactivate the last Project admin of a project (422) | error   | alert    | {name} is the only project admin of {projects}. Set another project admin first. |
| MSG-ADMIN-06 | Sign-in of a deactivated account                     | error   | alert    | This account is deactivated. Contact an administrator.                           |
| MSG-ADMIN-07 | First sign-in with a one-time password               | info    | page     | Set a new password to continue                                                   |
| MSG-ADMIN-08 | Banner on a project the Admin is not a member of     | info    | status   | You are viewing this project as Admin                                            |
| MSG-ADMIN-09 | Create project without being System admin (403)      | error   | api      | Only a system administrator can create projects                                  |
| MSG-ADMIN-10 | Projects list empty for a user                       | info    | status   | You are not in any project yet. Ask an administrator to add you.                 |
| MSG-ADMIN-11 | Create user: name empty or wrong length              | error   | field    | Name must be 2–100 characters                                                    |
| MSG-ADMIN-12 | Set new password: wrong length                       | error   | field    | Password must be 8–200 characters                                                |
| MSG-ADMIN-13 | Set new password: confirmation differs               | error   | field    | Passwords do not match                                                           |
| MSG-ADMIN-14 | Set new password: same as the one-time password      | error   | field    | Choose a password different from the one-time password                           |
| MSG-ADMIN-15 | Toast after the new password is saved                | success | toast    | Password changed                                                                 |
| MSG-ADMIN-16 | Admin users API: unknown user id (404)               | error   | api      | User not found                                                                   |
| MSG-ADMIN-17 | Change project admin: user unknown or deactivated    | error   | field    | Choose an active user as project admin                                           |
| MSG-ADMIN-18 | Settings: audit retention out of range               | error   | field    | Enter a number of days from 30 to 3650                                           |
| MSG-ADMIN-19 | Toast after the workspace settings are saved         | success | toast    | Settings saved                                                                   |
| MSG-ADMIN-20 | Admin projects: the workspace has no project         | info    | status   | No projects in this workspace yet                                                |
| MSG-ADMIN-21 | Change project admin: the chosen user already is one | info    | field    | {name} is already a project admin. Tick the box to make the others members.      |

`Kind`: error, warning, info, success. `Shown as`: field, alert, status, toast, page, api (API response only).

MSG-ADMIN-10 replaces MSG-PROJECT-21 on the projects list, because users can no longer create projects
(BR-ADMIN-18).

## Change log

| Date       | Change                                                                                    | Why                        |
| ---------- | ----------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3                               | Phase 3C                   |
| 2026-10-09 | Added MSG-ADMIN-11 to MSG-ADMIN-16 (field validation, password change, unknown user)      | Texts the 3C code needs    |
| 2026-10-09 | Added MSG-ADMIN-17 to MSG-ADMIN-19 (change project admin, workspace settings)             | Texts the 3C code needs    |
| 2026-10-10 | Added MSG-ADMIN-20 (empty workspace) and MSG-ADMIN-21 (chosen user already Project admin) | SCR-ADMIN-02 review C4, C6 |
