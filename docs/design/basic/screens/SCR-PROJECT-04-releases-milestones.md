---
id: SCR-PROJECT-04
title: Releases & sprints tab
type: screen
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /projects/:key/releases
traces:
  requirements:
    [
      US-PROJECT-08,
      US-PROJECT-11,
      US-PROJECT-12,
      BR-PROJECT-14,
      BR-PROJECT-15,
      BR-PROJECT-16,
      BR-PROJECT-17,
      BR-PROJECT-18,
      BR-PROJECT-25,
      BR-PROJECT-26,
      BR-PROJECT-27,
      BR-PROJECT-28,
      BR-PROJECT-29,
      BR-PROJECT-30,
      BR-PROJECT-31,
      BR-PROJECT-32,
      BR-PROJECT-33,
      BR-PROJECT-34,
      BR-PROJECT-45,
      BR-PROJECT-46,
      BR-PROJECT-47,
      BR-GUEST-03,
    ]
  acceptance:
    [
      AC-PROJECT-36,
      AC-PROJECT-37,
      AC-PROJECT-38,
      AC-PROJECT-39,
      AC-PROJECT-40,
      AC-PROJECT-41,
      AC-PROJECT-42,
      AC-PROJECT-43,
      AC-PROJECT-52,
      AC-PROJECT-53,
      AC-PROJECT-54,
      AC-PROJECT-55,
      AC-PROJECT-56,
      AC-PROJECT-57,
      AC-PROJECT-58,
      AC-PROJECT-59,
      AC-PROJECT-60,
      AC-PROJECT-61,
      AC-PROJECT-62,
      AC-PROJECT-63,
      AC-PROJECT-64,
      AC-PROJECT-65,
      AC-PROJECT-66,
      AC-PROJECT-101,
      AC-PROJECT-102,
      AC-PROJECT-103,
      AC-PROJECT-104,
      AC-PROJECT-105,
      AC-PROJECT-106,
      AC-PROJECT-107,
      AC-PROJECT-108,
    ]
  api:
    [
      API-RELEASE-01,
      API-RELEASE-02,
      API-RELEASE-03,
      API-RELEASE-04,
      API-MILESTONE-01,
      API-MILESTONE-02,
      API-MILESTONE-03,
      API-MILESTONE-04,
    ]
  design: [FLW-PROJECT-04, DD-PROJECT-04]
updated: 2026-10-10
---

# SCR-PROJECT-04 Releases & sprints tab

The release plan: each release with its status, dates and progress, and its sprints listed under it. The tab is
named "Releases & sprints" in the project page and the side nav (SCR-PROJECT-02, SCR-SHELL-01); a Guest sees it only
while the `releases` area is switched on for Guests (BR-GUEST-03). Follows ISO 9241-110 (interaction principles) and
WCAG 2.2 level AA.

The UI says **sprint** for what the data model, API and IDs call a **milestone** (BR-PROJECT-47).

## Layout

Wide tab (the tab itself is 672 px or wider):

```
 Releases & sprints                                         [ New sprint ] [ New release ]
 ▾ 2.4  [Active]  2026-09-15 → 2026-10-29                          [Edit] [Release (disabled)]
   1 / 2 sprints completed · 20 days to target · 1 sprint not completed
   ┌──────────┬──────────┬─────────────────────────┬──────────────────────┬───────────────────┐
   │ Sprint   │ Goal     │ Dates                   │ Status               │                   │
   ├──────────┼──────────┼─────────────────────────┼──────────────────────┼───────────────────┤
   │ Sprint 3 │ Cart     │ 09-15 → 09-28 (14 days) │ [Completed]          │                   │
   │ Sprint 4 │ Checkout │ 09-29 → 10-12 (14 days) │ [Active] 3 days left │ [Complete] [Edit] │
   └──────────┴──────────┴─────────────────────────┴──────────────────────┴───────────────────┘
                                                                              [ New sprint ]
 ▸ 2.5  [Planned]  2026-10-30 → 2026-11-28                      [Edit] [Activate] [Delete]
   1 / 1 sprint completed · 50 days to target
 ▸ 2.3  [Released] 2026-07-31 → 2026-08-27
   2 / 2 sprints completed
```

Narrow tab (below 672 px, e.g. a phone or a small window next to the side nav): release actions go into a "⋯" menu ("Actions for 2.4"); each sprint is a card with
name, status, goal, dates and its buttons.

