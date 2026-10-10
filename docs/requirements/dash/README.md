---
title: Project dashboard
type: feature
feature: dash
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Project dashboard

Business requirements for the project dashboard v1 of Phase **3C** (mockup U1): one project at a time, monitoring
only, built from the data that exists after 3A (ISO/IEC/IEEE 29148: business and stakeholder requirements).
Technical plan: [phase-3c-plan.md](../../phases/phase-3c-plan.md). The folder is named `dash` so that it matches the
`DASH` in its IDs (`docs:check` groups IDs by folder name).

| File                           | Contains                               |
| ------------------------------ | -------------------------------------- |
| [stories.md](stories.md)       | User stories `US-DASH-NN`              |
| [rules.md](rules.md)           | Business rules `BR-DASH-NN`            |
| [acceptance.md](acceptance.md) | Acceptance criteria `AC-DASH-NN`       |
| [messages.md](messages.md)     | Exact UI and error texts `MSG-DASH-NN` |

## Design and API

| Layer   | Docs                                                                                                                                                                                                                   |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screens | [SCR-DASH-01 Project dashboard](../../design/basic/screens/SCR-DASH-01-project-dashboard.md) (served at `/` for the current project)                                                                                   |
| API     | [API-DASH-01](../../api/projects/get-project-dashboard.md) `GET /api/projects/:key/dashboard`, after [API-ME-01](../../api/me/get-current-project.md) at `/`                                                           |
| Data    | [releases](../../database/tables/releases.md), [milestones](../../database/tables/milestones.md), [project_members](../../database/tables/project_members.md), [activity_logs](../../database/tables/activity_logs.md) |

## Goal

Give every project member one page that shows the project's state at a glance (active release, current sprint,
deadlines, team, recent activity) and links to where each item is managed. The dashboard only monitors; it never
changes data. Test and defect widgets join in the phases that create their data.

## Stakeholders

| Stakeholder                     | What they care about                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| Project admin (PM, QA lead)     | Is the release on track; which deadline comes next                 |
| Members (QA, dev, BA, design)   | What the team is working towards right now                         |
| Guests (client, sponsor)        | Progress, without seeing what their admins kept private            |
| System admin                    | Same view as a Project admin; cost data stays in the Admin console |
| QA (Linh) as tester of this app | Seed projects cover every card state (active, planned, empty)      |

## Actors

| Actor  | Description                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------- |
| Member | A project member (Project admin or Member). Sees the whole dashboard.                                    |
| Guest  | Sees the dashboard only if "Project dashboard" is on, and only cards of areas switched on (BR-GUEST-03). |
| Admin  | System admin. Sees the dashboard of every project, never with cost data (BR-DASH-08).                    |

## Assumptions and constraints

- Uses only 3A data: releases, sprints (milestones), members with job titles, activity.
- Dates are calendar dates in UTC, as in 3A; "days left" follows BR-PROJECT-34.
- The 3A Overview tab is replaced (Q-ADMIN-04); Linh's 3A tests that open Overview get new locators listed in the PR.

## Dependencies

- Projects ([project](../project/README.md)): releases, milestones, members, activity log.
- App shell ([shell](../shell/README.md)) for the layout and the shared KpiCard, ProgressBar, StatusBadge and
  EmptyState components.
- Guest visibility ([guest](../guest/README.md)) to hide cards of areas that are off.

## Out of scope

- Test, defect and coverage widgets (Phases 4–7).
- Any create, edit or delete action on the dashboard (BR-DASH-02).
- Cost, budget and rate data (Admin console only, later).
- The all-projects dashboard: Admin console ([admin](../admin/README.md), BR-ADMIN-02).

## Business risks

| Risk                                           | Why it matters                                | Covered by              |
| ---------------------------------------------- | --------------------------------------------- | ----------------------- |
| Wrong "days to target" or overdue state        | The team misjudges how much time is left      | BR-DASH-03, BR-DASH-04  |
| The dashboard turns into a second editing page | Two places to change the same data; confusing | BR-DASH-02              |
| Cost or budget data shown to members or guests | Confidential commercial data leaks            | BR-DASH-08, BR-GUEST-04 |
| A Guest sees a card for an area that is off    | Data the client should not see is exposed     | BR-GUEST-03             |

## Open questions

None. Q-ADMIN-04 (Overview becomes the dashboard) is decided; see
[Decisions in the admin README](../admin/README.md#decisions).

## Change log

| Date       | Change                                                                | Why                |
| ---------- | --------------------------------------------------------------------- | ------------------ |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3           | Phase 3C           |
| 2026-10-09 | "Design and API" table: screens, API and data of the Phase 3C code PR | Phase 3C code PR   |
| 2026-10-09 | API row: the dashboard endpoint API-DASH-01                           | SCR-DASH-01 review |
