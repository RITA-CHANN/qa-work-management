---
title: Authentication
type: feature
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
updated: 2026-10-09
---

# Authentication

Technical plan: [phase-2-plan.md](../../phases/phase-2-plan.md) (how we build it). The files in this folder say
**what the business needs** and how we know it works. Test cases trace back to the IDs (US, BR, AC, MSG).

| File                           | Contains                                  |
| ------------------------------ | ----------------------------------------- |
| [stories.md](stories.md)       | User stories `US-AUTH-NN`                 |
| [rules.md](rules.md)           | Business rules `BR-AUTH-NN`               |
| [acceptance.md](acceptance.md) | Acceptance criteria `AC-AUTH-NN`          |
| [nfr.md](nfr.md)               | Non-functional requirements `NFR-AUTH-NN` |
| [messages.md](messages.md)     | Exact UI and error texts `MSG-AUTH-NN`    |

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

## Stakeholders

| Stakeholder                | What they care about                                                      |
| -------------------------- | ------------------------------------------------------------------------- |
| Team members (all roles)   | Log in quickly, stay logged in, no surprise logouts                       |
| Business owner             | Only known people get in; passwords can't be guessed or leaked            |
| QA (Linh)                  | Every rule has a criterion and a test; test data that doesn't get blocked |
| Developers of later phases | A trusted `req.user` on every request                                     |

## Actors

| Actor | Description                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| Guest | Someone who is not logged in. Can only see the login page.                                                                     |
| User  | A team member with an account (global role `USER`).                                                                            |
| Admin | A team member with global role `ADMIN`. In this phase an admin has the same screens as a user; admin-only features come later. |

Accounts are created by the seed data only. There is no sign-up in this phase.

## Assumptions and constraints

- Accounts come from the seed; the team is small and known in advance.
- One API instance, so an in-memory rate limit is enough (see DD-AUTH-01).
- The web app and the API are served from one origin, so cookies need no CORS setup.
- HTTPS in production (the cookie gets `Secure` there); plain HTTP on localhost.

## Dependencies

- PostgreSQL tables [users](../../database/tables/users.md) and [sessions](../../database/tables/sessions.md).
- Shared message catalog and schemas in `packages/shared`.
- Every later feature depends on this one for `req.user`.

## Out of scope (later phases)

- Sign-up, forgot password, change password.
- Admin screen to create, disable or delete users.
- "Remember me" option (every session lasts 7 days).
- Logging out of all devices.
- Project access levels (Project admin, Member) and job titles: Phase 3, when projects exist.
- Two-factor login, social login (Google, GitHub).

## Business risks

| Risk                                                          | Why it matters                           | Covered by                          |
| ------------------------------------------------------------- | ---------------------------------------- | ----------------------------------- |
| Someone outside the team gets in (guessed or leaked password) | Project data and bug reports are exposed | BR-AUTH-03, BR-AUTH-04, NFR-AUTH-01 |
| A session is stolen and reused                                | Someone acts as a team member            | BR-AUTH-06, BR-AUTH-15              |
| Real users get blocked by the rate limit                      | People can't work for 15 minutes         | BR-AUTH-04, AC-AUTH-12              |

## Test data

All seed users share the password `Password123!` (dev and test only). The seed user list and emails are in
`apps/api/prisma/seed/` and [users](../../database/tables/users.md#seed-data).

## Open questions

| ID        | Question                                                                                  | Default if you don't answer                        |
| --------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Q-AUTH-01 | Should the login page show how many attempts are left before the block?                   | No. It would help an attacker and it's not common. |
| Q-AUTH-02 | After the block, should the user see when they can try again ("try again in 12 minutes")? | No, a generic message only.                        |

## Change log

| Date       | Change                                                                                              | Why                                         |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 2026-10-07 | First version (was `phase-2-authentication.md`, IDs renamed `AC-11` → `AC-AUTH-11`)                 | Phase 2; new docs layout                    |
| 2026-10-07 | Added BR-AUTH-14, BR-AUTH-15, AC-AUTH-29 to AC-AUTH-32; linked the API, flow and detail design docs | Full login feature design                   |
| 2026-10-08 | Added stakeholders, assumptions, dependencies, business risks and nfr.md                            | Documentation standards (docs/STANDARDS.md) |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects             | Linh's decision 2026-10-09                  |
