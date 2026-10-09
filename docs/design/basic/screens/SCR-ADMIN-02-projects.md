---
id: SCR-ADMIN-02
title: Admin projects
type: screen
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /admin/projects
traces:
  requirements:
    [
      US-ADMIN-03,
      BR-ADMIN-01,
      BR-ADMIN-03,
      BR-ADMIN-04,
      BR-ADMIN-18,
      BR-PROJECT-01,
      BR-PROJECT-09,
      BR-PROJECT-36,
    ]
  acceptance: [AC-ADMIN-01, AC-ADMIN-02, AC-ADMIN-09, AC-ADMIN-12]
  api:
    [
      API-ADMIN-02,
      API-ADMIN-12,
      API-PROJECT-02,
      API-PROJECT-05,
      API-PROJECT-06,
      API-PROJECT-07,
      API-USER-01,
    ]
  design: [SCR-ADMIN-01, SCR-PROJECT-01, FLW-PROJECT-01, FLW-PROJECT-03]
updated: 2026-10-09
---

# SCR-ADMIN-02 Admin projects

Every project of the workspace, archived included, with search, a status filter, a "New project" button and the row
actions Open, Change project admin, Archive / Restore and Delete (mockup A2, BR-ADMIN-03). This is the only place
where projects are created (BR-ADMIN-18): "New project" opens the dialog specified in
[SCR-PROJECT-01](SCR-PROJECT-01-project-list.md) and the System admin stays on this page. Archive, restore and
delete call the normal project endpoints, where a System admin acts as Project admin (BR-PROJECT-36) and the write is
audited as Admin. "Change project admin" calls API-ADMIN-12 (BR-ADMIN-04). Layout of the Admin console: [SCR-ADMIN-01](SCR-ADMIN-01-all-projects-dashboard.md). Follows ISO 9241-110 and WCAG 2.2 level AA.

## Layout

```
Projects                                                         [ New project ]  <h1>
┌──────────────────────────────────────────────────────────────────────────────┐
│ Search projects [Key or name____]   Status [All ▾]                           │
│ (error alert)                                                                │
│ Project            | Status   | Project admins | Members | Last activity |    │ <table "All projects">
│ ShopEase Web SHOP  | Active   | Oanh Owner     | 8       | 9 Oct 2026, … | [Open] [More ▾] │
│ Legacy Portal OLD  | Archived | …              | 2       | …             | [Open] [More ▾] │
└──────────────────────────────────────────────────────────────────────────────┘

More ▾ (active): Change project admin, Archive          More ▾ (archived): Restore, Delete

Dialog "New project": as in SCR-PROJECT-01 (Key, Name, Description, First project admin, [Cancel] [Create])

Dialog "Change project admin of ShopEase Web"       role="dialog"
┌──────────────────────────────────────────────────────┐
│ Current project admins: Oanh Owner, Mai PM           │
│ New project admin  [Choose a user ▾]                 │  active users, "name (email)"
│ [ ] Make the current project admins members          │  checkbox, off by default
│                                 [ Cancel ] [ Save ]  │  Save enabled once a user is chosen
└──────────────────────────────────────────────────────┘

Dialog "Delete Legacy Portal?"             role="alertdialog"
┌──────────────────────────────────────┐
│ Type OLD to confirm  [_______]       │  MSG-PROJECT-10
│           [ Cancel ] [Delete project]│  enabled when the key is typed
└──────────────────────────────────────┘
```

## Fields

| Field                                   | Input type | Required | Client validation | Message        | Notes                                                                          |
| --------------------------------------- | ---------- | -------- | ----------------- | -------------- | ------------------------------------------------------------------------------ |
| Search projects                         | `search`   | no       | —                 | —              | Key or name; filters as you type                                               |
| Status                                  | select     | no       | —                 | —              | All (default), Active, Archived                                                |
| Type KEY to confirm                     | `text`     | yes      | Equals the key    | MSG-PROJECT-10 | Delete dialog only                                                             |
| New project admin                       | select     | yes      | A user is chosen  | MSG-ADMIN-17   | Options from `GET /api/users` (active users only); Change project admin dialog |
| Make the current project admins members | checkbox   | no       | —                 | —              | Sent as `demoteCurrent`; off by default                                        |
| New project fields                      | —          | —        | —                 | —              | As in SCR-PROJECT-01                                                           |

## Actions

