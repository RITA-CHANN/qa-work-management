---
title: App shell acceptance criteria
type: acceptance
feature: shell
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# App shell acceptance criteria

Format: **Given** / **When** / **Then**. **Covers** lists the stories and rules it proves. **Priority**, **Risk**
and **Verify** are explained in [docs/README.md](../../README.md#requirement-attributes). Tag the Playwright test
that checks a criterion with its ID, for example `{ tag: '@AC-SHELL-03' }`. Seed users and projects:
[project README](../project/README.md#test-data).

## Navigation and account menu (US-SHELL-01)

| ID          | Given                                   | When                                                     | Then                                                                                                                                                         | Covers                                | Priority | Risk   | Verify  |
| ----------- | --------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | -------- | ------ | ------- |
| AC-SHELL-01 | I am Linh (global role User), signed in | I open the app and look at the side nav and account menu | The nav shows only built screens, grouped by module in the fixed order, no module without a screen; the account menu has no "Admin console" and no role text | US-SHELL-01, BR-SHELL-01, BR-SHELL-02 | Must     | Medium | Auto-UI |
| AC-SHELL-02 | I am Ada (Admin), signed in             | I open the account menu and choose "Admin console"       | "Admin console" is in the menu and opens `/admin`                                                                                                            | BR-SHELL-02, BR-ADMIN-01              | Must     | Medium | Auto-UI |
| AC-SHELL-07 | I am signed in, any role                | I look at the top bar on every page                      | There is no generic "Create" button; create actions are labelled in their module ("New release")                                                             | BR-SHELL-05                           | Should   | Low    | Auto-UI |

## Project switcher (US-SHELL-02)

| ID          | Given                                                  | When                                  | Then                                                                                                     | Covers                   | Priority | Risk | Verify  |
| ----------- | ------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------ | -------- | ---- | ------- |
| AC-SHELL-03 | I am Linh, a member of SHOP and MOBI, on SHOP Releases | I choose MOBI in the project switcher | MOBI Releases opens; the switcher lists SHOP and MOBI first and the archived OLD last, marked "Archived" | US-SHELL-02, BR-SHELL-03 | Must     | Low  | Auto-UI |
| AC-SHELL-04 | I am Linh and the last project I opened was MOBI       | I sign out and sign in again          | MOBI's dashboard opens                                                                                   | BR-SHELL-04              | Should   | Low  | Auto-UI |

## Search (US-SHELL-03)

| ID          | Given                                              | When                                                                                  | Then                                                                                                           | Covers                   | Priority | Risk | Verify            |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------ | -------- | ---- | ----------------- |
| AC-SHELL-05 | I am Linh, not a member of SECRET (Internal Tools) | I press ⌘K (Ctrl+K) and type "Internal", and I call the search API with the same text | SECRET is in neither the results nor the API response; with no match I see MSG-SHELL-01; Esc closes the search | US-SHELL-03, BR-SHELL-06 | Must     | High | Auto-UI, Auto-API |

## Accessibility and stable locators

| ID          | Given                                                    | When                                    | Then                                                                                             | Covers      | Priority | Risk   | Verify  |
| ----------- | -------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------- | -------- | ------ | ------- |
| AC-SHELL-06 | Any page of the User UI or the Admin console             | I check it with axe (WCAG 2.2 AA rules) | There are no violations                                                                          | BR-SHELL-07 | Must     | Medium | Auto-UI |
| AC-SHELL-08 | The 3C PR changes pages that Linh's Playwright tests use | Linh reviews the PR                     | Every changed accessible name (button, link, heading, label) is listed with its old and new name | BR-SHELL-08 | Must     | Medium | Review  |

## Change log

| Date       | Change                                                                                         | Why                                  |
| ---------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3; added AC-SHELL-07 and AC-SHELL-08 | Every story and rule has a criterion |
