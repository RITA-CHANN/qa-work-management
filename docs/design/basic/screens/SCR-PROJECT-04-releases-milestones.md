---
id: SCR-PROJECT-04
title: Releases and milestones tab
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
updated: 2026-10-09
---

# SCR-PROJECT-04 Releases and milestones tab

The release plan: each release with its status and dates, and its milestones (sprints) listed under it.

## Layout

```
 Releases & milestones                                         [ New release ]
 ▾ 2.4  [Active]  2026-09-15 → 2026-10-31                [Edit] [Release] [⋯]
   ┌───────────┬───────────────────┬─────────────────────────┬────────────┬──────────────┐
   │ Milestone │ Goal              │ Dates                   │ Status     │              │
   ├───────────┼───────────────────┼─────────────────────────┼────────────┼──────────────┤
   │ Sprint 3  │ Cart              │ 09-15 → 09-28 (14 days) │ Completed  │              │
   │ Sprint 4  │ Checkout          │ 09-29 → 10-12 (14 days) │ Active · 3 days left │ [Complete] [Edit] │
   └───────────┴───────────────────┴─────────────────────────┴────────────┴──────────────┘
                                                              [ New milestone ]
 ▸ 2.5  [Planned]  2026-11-01 → 2026-11-30                [Edit] [Activate] [Delete]
 ▸ 2.3  [Released] …

Dialog "New release"/"Edit release": Name, Start date, Target date, [Cancel] [Save]
Dialog "New milestone"/"Edit milestone": Release [select], Name, Goal, Start date, End date, "N days" hint, [Cancel] [Save]
```

Releases are ordered Active, Planned (by start date), Released (newest first). The active release is expanded.

## Fields

| Field                 | Input type | Required | Client validation              | Message                                        | Notes                            |
| --------------------- | ---------- | -------- | ------------------------------ | ---------------------------------------------- | -------------------------------- |
| Release name          | `text`     | yes      | 1–50 characters after trimming | MSG-PROJECT-13, MSG-PROJECT-14                 |                                  |
| Start date            | `date`     | no       | —                              | —                                              |                                  |
| Target date           | `date`     | no       | ≥ start date when both set     | MSG-PROJECT-15                                 |                                  |
| Milestone release     | select     | yes      | —                              | —                                              | Planned and Active releases only |
| Milestone name        | `text`     | yes      | 1–50 characters after trimming | MSG-PROJECT-23, MSG-PROJECT-30                 |                                  |
| Goal                  | `textarea` | no       | at most 500 characters         | —                                              |                                  |
| Milestone start / end | `date`     | yes      | end ≥ start; 1–28 days         | MSG-PROJECT-24, MSG-PROJECT-25, MSG-PROJECT-26 | Live hint "14 days"              |

## Actions

| Action                                  | Result                                                                | Criteria                                                   |
| --------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| New release → Save                      | `POST …/releases`; appears as Planned                                 | AC-PROJECT-36, AC-PROJECT-37, AC-PROJECT-38                |
| Activate                                | `PATCH status ACTIVE`; 422 → alert MSG-PROJECT-17                     | AC-PROJECT-42                                              |
| Release                                 | `PATCH status RELEASED`; 422 → alert MSG-PROJECT-27                   | AC-PROJECT-52                                              |
| Delete release (Planned, no milestones) | Confirm, `DELETE`; otherwise not offered                              | AC-PROJECT-43, AC-PROJECT-53                               |
| New milestone → Save                    | `POST …/milestones`; appears under its release                        | AC-PROJECT-54                                              |
| Save with bad dates                     | Message under the date fields; 422 from the server shown the same way | AC-PROJECT-56, AC-PROJECT-57, AC-PROJECT-58, AC-PROJECT-59 |
| Start (Planned milestone)               | `PATCH status ACTIVE`; 422 → alert MSG-PROJECT-29                     | AC-PROJECT-61, AC-PROJECT-62                               |
| Complete                                | `PATCH status COMPLETED`                                              | AC-PROJECT-52                                              |
| Delete milestone (Planned)              | Confirm, `DELETE`                                                     | AC-PROJECT-65                                              |
| Any save, 409 `VERSION_CONFLICT`        | Alert MSG-PROJECT-07 with "Reload"                                    | BR-PROJECT-07                                              |

There is no button that moves a status backwards; the API refuses it too (AC-PROJECT-41, AC-PROJECT-63).

## States

| State            | What the user sees                                        | Criteria      |
| ---------------- | --------------------------------------------------------- | ------------- |
| Loading          | Skeleton                                                  |               |
| Empty            | "No releases yet." and, for Project admins, "New release" |               |
| Error            | MSG-COMMON-01 with "Try again"                            |               |
| No permission    | Lists only; no New, Edit, status or Delete buttons        | AC-PROJECT-66 |
| Active milestone | "Active · N days left" or "Active · Overdue by N days"    | AC-PROJECT-64 |
| Archived project | Read-only for everyone                                    | BR-PROJECT-08 |
| Success          | Toast MSG-PROJECT-19                                      |               |

## Permissions

| Access level                               | Can see    | Can do                            |
| ------------------------------------------ | ---------- | --------------------------------- |
| Project admin, System admin                | Everything | All release and milestone actions |
| Member (any job title, Team lead included) | Everything | Nothing                           |

## Accessibility

- Each release is a disclosure: a button with `aria-expanded` and the release name, status and dates in its name.
- Status is a text badge ("Active"), never colour only. "Overdue" is a word.
- Date inputs have labels and a format hint; the live "N days" hint is `aria-live="polite"`.
- Errors in dialogs: field errors with `aria-describedby`; server errors in `role="alert"` at the top of the
  dialog; focus moves to the first invalid field.

## Responsive

Below 768 px the milestone table becomes cards; release action buttons move into a "⋯" menu.

## Locators for tests

`getByRole('button', { name: /^2\.4/ })` (disclosure), `getByRole('button', { name: 'New release' })`,
`getByRole('dialog', { name: 'New milestone' })`, `getByLabel('Start date')`, `getByLabel('End date')`,
`getByRole('row', { name: /Sprint 4/ })`, `getByRole('button', { name: 'Complete Sprint 4' })`,
`getByRole('button', { name: 'Activate 2.5' })`.

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version                                                                           | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
