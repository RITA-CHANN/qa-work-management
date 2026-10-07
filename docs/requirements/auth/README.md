---
title: Authentication
type: feature
feature: auth
status: review
phase: 2
updated: 2026-10-07
---

# Authentication

Technical plan: [phase-2-plan.md](../../phases/phase-2-plan.md) (how we build it). The files in this folder say
**what the business needs** and how we know it works. Test cases trace back to the IDs (US, BR, AC, MSG).

| File                           | Contains                               |
| ------------------------------ | -------------------------------------- |
| [stories.md](stories.md)       | User stories `US-AUTH-NN`              |
| [rules.md](rules.md)           | Business rules `BR-AUTH-NN`            |
| [acceptance.md](acceptance.md) | Acceptance criteria `AC-AUTH-NN`       |
| [messages.md](messages.md)     | Exact UI and error texts `MSG-AUTH-NN` |

## Design and API

| Layer         | Docs                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screens       | [SCR-AUTH-01 Login](../../design/basic/screens/SCR-AUTH-01-login.md), [SCR-AUTH-02 Header user menu](../../design/basic/screens/SCR-AUTH-02-user-menu.md)                                                                                               |
| Flows         | [FLW-AUTH-01 Login and redirect](../../design/basic/flows/FLW-AUTH-01-login-redirect.md), [FLW-AUTH-02 Logout and session end](../../design/basic/flows/FLW-AUTH-02-logout-session-end.md)                                                              |
| API           | [API-AUTH-01 Log in](../../api/auth/post-login.md), [API-AUTH-02 Log out](../../api/auth/post-logout.md), [API-AUTH-03 Current user](../../api/auth/get-me.md)                                                                                          |
| Detail design | [DD-AUTH-01 Sessions and rate limit](../../design/detail/logic/DD-AUTH-01-session.md), [DD-AUTH-02 API guards](../../design/detail/logic/DD-AUTH-02-api-guards.md), [DD-AUTH-03 Web auth state](../../design/detail/logic/DD-AUTH-03-web-auth-state.md) |
| Data          | [users](../../database/tables/users.md) (`password_hash`), [sessions](../../database/tables/sessions.md)                                                                                                                                                |
| Decisions     | [ADR-0006 Server-side sessions](../../decisions/ADR-0006-server-side-sessions.md), [ADR-0007 Password hashing](../../decisions/ADR-0007-password-hashing.md)                                                                                            |

## Goal

Only known team members can use QA Work Management. Every later feature (projects, bugs, activity log, permissions)
needs to know **who** is acting, so this feature gives the system an identity for every request.

## Actors

| Actor | Description                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| Guest | Someone who is not logged in. Can only see the login page.                                                                     |
| User  | A team member with an account (global role `USER`).                                                                            |
| Admin | A team member with global role `ADMIN`. In this phase an admin has the same screens as a user; admin-only features come later. |

Accounts are created by the seed data only. There is no sign-up in this phase.

## Out of scope (later phases)

- Sign-up, forgot password, change password.
- Admin screen to create, disable or delete users.
- "Remember me" option (every session lasts 7 days).
- Logging out of all devices.
- Project roles (OWNER, QA_LEAD, …): Phase 3, when projects exist.
- Two-factor login, social login (Google, GitHub).

## Test data

All seed users share the password `Password123!` (dev and test only). The seed user list and emails are in
`apps/api/prisma/seed/` and [users](../../database/tables/users.md#seed-data).

## Open questions

| ID        | Question                                                                                  | Default if you don't answer                        |
| --------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Q-AUTH-01 | Should the login page show how many attempts are left before the block?                   | No. It would help an attacker and it's not common. |
| Q-AUTH-02 | After the block, should the user see when they can try again ("try again in 12 minutes")? | No, a generic message only.                        |

## Change log

| Date       | Change                                                                                              | Why                       |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| 2026-10-07 | First version (was `phase-2-authentication.md`, IDs renamed `AC-11` → `AC-AUTH-11`)                 | Phase 2; new docs layout  |
| 2026-10-07 | Added BR-AUTH-14, BR-AUTH-15, AC-AUTH-29 to AC-AUTH-32; linked the API, flow and detail design docs | Full login feature design |