```
 ▾ 2.4 [Active] 2026-09-15 → 2026-10-29      [⋯]
   1 / 2 sprints completed · 20 days to target
   ┌───────────────────────────────────────┐
   │ Sprint 4            [Active] 3 days left│
   │ Checkout                              │
   │ 2026-09-29 → 2026-10-12 (14 days)     │
   │                     [Complete] [Edit] │
   └───────────────────────────────────────┘
```

Dialogs:

```
"New release" / "Edit release": Name, Start date, Target date, [Cancel] [Save]
"New sprint" / "Edit sprint":   Release [select] + hint "Release 2.4 runs 2026-09-15 → 2026-10-29. A sprint is 1–28 days.",
                                Name, Goal, Start date, End date, live "14 days" hint, [Cancel] [Save]
"Activate release 2.5?" / "Release 2.4?" / "Start Sprint 5?" / "Complete Sprint 4?":
                                what will happen + "This can't be undone.", [Cancel] [Activate | Release | Start | Complete]
"Delete release 2.5?" / "Delete sprint Sprint 5?": "This can't be undone.", [Cancel] [Delete]
```

Releases are ordered Active, Planned (by start date), Released (newest first). The active release is expanded.

## Fields

| Field              | Input type | Required | Client validation              | Message                                        | Notes                                                                                                                                           |
| ------------------ | ---------- | -------- | ------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Release name       | `text`     | yes      | 1–50 characters after trimming | MSG-PROJECT-13, MSG-PROJECT-14                 |                                                                                                                                                 |
| Start date         | `date`     | no       | —                              | —                                              |                                                                                                                                                 |
| Target date        | `date`     | no       | ≥ start date when both set     | MSG-PROJECT-15                                 |                                                                                                                                                 |
| Sprint release     | select     | yes      | —                              | —                                              | Planned and Active releases only; pre-selected from "New sprint in 2.5"; fixed when editing; hint with the release dates and the longest sprint |
| Sprint name        | `text`     | yes      | 1–50 characters after trimming | MSG-PROJECT-23, MSG-PROJECT-30                 |                                                                                                                                                 |
| Goal               | `textarea` | no       | at most 500 characters         | —                                              |                                                                                                                                                 |
| Sprint start / end | `date`     | yes      | end ≥ start; 1–28 days         | MSG-PROJECT-24, MSG-PROJECT-25, MSG-PROJECT-26 | Live hint "14 days"                                                                                                                             |

## Actions

| Action                                   | Result                                                                                                                          | Criteria                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| New release → Save                       | `POST …/releases`; appears as Planned                                                                                           | AC-PROJECT-36, AC-PROJECT-37, AC-PROJECT-38                |
| Edit release (Planned or Active)         | `PATCH` name and dates. Not offered on a Released release; the API refuses it (422 MSG-PROJECT-45)                              | AC-PROJECT-102                                             |
| Activate → confirm                       | `PATCH status ACTIVE`; 422 → alert MSG-PROJECT-17                                                                               | AC-PROJECT-42, AC-PROJECT-101                              |
| Release → confirm                        | `PATCH status RELEASED`. Disabled while sprints are open, with "N sprints not completed" on the row; 422 → alert MSG-PROJECT-27 | AC-PROJECT-52, AC-PROJECT-101, AC-PROJECT-104              |
| Delete release (Planned, no sprints)     | Confirm, `DELETE`; otherwise not offered                                                                                        | AC-PROJECT-43, AC-PROJECT-53                               |
| New sprint (top, or "New sprint in 2.4") | `POST …/milestones`; appears under its release                                                                                  | AC-PROJECT-54, AC-PROJECT-106                              |
| Save with bad dates                      | Message under the date fields; 422 from the server shown the same way                                                           | AC-PROJECT-56, AC-PROJECT-57, AC-PROJECT-58, AC-PROJECT-59 |
| Start (Planned sprint) → confirm         | `PATCH status ACTIVE`; 422 → alert MSG-PROJECT-29                                                                               | AC-PROJECT-61, AC-PROJECT-62, AC-PROJECT-101               |
| Complete (Active sprint) → confirm       | `PATCH status COMPLETED`                                                                                                        | AC-PROJECT-52, AC-PROJECT-101                              |
| Edit sprint (Planned or Active)          | `PATCH`. Not offered on a Completed sprint; the API refuses it (422 MSG-PROJECT-46)                                             | AC-PROJECT-103                                             |
| Delete sprint (Planned)                  | Confirm, `DELETE`                                                                                                               | AC-PROJECT-65                                              |
| Cancel in any confirmation               | Nothing changes; focus goes back to the button that opened it                                                                   | AC-PROJECT-101                                             |
| Any save, 409 `VERSION_CONFLICT`         | Alert MSG-PROJECT-07 with "Reload"                                                                                              | BR-PROJECT-07                                              |

