---
title: Guest access acceptance criteria
type: acceptance
feature: guest
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Guest access acceptance criteria

Format: **Given** / **When** / **Then**. **Covers** lists the stories and rules it proves. **Priority**, **Risk**
and **Verify** are explained in [docs/README.md](../../README.md#requirement-attributes). Tag the Playwright test
that checks a criterion with its ID, for example `{ tag: '@AC-GUEST-01' }`. In the 3C seed, Sam Stakeholder
`stakeholder@qawm.test` is a Guest of SHOP with the default switches. Tests that change switches create their own
project through the API.

## Manage Guests (US-GUEST-01)

| ID          | Given                                                            | When                                                                   | Then                                                                                             | Covers                                | Priority | Risk   | Verify            |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- | -------- | ------ | ----------------- |
| AC-GUEST-06 | I am a Project admin of my project, which has Member Dev         | I change Dev's access level to Guest, then back to Member              | Dev is listed as Guest, then as Member; each change is in the activity log                       | US-GUEST-01, BR-GUEST-01              | Must     | Medium | Auto-UI, Auto-API |
| AC-GUEST-02 | Oanh (Project admin of SHOP) switches Activity log on for Guests | Sam (Guest of SHOP) reloads the page                                   | Activity log appears in Sam's nav and opens; the change is in the activity log and the audit log | US-GUEST-01, BR-GUEST-02, BR-GUEST-06 | Must     | Medium | Auto-UI           |
| AC-GUEST-05 | I am a Member of SHOP (not a Project admin)                      | I open Project settings, or call the Guest visibility API to change it | Project settings › Guests is not offered; the API returns 403 (MSG-COMMON-06)                    | BR-GUEST-02                           | Must     | Medium | Auto-API          |

## What a Guest sees (US-GUEST-02)

| ID          | Given                                                           | When                                                    | Then                                                                                                                              | Covers                                | Priority | Risk   | Verify            |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------- | ------ | ----------------- |
| AC-GUEST-01 | Sam is a Guest of SHOP with the default switches                | Sam opens SHOP, and calls the Members and Activity APIs | Sam sees the dashboard and Releases only; Members and Activity are in neither the nav, search nor dashboard; both APIs return 404 | US-GUEST-02, BR-GUEST-02, BR-GUEST-03 | Must     | High   | Auto-UI, Auto-API |
| AC-GUEST-03 | Sam is a Guest of SHOP                                          | Sam calls any create, edit or delete endpoint of SHOP   | Every call returns 403 (MSG-COMMON-06) and nothing changes                                                                        | BR-GUEST-04                           | Must     | High   | Auto-API          |
| AC-GUEST-04 | Members list is on for Guests of SHOP, which has a second Guest | Sam opens Members, and calls the Members API            | Names and job titles only, no emails, and the other Guest is not listed                                                           | BR-GUEST-05                           | Must     | Medium | Auto-UI, Auto-API |

## Change log

| Date       | Change                                                                         | Why                                  |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3; added AC-GUEST-06 | Every story and rule has a criterion |
