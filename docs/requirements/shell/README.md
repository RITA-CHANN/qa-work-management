---
title: App shell
type: feature
feature: shell
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# App shell

Business requirements for the new app shell of Phase **3C** (User UI): design tokens, side nav grouped by module,
project switcher, ⌘K search and account menu (ISO/IEC/IEEE 29148: business and stakeholder requirements).
Technical plan: [phase-3c-plan.md](../../phases/phase-3c-plan.md). Related 3C features:
[dash](../dash/README.md) (project dashboard), [admin](../admin/README.md) (Admin console) and
[guest](../guest/README.md) (Guest access). Decisions for the whole phase are in the
[admin README](../admin/README.md#decisions).

| File                           | Contains                                |
| ------------------------------ | --------------------------------------- |
| [stories.md](stories.md)       | User stories `US-SHELL-NN`              |
| [rules.md](rules.md)           | Business rules `BR-SHELL-NN`            |
| [acceptance.md](acceptance.md) | Acceptance criteria `AC-SHELL-NN`       |
| [messages.md](messages.md)     | Exact UI and error texts `MSG-SHELL-NN` |

Accessibility (BR-SHELL-07) is written as a business rule because it applies to every page; there is no separate
`nfr.md` for the shell.

## Design and API

| Layer   | Docs                                                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screens | [SCR-SHELL-01 App shell](../../design/basic/screens/SCR-SHELL-01-app-shell.md) (side nav, project switcher, search, account menu)                                                                       |
| API     | [API-ME-01 Current project](../../api/me/get-current-project.md), [API-ME-02 Remember the current project](../../api/me/put-current-project.md), [API-SEARCH-01 Search](../../api/search/get-search.md) |
| Data    | [users](../../database/tables/users.md) (`last_project_id`)                                                                                                                                             |
| Plan    | [phase-3c-plan.md](../../phases/phase-3c-plan.md#changed-locators-for-existing-tests) (changed locators, BR-SHELL-08)                                                                                   |

## Goal

Give the app its final look and structure **before** more modules arrive, so Requirements (3B), Test cases (4) and
Defects (6) are built straight into the final layout instead of being restyled later. People find every screen
from one side nav, always know which project they are in, and can jump anywhere by typing.

## Stakeholders

| Stakeholder                       | What they care about                                                       |
| --------------------------------- | -------------------------------------------------------------------------- |
| Project members (every job title) | Find screens quickly, no dead links, always in the right project           |
| System admin                      | A clear way into the Admin console that other users never see              |
| Business owner                    | A modern, consistent look that later modules reuse without rework          |
| QA (Linh) as tester of this app   | Existing tests keep working; every changed locator is listed in the 3C PR  |
| Developers of later phases        | Shared tokens and components (KpiCard, DataTable, EmptyState…) to build on |

## Actors

| Actor         | Description                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| User          | Global role `USER`. Sees the User UI only, and only projects they are a member of (BR-PROJECT-06).           |
| Project admin | Manages one project (details, members, releases, sprints, archive). User UI only.                            |
| Guest         | Follows one project read only; sees only the areas its admins switch on ([guest](../guest/README.md)).       |
| Admin         | System admin, global role `ADMIN`. Sees the User UI for every project (BR-PROJECT-36) and the Admin console. |

## Assumptions and constraints

- Starts after PR #13 (Phase 3A, with role model v2: System admin, Project admin, Member, job title) merges.
- Light theme only ("light indigo" style v2.1); every colour, font size, radius and spacing is a token, so a dark
  theme later only changes token values.
- The login page keeps its current look.
- Search covers only what exists after 3A: projects, releases, sprints, and users (Admins only).

## Dependencies

- Authentication ([auth](../auth/README.md)) for the current user and global role.
- Projects ([project](../project/README.md)) for the project list, access rules and releases / sprints.
- `users.last_project_id` (new in 3C) for BR-SHELL-04.
- Shared messages in `packages/shared`.

## Out of scope

- Dark theme (the tokens allow it later).
- Notifications centre and AI assistant panel (Phase 8+).
- Search over requirements, test cases and bugs (added when those modules exist).
- A generic "Create" button in the top bar (BR-SHELL-05).

## Business risks

| Risk                                                            | Why it matters                                 | Covered by              |
| --------------------------------------------------------------- | ---------------------------------------------- | ----------------------- |
| Search shows a project the user is not in                       | A confidential project name leaks              | BR-SHELL-06             |
| Admin entries or role text visible to normal users              | Confusing; reveals how the system is run       | BR-SHELL-02             |
| The redesign silently breaks Linh's existing Playwright tests   | Lost test coverage, wasted time finding causes | BR-SHELL-08             |
| The new look fails accessibility (contrast, colour-only status) | Some users can't use the app                   | BR-SHELL-07             |
| Dead links to screens not built yet                             | Users lose trust in the navigation             | BR-SHELL-01, Q-ADMIN-03 |

## Open questions

None. The Phase 3C questions were answered with their defaults; see
[Decisions in the admin README](../admin/README.md#decisions) (Q-ADMIN-03 applies to the side nav).

## Change log

| Date       | Change                                                                | Why              |
| ---------- | --------------------------------------------------------------------- | ---------------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3           | Phase 3C         |
| 2026-10-09 | "Design and API" table: screens, API and data of the Phase 3C code PR | Phase 3C code PR |
