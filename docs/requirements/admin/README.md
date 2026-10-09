---
title: Admin console
type: feature
feature: admin
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Admin console

Business requirements for the Admin console of Phase **3C** (Admin UI, `/admin`, mockups A1–A4): all-projects
dashboard, Projects, Users and Audit log (ISO/IEC/IEEE 29148: business and stakeholder requirements). Technical
plan: [phase-3c-plan.md](../../phases/phase-3c-plan.md). This README also holds the [decisions](#decisions) for the
whole of Phase 3C ([shell](../shell/README.md), [dash](../dash/README.md), [guest](../guest/README.md)).

| File                           | Contains                                |
| ------------------------------ | --------------------------------------- |
| [stories.md](stories.md)       | User stories `US-ADMIN-NN`              |
| [rules.md](rules.md)           | Business rules `BR-ADMIN-NN`            |
| [acceptance.md](acceptance.md) | Acceptance criteria `AC-ADMIN-NN`       |
| [messages.md](messages.md)     | Exact UI and error texts `MSG-ADMIN-NN` |

## Goal

Give System admins one place, clearly apart from daily project work, to see every project, create projects and
pick their first Project admin, control who can use the system (accounts, global role, deactivation, passwords,
sessions) and check who did what (audit log).

## Stakeholders

| Stakeholder                     | What they care about                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| System admin                    | Manage every project and account without being a member; see which project needs help   |
| Business owner                  | Only known, active people get in; every admin action is traceable                       |
| Project admins                  | Their project always keeps a Project admin; admin help is visible (banner)              |
| Users                           | No admin screens or text in their workspace; a deactivated account really stops working |
| QA (Linh) as tester of this app | Seed covers a deactivated user, failed sign-ins and an admin action on SECRET           |

## Actors

| Actor         | Description                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Admin         | System admin, global role `ADMIN`. Uses the Admin console and the User UI of every project (acts as Project admin, BR-PROJECT-36). |
| User          | Global role `USER`. For them the Admin console does not exist (404, BR-ADMIN-01).                                                  |
| Project admin | Manages one project in the User UI; cannot create projects (BR-ADMIN-18).                                                          |

## Assumptions and constraints

- Starts after PR #13 (Phase 3A, role model v2) merges; global roles stay `ADMIN` / `USER`.
- No email sending yet: accounts get a one-time password that the Admin passes on (Q-ADMIN-01).
- Accounts are never deleted; history keeps their name (BR-ADMIN-10).
- Global role and account status are read from the database on every request, so changes apply on the next
  request (BR-ADMIN-08, BR-ADMIN-10).
- Audit log retention is a setting, 365 days by default (Q-ADMIN-05).

## Dependencies

- Authentication ([auth](../auth/README.md)): sign-in, sessions, email rules (BR-AUTH-01).
- Projects ([project](../project/README.md)): archive, restore, delete rules (BR-PROJECT-09), activity log
  written in the same transaction (BR-PROJECT-22).
- App shell ([shell](../shell/README.md)): shared components and the account menu entry (BR-SHELL-02).
- New data in 3C: `users.status`, `must_change_password`, `last_sign_in_at`; table `audit_events`.

## Out of scope

- Roles & permissions editor, Security, Cost & budgets, AI provider, Integrations pages: hidden until built
  (Q-ADMIN-03). The Settings page in 3C holds only the Guest visibility default (BR-GUEST-02) and audit retention.
- Invitations by email, teams, SSO.
- Cost data (needs worklogs from Tasks and Test runs, Phase 3B+).
- Deleting user accounts.

## Business risks

| Risk                                                      | Why it matters                              | Covered by               |
| --------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| A normal user finds or calls the Admin console            | Accounts and every project are exposed      | BR-ADMIN-01              |
| The system is left without an active Admin                | Nobody can manage accounts or projects      | BR-ADMIN-09              |
| A deactivated person keeps working through an old session | A former team member still sees client data | BR-ADMIN-10, BR-ADMIN-12 |
| A project is left without a Project admin                 | Nobody in the team can manage it            | BR-ADMIN-04, BR-ADMIN-11 |
| Admin actions on other teams' projects go unnoticed       | Loss of trust; no accountability            | BR-ADMIN-05, BR-ADMIN-14 |
| The audit log misses, invents or loses an entry           | Investigations fail                         | BR-ADMIN-15, BR-ADMIN-16 |
| A password leaks through the audit log                    | Account takeover                            | BR-ADMIN-14              |

## Test data

Phase 3C seed additions (all seed users share the password `Password123!`, dev and test only):

- Ada Admin stays the only Admin.
- **Hoa Inactive** `inactive@qawm.test`, status Deactivated.
- Sam Stakeholder becomes a **Guest** of SHOP with the default switches ([guest](../guest/README.md)).
- A few audit entries: sign-ins, one failed sign-in, one Admin action on SECRET.
- The existing SHOP, MOBI, OLD (archived) and SECRET projects cover every dashboard case.

## Open questions

None open. All Phase 3C questions were accepted with their defaults on 2026-10-09; see [Decisions](#decisions).

## Decisions

| ID         | Question                                                                                  | Decision (accepted default, 2026-10-09)                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Q-ADMIN-01 | Admin creates accounts with a one-time password (no email sending yet)?                   | Yes (BR-ADMIN-07).                                                                                        |
| Q-ADMIN-02 | Move Comment / Attachment / Link tables from 3C to 3B?                                    | Yes: they are built in 3B, where comments are first used.                                                 |
| Q-ADMIN-03 | Admin nav items not built yet (Roles, Security, Cost, Settings, AI, Integrations)?        | Hidden until built, same as BR-SHELL-01.                                                                  |
| Q-ADMIN-04 | The 3A "Overview" tab becomes the project dashboard and project details move to Settings? | Yes (BR-DASH-01); Linh's 3A tests that open Overview get the new locators listed in the PR (BR-SHELL-08). |
| Q-ADMIN-05 | Audit log retention?                                                                      | 365 days, a setting (BR-ADMIN-17).                                                                        |

## Change log

| Date       | Change                                                                          | Why      |
| ---------- | ------------------------------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 and their decisions | Phase 3C |