| Action                                          | Result                                                                                                                                   | Criteria      |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Open the page                                   | `GET /api/admin/projects?status=all`                                                                                                     | AC-ADMIN-02   |
| Type in search / change status                  | List reloads with `search` / `status`                                                                                                    |               |
| "Open"                                          | `/projects/<KEY>` in the User UI                                                                                                         |               |
| More → "Archive"                                | `POST /api/projects/<KEY>/archive` with `{}`; toast MSG-PROJECT-19 "Changes saved"; row shows Archived                                   |               |
| More → "Restore"                                | `POST /api/projects/<KEY>/restore`; toast MSG-PROJECT-19                                                                                 |               |
| More → "Delete", type the key, "Delete project" | `DELETE /api/projects/<KEY>`; toast; row gone. A project with releases is refused by the API (`DELETE_NOT_ALLOWED`), shown in the dialog | BR-PROJECT-09 |
| Cancel, ✕ or Esc in the dialog                  | Closes without deleting                                                                                                                  |               |
| "New project" → fill in → "Create"              | `POST /api/projects`; dialog closes, toast MSG-PROJECT-19, the list reloads with the new project; the page stays open                    | AC-ADMIN-12   |
| More → "Change project admin" → choose → "Save" | `POST /api/admin/projects/<KEY>/project-admin` with `userId` and `demoteCurrent`; dialog closes, toast MSG-PROJECT-19                    | AC-ADMIN-09   |
| Change project admin, server error              | Alert with the error text in the dialog (MSG-ADMIN-17 for an unknown or deactivated user, MSG-PROJECT-08 for an archived project)        |               |

## States

| State         | What the user sees                                                 | Criteria    |
| ------------- | ------------------------------------------------------------------ | ----------- |
| Loading       | Filters only, no table yet                                         |             |
| No match      | Empty state heading MSG-PROJECT-20 "No projects match your search" |             |
| Error         | API error text in an alert above the table                         |             |
| No permission | "Page not found" (as SCR-ADMIN-01)                                 | AC-ADMIN-01 |
| Success       | Rows, active first then archived                                   | AC-ADMIN-02 |

## Permissions

| Role  | Can see               | Can do                                                                                     |
| ----- | --------------------- | ------------------------------------------------------------------------------------------ |
| Admin | Every project         | Create, open, change project admin (active only), archive, restore, delete (archived only) |
| User  | "Page not found" only | —                                                                                          |

## Accessibility

- Page title "Projects · QA Work Management"; one `<h1>` "Projects".
- Table caption (visually hidden) "All projects"; the actions column header is visually hidden "Actions".
- "Open" links are named "Open `<project name>`"; the row menu button is named "Actions for `<project name>`"
  (visible text "More").
- Delete uses `role="alertdialog"` labelled by its title; focus returns to the menu button on close.
- "New project" and "Change project admin" use `role="dialog"` labelled by their titles; the checkbox has its
  label as visible text.
- Statuses are text badges.

## Responsive

The filters wrap; the table scrolls horizontally inside its card below 1024 px.

## Locators for tests

`getByRole('heading', { level: 1, name: 'Projects' })`, `getByRole('searchbox', { name: 'Search projects' })`,
`getByRole('combobox', { name: 'Status' })` (`selectOption('archived')`), `getByRole('table', { name: 'All projects' })`,
`getByRole('row', { name: /Legacy Portal/ })`, `getByRole('link', { name: 'Open ShopEase Web' })`,
`getByRole('button', { name: 'Actions for Legacy Portal' })`, `getByRole('menuitem', { name: 'Restore' })`,
`getByRole('alertdialog', { name: 'Delete Legacy Portal?' })`, `getByLabel('Type OLD to confirm')`,
`getByRole('button', { name: 'Delete project' })`, `getByRole('button', { name: 'New project' })`,
`getByRole('dialog', { name: 'New project' })`, `getByRole('menuitem', { name: 'Change project admin' })`,
`getByRole('dialog', { name: 'Change project admin of ShopEase Web' })`, `getByLabel('New project admin')`,
`getByRole('checkbox', { name: 'Make the current project admins members' })`, `getByRole('button', { name: 'Save' })`. Inside the Admin nav the "Projects" link is
`getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Projects' })`.

## Change log

| Date       | Change                                                                            | Why                      |
| ---------- | --------------------------------------------------------------------------------- | ------------------------ |
| 2026-10-09 | First version                                                                     | Phase 3C                 |
| 2026-10-09 | "New project" button and dialog; row action "Change project admin" (API-ADMIN-12) | BR-ADMIN-18, BR-ADMIN-04 |
