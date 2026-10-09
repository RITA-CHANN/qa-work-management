---
id: SCR-ADMIN-04
title: Audit log
type: screen
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /admin/audit
traces:
  requirements: [US-ADMIN-05, BR-ADMIN-01, BR-ADMIN-14, BR-ADMIN-15]
  acceptance: [AC-ADMIN-04, AC-ADMIN-10, AC-ADMIN-11]
  api: [API-ADMIN-11]
  design: [SCR-ADMIN-01]
updated: 2026-10-09
---

# SCR-ADMIN-04 Audit log

Read-only list of sign-ins and admin actions, newest first, 50 per page, with filters (mockup A4, BR-ADMIN-15).
Layout of the Admin console: [SCR-ADMIN-01](SCR-ADMIN-01-all-projects-dashboard.md). Follows ISO 9241-110 and WCAG
2.2 level AA.

## Layout

```
Audit log                                                                          <h1>
Sign-ins and admin actions
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Action [All actions ▾] Project key [____] From [dd/mm/yyyy] To [dd/mm/yyyy]             │
│ [ ] Only actions made as Admin                                                          │
│ Time | Actor | Action | Target | Project | Change | IP                                  │ <table "Audit entries">
│ 9 Oct 2026, 11:00 | Ada Admin [as Admin] | Edited project | Ada Admin changed … | SECRET │
│                   |                      |                |                     | description: ~~—~~ → Admin-only tools | 10.0.0.2 │
│ 8 Oct 2026, 13:00 | Unknown | Sign-in failed | unknown@qawm.test | — | — | 203.0.113.7 │
│ [ Load more ]                                                                           │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## Fields

| Field                      | Input type | Required | Client validation | Message | Notes                                               |
| -------------------------- | ---------- | -------- | ----------------- | ------- | --------------------------------------------------- |
| Action                     | select     | no       | —                 | —       | "All actions" or one label of `AUDIT_ACTION_LABELS` |
| Project key                | `text`     | no       | —                 | —       | Upper-cased as typed                                |
| From, To                   | `date`     | no       | —                 | —       | Days in UTC; To is included                         |
| Only actions made as Admin | checkbox   | no       | —                 | —       | `asAdmin=true`                                      |

There is no actor filter in the UI yet; the API accepts `actorId`.

## Actions

| Action          | Result                                                       | Criteria    |
| --------------- | ------------------------------------------------------------ | ----------- |
| Open the page   | `GET /api/admin/audit` (50 entries)                          |             |
| Change a filter | The list reloads from the first page                         | AC-ADMIN-10 |
| "Load more"     | Next 50 entries appended (`cursor`); hidden on the last page |             |

There is no control to edit or delete an entry (AC-ADMIN-11).

## States

| State                                    | What the user sees                                                          | Criteria    |
| ---------------------------------------- | --------------------------------------------------------------------------- | ----------- |
| Loading                                  | Filters only                                                                |             |
| No entries                               | Empty state heading "No audit entries match"                                |             |
| Failed sign-in, unknown email            | Actor "Unknown", target the email tried, the IP                             | AC-ADMIN-10 |
| Admin write on a project they are not in | Badge "as Admin" next to the actor; Change shows old (struck through) → new | AC-ADMIN-04 |
| Error                                    | API error text in an alert                                                  |             |
| No permission                            | "Page not found" (as SCR-ADMIN-01)                                          | AC-ADMIN-01 |

## Permissions

| Role  | Can see               | Can do       |
| ----- | --------------------- | ------------ |
| Admin | Every entry           | Filter, page |
| User  | "Page not found" only | —            |

## Accessibility

- Page title "Audit log · QA Work Management"; one `<h1>` "Audit log".
- The table has a visually hidden caption "Audit entries"; times are `<time datetime>`.
- Old values use `<del>` (read as deleted text), so the change is not shown by strike-through style only.
- Every filter has a visible label; the checkbox is wrapped in its label.

## Responsive

Filters wrap; the table scrolls horizontally inside its card.

## Locators for tests

`getByRole('heading', { level: 1, name: 'Audit log' })`, `getByLabel('Action', { exact: true })` (`selectOption('auth.sign_in_failed')` or
`selectOption({ label: 'Sign-in failed' })`; without `exact` it also matches the "Only actions made as Admin"
checkbox), `getByLabel('Project key')`, `getByLabel('From')`, `getByLabel('To', { exact: true })`,
`getByRole('checkbox', { name: 'Only actions made as Admin' })`, `getByRole('table', { name: 'Audit entries' })`,
`getByRole('row', { name: /unknown@qawm\.test/ })`, `getByText('as Admin')`,
`getByRole('button', { name: 'Load more' })`, empty `getByRole('heading', { name: 'No audit entries match' })`.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