There is no button that moves a status backwards; the API refuses it too (AC-PROJECT-41, AC-PROJECT-63). Every status
move is confirmed first because none can be undone (BR-PROJECT-46).

## States

| State                   | What the user sees                                                                               | Criteria                       |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------ |
| Loading                 | Three grey release rows; "Loading releases" for screen readers                                   |                                |
| Empty                   | "No releases yet." and, for Project admins, "New release"                                        |                                |
| Release without sprints | "No sprints yet" on the row; "No sprints in this release." when opened                           |                                |
| Error                   | MSG-COMMON-01 with "Try again"                                                                   |                                |
| No permission           | Lists only; no New, Edit, status or Delete buttons                                               | AC-PROJECT-66                  |
| Release progress        | "1 / 2 sprints completed · 20 days to target" or "Overdue by N days"; no countdown once Released | AC-PROJECT-105                 |
| Active sprint           | Badge "Active" and "N days left" or "Overdue by N days"                                          | AC-PROJECT-64                  |
| Released / Completed    | Read-only: no Edit                                                                               | AC-PROJECT-102, AC-PROJECT-103 |
| Archived project        | Read-only for everyone                                                                           | BR-PROJECT-08                  |
| Success                 | Toast MSG-PROJECT-19                                                                             |                                |

## Permissions

| Access level                               | Can see                                                                           | Can do                         |
| ------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------ |
| Project admin, System admin                | Everything                                                                        | All release and sprint actions |
| Member (any job title, Team lead included) | Everything                                                                        | Nothing                        |
| Guest                                      | Everything while the `releases` area is on; otherwise no tab and "Page not found" | Nothing (BR-GUEST-04)          |

## Accessibility

- Page title and `<h1>`: the project page's (SCR-PROJECT-02); this tab is a `<section>` labelled by its `<h2>` "Releases & sprints".
- Each release is a disclosure: a button with `aria-expanded` and the release name, status and dates in its name.
- Status is a text badge ("Active"), never colour only. "Overdue" is a word.
- Buttons have the item in their name: "Edit 2.4", "Activate 2.5", "Complete Sprint 4", "New sprint in 2.4". The
  disabled "Release 2.4" is described by its reason text (`aria-describedby`).
- The narrow-screen menu follows the ARIA menu button pattern ("Actions for 2.4"; arrows move, Esc closes).
- Confirmations are `role="alertdialog"` with the consequence as description. Focus goes back to the opener after
  any dialog closes.
- Date inputs have labels; the release hint and the live "N days" hint are linked or `aria-live="polite"`.
- Errors in dialogs: field errors with `aria-describedby`; server errors in `role="alert"` at the top of the
  dialog; focus moves to the first invalid field. Toasts and the empty state use `role="status"`.

## Responsive

When the tab is narrower than 672 px (a CSS container query on the tab, so the side nav width counts) the sprint table becomes cards and release actions move into a "⋯" menu; a Release that is blocked is not
in the menu, and the row text says why (AC-PROJECT-107).

## Locators for tests

`getByRole('button', { name: /^2\.4/ })` (disclosure), `getByRole('button', { name: 'New release' })`,
`getByRole('button', { name: 'New sprint in 2.5' })`, `getByRole('dialog', { name: 'New sprint' })`,
`getByRole('alertdialog', { name: 'Complete Sprint 4?' })`, `getByLabel('Start date')`, `getByLabel('End date')`,
`getByRole('row', { name: /Sprint 4/ })`, `getByRole('button', { name: 'Complete Sprint 4' })`,
`getByRole('button', { name: 'Activate 2.5' })`, `getByRole('button', { name: 'Release 2.4' })` (check
`toBeDisabled()`), `getByRole('button', { name: 'Actions for 2.4' })` (narrow screen).

## Change log

| Date       | Change                                                                                                                                                                             | Why                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 2026-10-08 | First version                                                                                                                                                                      | Phase 3A                                             |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                                                                                            | Linh's decision 2026-10-09                           |
| 2026-10-09 | Tab named "Releases & sprints"; Guest row                                                                                                                                          | Phase 3C (BR-GUEST-03)                               |
| 2026-10-10 | UI says sprint; confirm status moves; Released / Completed read-only; release progress; "New sprint in"; sprint dialog hint; skeleton; narrow-screen cards and menu; status badges | Linh's review 2026-10-10 (REV-SCR-PROJECT-04 C1–C11) |
