---
title: Guest access
type: feature
feature: guest
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Guest access

Business requirements for the **Guest** access level and the per-project Guest visibility setting of Phase **3C**
(ISO/IEC/IEEE 29148: business and stakeholder requirements). Role model v2 (System admin, Project admin, Member,
plus a job title) comes with PR #13; Guest is added here because it needs the new Project settings page.
Technical plan: [phase-3c-plan.md](../../phases/phase-3c-plan.md).

| File                           | Contains                            |
| ------------------------------ | ----------------------------------- |
| [stories.md](stories.md)       | User stories `US-GUEST-NN`          |
| [rules.md](rules.md)           | Business rules `BR-GUEST-NN`        |
| [acceptance.md](acceptance.md) | Acceptance criteria `AC-GUEST-NN`   |
| [messages.md](messages.md)     | Exact UI and error texts (none yet) |

## Goal

Let a project's admins invite outside people (client, sponsor, partner) to follow the project read only, and choose
exactly which areas they see, so clients follow progress without seeing everything.

## Stakeholders

| Stakeholder                      | What they care about                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| Project admin                    | Show the client the plan, keep internal discussion and people private |
| Client, sponsor, outside partner | Follow progress without asking for status mails                       |
| System admin                     | A safe default for new projects                                       |
| Business owner                   | No leak of cost, security or audit data, or of other clients' people  |
| QA (Linh) as tester of this app  | Every switch is checked on the server, not only hidden in the UI      |

## Actors

| Actor         | Description                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Project admin | Adds Guests, turns Members into Guests and back, changes Guest visibility in Project settings › Guests.          |
| Admin         | System admin. Can do all a Project admin can on every project, and sets the default visibility for new projects. |
| Guest         | A project member with access level `GUEST`: read only, sees only the areas switched on.                          |
| Member        | Cannot change Guests or Guest visibility (403).                                                                  |

### Guest visibility areas

One switch per area, per project. New projects copy the system default, which a System admin sets in Admin console
› Settings. Areas appear in the list as the phases that build them arrive.

| Area                  | Default for new projects | Available from |
| --------------------- | ------------------------ | -------------- |
| Project dashboard     | On                       | 3C             |
| Releases and sprints  | On                       | 3C             |
| Members list          | Off                      | 3C             |
| Activity log          | Off                      | 3C             |
| Requirements          | Off                      | 3B             |
| Test cases            | Off                      | 4              |
| Test runs and results | Off                      | later phase    |
| Defects               | Off                      | 6              |
| Reports               | Off                      | later phase    |
| Files and attachments | Off                      | 3B             |

## Assumptions and constraints

- A Guest is a normal user account (global role `USER`) with access level `GUEST` in one or more projects.
- Visibility is per project, the same for every Guest of that project (per-Guest overrides may come later).
- The switches are read from the database on every request, like access levels (BR-PROJECT-13).
- Cost, budget, security and audit data are never visible to a Guest, whatever the switches.

## Dependencies

- Role model v2 from PR #13 (`project_members.access`, job titles).
- Project settings page (new in 3C, replaces the 3A Overview details, BR-DASH-01).
- Activity log (3A) and audit log ([admin](../admin/README.md), BR-ADMIN-14) to record visibility changes.

## Out of scope

- Per-Guest overrides (one Guest sees more than another).
- Comments by Guests (Guests never comment, BR-GUEST-04).
- Inviting Guests by email; they need an account created by a System admin (BR-ADMIN-07).

## Business risks

| Risk                                             | Why it matters                                | Covered by  |
| ------------------------------------------------ | --------------------------------------------- | ----------- |
| An area that is off is reachable through the API | The client sees internal data                 | BR-GUEST-03 |
| A Guest changes data                             | Wrong plan; no accountability inside the team | BR-GUEST-04 |
| A Guest sees team emails or other clients        | Personal data and client names leak           | BR-GUEST-05 |
| Nobody knows who opened an area to Guests        | Can't trace a leak                            | BR-GUEST-06 |

## Open questions

None. The Phase 3C questions are decided; see [Decisions in the admin README](../admin/README.md#decisions).

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
