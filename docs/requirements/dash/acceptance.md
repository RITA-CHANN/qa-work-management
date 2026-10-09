---
title: Project dashboard acceptance criteria
type: acceptance
feature: dash
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Project dashboard acceptance criteria

Format: **Given** / **When** / **Then**. **Covers** lists the stories and rules it proves. **Priority**, **Risk**
and **Verify** are explained in [docs/README.md](../../README.md#requirement-attributes). Tag the Playwright test
that checks a criterion with its ID, for example `{ tag: '@AC-DASH-01' }`. Seed users and projects:
[project README](../project/README.md#test-data). Tests that check day counts create their own project with dates
built from `new Date()`.

## Cards (US-DASH-01)

| ID         | Given                                                                                           | When                    | Then                                                                                                                      | Covers                             | Priority | Risk   | Verify  |
| ---------- | ----------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------- | ------ | ------- |
| AC-DASH-01 | SHOP has release 2.4 Active (Sprint 3 Completed, Sprint 4 Active)                               | I open SHOP             | The release card shows 2.4 with days to target and sprints 1 / 2 completed; the sprint card shows Sprint 4 with days left | US-DASH-01, BR-DASH-03, BR-DASH-04 | Must     | Medium | Auto-UI |
| AC-DASH-02 | MOBI has no Active release or sprint, and release 1.0 is Planned                                | I open MOBI             | The release card shows 1.0 (Planned); the sprint card shows MSG-DASH-02                                                   | BR-DASH-03, BR-DASH-04             | Must     | Low    | Auto-UI |
| AC-DASH-04 | I am a member of SHOP                                                                           | I open `/projects/SHOP` | The dashboard opens as the project's home; there is no Overview tab, and the project details are under "Settings"         | BR-DASH-01                         | Must     | Medium | Auto-UI |
| AC-DASH-05 | My project has a release target date in 3 days, a sprint end date in 10 days and one in 20 days | I open its dashboard    | Deadlines lists the two dates within 14 days, the 3-day one first, and not the 20-day one                                 | BR-DASH-05                         | Should   | Medium | Auto-UI |
| AC-DASH-06 | SHOP has 2 Project admins and Members with every job title                                      | I open SHOP             | The team card shows 2 Project admins, the number of Members, the count per job title and a link to Members                | BR-DASH-06                         | Should   | Low    | Auto-UI |
| AC-DASH-07 | My project has 12 activity entries                                                              | I open its dashboard    | Recent activity shows the 10 newest, newest first, and a link that opens the full activity log                            | US-DASH-01, BR-DASH-07             | Should   | Low    | Auto-UI |

## Monitoring only (US-DASH-02)

| ID         | Given                                      | When                       | Then                                                                                                                | Covers                             | Priority | Risk | Verify  |
| ---------- | ------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------- | ---- | ------- |
| AC-DASH-03 | I am a Project admin, a Member or an Admin | I open a project dashboard | There is no create, edit or delete control, every card links to its page, and no cost, budget or rate data is shown | US-DASH-02, BR-DASH-02, BR-DASH-08 | Must     | High | Auto-UI |

## Change log

| Date       | Change                                                                                      | Why                                  |
| ---------- | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3; added AC-DASH-04 to AC-DASH-07 | Every story and rule has a criterion |
