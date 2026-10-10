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
      US-PROJECT-01,
      BR-ADMIN-01,
      BR-ADMIN-03,
      BR-ADMIN-04,
      BR-ADMIN-14,
      BR-ADMIN-18,
      BR-PROJECT-01,
      BR-PROJECT-02,
      BR-PROJECT-03,
      BR-PROJECT-04,
      BR-PROJECT-08,
      BR-PROJECT-09,
      BR-PROJECT-36,
    ]
  acceptance:
    [
      AC-ADMIN-01,
      AC-ADMIN-02,
      AC-ADMIN-09,
      AC-ADMIN-12,
      AC-ADMIN-23,
      AC-ADMIN-24,
      AC-ADMIN-25,
      AC-ADMIN-26,
      AC-ADMIN-27,
      AC-PROJECT-01,
      AC-PROJECT-02,
      AC-PROJECT-03,
      AC-PROJECT-05,
      AC-PROJECT-06,
      AC-PROJECT-72,
    ]
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
  design: [SCR-ADMIN-01, SCR-PROJECT-02, FLW-PROJECT-01, FLW-PROJECT-03]
updated: 2026-10-10
---

# SCR-ADMIN-02 Admin projects

Admin console › Projects: every project of the workspace, archived included, for System admins only (BR-ADMIN-01,
BR-ADMIN-03). It is the only place where projects are created (BR-ADMIN-18) and where a System admin hands a project
to a new Project admin (BR-ADMIN-04). From a row the System admin opens the project in the User UI, archives,
restores or deletes it; these call the normal project endpoints, where a System admin acts as Project admin
(BR-PROJECT-36) and every write is audited as Admin (BR-ADMIN-14). Archive and Delete use the same dialogs as the
User UI (FLW-PROJECT-03). The Admin console layout (top bar, side nav) is specified in
[SCR-ADMIN-01](SCR-ADMIN-01-all-projects-dashboard.md).

Sub-screens in this document (R-SCR-03): dialogs **New project**, **Change project admin**, **Archive project?** and
**Delete project?**.

Follows ISO 9241-110:2020 (interaction principles), WCAG 2.2 level AA, and ISO/IEC/IEEE 29148:2018 for traceability
(every behaviour below names its rule or criterion).

## Layout

```
Projects                                                                       [ New project ]   <h1>
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Search projects [Key or name____]   Status [All ▾]                                           │  kept in ?q= &status=
│ (alert: error of a row action)                                                               │
│ Project           | Status   | Project admins   | Members | Release    | Sprint      | Last activity     |            │
│ ShopEase Web SHOP | Active   | Oanh Owner, Mai PM | 8     | 2.4        | Sprint 4    | 9 Oct 2026, 14:05 | [Open] [More ▾] │
│                   |          |                  |         | Target 29 Oct 2026 | Ends 12 Oct 2026 |   |            │
│ Legacy Portal OLD | Archived | Minh Lead        | 2       | —          | —           | …                 | [Open] [More ▾] │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
More ▾ (active project): Change project admin, Archive        More ▾ (archived project): Restore, Delete

Empty workspace:  MSG-ADMIN-20 + [ New project ]
No match:         "No projects match your search" (MSG-PROJECT-20)
Loading:          "Loading projects…" (role="status")
```

### Dialog "New project"

```
┌──────────────────────────────────────┐   role="dialog", labelled by its title
│ New project                       ✕  │
│ Key          [______]                │   hint: 2–10 letters or digits, starting with a letter.
│              field message           │         It can't be changed later.
│ Name         [__________________]    │
│              field message           │
│ First project admin [Choose a user ▾]│   select: "name (email)", required
│              field message           │
│ Description  [__________________]    │   textarea, optional, counter "n / 2000"
│              [ Cancel ] [ Create ]   │
└──────────────────────────────────────┘
```

### Dialog "Change project admin of ShopEase Web"

```
┌──────────────────────────────────────────────────────┐   role="dialog"
│ Current project admins: Oanh Owner, Mai PM           │
│ New project admin  [Choose a user ▾]                 │   "name (email)"; current ones end with "· project admin"
│   hint MSG-ADMIN-21 when nothing would change        │
│ [ ] Make the current project admins members          │   off by default
│                                 [ Cancel ] [ Save ]  │
└──────────────────────────────────────────────────────┘
```

### Dialog "Archive project?" (same as SCR-PROJECT-02)

```
┌────────────────────────────────────────────────────────────┐   role="alertdialog"
│ Archive project?                                        ✕  │
│ Internal Tools becomes read-only for everyone and leaves   │
│ the project list. A project admin can restore it any time. │
│                                   [ Cancel ] [ Archive ]   │
└────────────────────────────────────────────────────────────┘
```

### Dialog "Delete project?" (same as SCR-PROJECT-02, plus the rule)

```
┌────────────────────────────────────────────────────────────┐   role="alertdialog"
│ Delete project?                                         ✕  │
│ Legacy Portal and its members and activity are deleted for │
│ good. This can't be undone.                                │
│ Only an archived project with no releases can be deleted.  │   MSG-PROJECT-09
│ Type OLD to confirm [________]                             │   MSG-PROJECT-10
│                                    [ Cancel ] [ Delete ]   │   Delete enabled once the key is typed
└────────────────────────────────────────────────────────────┘
```

## Data

Columns come from `GET /api/admin/projects` (API-ADMIN-02), one request per filter change.

| Column         | Source field                                      | Shown as                                                                          |
| -------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| Project        | `name`, `key`                                     | Name in bold, key in mono                                                         |
| Status         | `archived`                                        | Text badge "Active" or "Archived"                                                 |
| Project admins | `projectAdmins[].name`                            | Comma-separated names, "—" if none                                                |
| Members        | `memberCount`                                     | Number                                                                            |
| Release        | `activeRelease.name`, `activeRelease.targetDate`  | Name, below it "Target 29 Oct 2026" or "No target date"; "—" if no active release |
| Sprint         | `activeMilestone.name`, `activeMilestone.endDate` | Name, below it "Ends 12 Oct 2026"; "—" if no active sprint                        |
| Last activity  | `lastActivityAt`                                  | "9 Oct 2026, 14:05", "—" if none                                                  |

Order: active projects first, then archived; by name inside each (API-ADMIN-02).

## Fields

| Field                                    | Input type                            | Required | Client validation                        | Message                                        | Notes                                                                                            |
| ---------------------------------------- | ------------------------------------- | -------- | ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Search projects                          | `search`                              | no       | At most 100 characters                   | —                                              | Key or name, case-insensitive; applied 300 ms after the last key or on Enter; `?q=`              |
| Status                                   | select                                | no       | —                                        | —                                              | All (default), Active, Archived; `?status=` (absent for All)                                     |
| Key (New project)                        | `text`, `autocapitalize="characters"` | yes      | `^[A-Za-z][A-Za-z0-9]{1,9}$`             | MSG-PROJECT-01, MSG-PROJECT-02, MSG-PROJECT-04 | Shown upper-case as you type (BR-PROJECT-02); unique, never changes (BR-PROJECT-03)              |
| Name (New project)                       | `text`                                | yes      | 3–100 characters after trimming          | MSG-PROJECT-03                                 | BR-PROJECT-04                                                                                    |
| First project admin (New project)        | select                                | yes      | A user is chosen                         | MSG-PROJECT-33                                 | Active users from `GET /api/users` (API-USER-01); becomes the only Project admin (BR-PROJECT-01) |
| Description (New project)                | `textarea`                            | no       | At most 2000 characters                  | MSG-PROJECT-05                                 | Counter below                                                                                    |
| New project admin (Change project admin) | select                                | yes      | A user is chosen; something would change | MSG-ADMIN-17, MSG-ADMIN-21                     | Active users from API-USER-01; current Project admins end with "· project admin"                 |
| Make the current project admins members  | checkbox                              | no       | —                                        | —                                              | Sent as `demoteCurrent`; off by default                                                          |
| Type KEY to confirm (Delete)             | `text`                                | yes      | Equals the key                           | MSG-PROJECT-10                                 | BR-PROJECT-09                                                                                    |

## Actions

| Action                                                                                   | Result                                                                                                                                                               | Criteria                                    |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Open the page                                                                            | `GET /api/admin/projects` with `search` and `status` from the URL                                                                                                    | AC-ADMIN-02                                 |
| Type in Search / change Status                                                           | URL updated in place (`?q=`, `?status=`), list reloads                                                                                                               | AC-ADMIN-26                                 |
| "Open", then Back                                                                        | `/projects/<KEY>` in the User UI; Back returns to the list with the same search and status                                                                           | AC-ADMIN-26                                 |
| "New project"                                                                            | Dialog opens, focus in Key                                                                                                                                           | AC-ADMIN-12, AC-PROJECT-01                  |
| "Create" with errors                                                                     | Messages under the fields, no request; focus on the first invalid field                                                                                              | AC-PROJECT-02, AC-PROJECT-03, AC-PROJECT-06 |
| "Create", server 201                                                                     | `POST /api/projects`; dialog closes, toast MSG-PROJECT-19; the list reloads with the new project and the System admin stays on this page                             | AC-ADMIN-12, AC-PROJECT-01                  |
| "Create", server 409 `KEY_TAKEN`                                                         | MSG-PROJECT-04 under Key, focus on Key                                                                                                                               | AC-PROJECT-05                               |
| "Create", server 400 at `/firstAdminId`                                                  | MSG-PROJECT-33 under First project admin                                                                                                                             | AC-PROJECT-72                               |
| More → "Change project admin" → choose → "Save"                                          | `POST /api/admin/projects/<KEY>/project-admin` with `userId`, `demoteCurrent`; dialog closes, toast MSG-PROJECT-19, list reloads                                     | AC-ADMIN-09                                 |
| Change project admin: choose a current Project admin, box off (or they are the only one) | MSG-ADMIN-21 under the select; "Save" disabled                                                                                                                       | AC-ADMIN-25                                 |
| Change project admin, server error                                                       | Alert in the dialog: MSG-ADMIN-17 (unknown or deactivated user), MSG-PROJECT-08 (archived project)                                                                   |                                             |
| More → "Archive"                                                                         | Dialog "Archive project?"; "Archive" → `POST /api/projects/<KEY>/archive`; toast MSG-PROJECT-50; row shows Archived                                                  | AC-ADMIN-23                                 |
| More → "Restore"                                                                         | `POST /api/projects/<KEY>/restore` at once (reversible, no dialog); toast MSG-PROJECT-51; row shows Active                                                           |                                             |
| More → "Delete", type the key, "Delete"                                                  | `DELETE /api/projects/<KEY>`; toast MSG-PROJECT-52; row gone; the System admin stays on this page. A project with releases is refused (MSG-PROJECT-09) in the dialog | AC-ADMIN-24                                 |
| Cancel, ✕ or Esc in any dialog                                                           | Closes without saving; focus back on the button that opened it                                                                                                       |                                             |

## States

| State                            | What the user sees                                                                           | Criteria    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| Loading                          | Filters, then "Loading projects…" in `role="status"`                                         |             |
| Empty (workspace has no project) | Heading MSG-ADMIN-20 and a "New project" button                                              | AC-ADMIN-27 |
| No match                         | Heading MSG-PROJECT-20 "No projects match your search"                                       |             |
| Error (list)                     | API error text in an alert in place of the table                                             |             |
| Error (row action)               | Alert above the table (Restore) or inside the dialog (Archive, Delete, Change project admin) |             |
| No permission                    | "Page not found" (MSG-COMMON-13), API 404, as for any unknown route                          | AC-ADMIN-01 |
| Success                          | Rows as in [Data](#data)                                                                     | AC-ADMIN-02 |
| Saving                           | The dialog's confirm button is disabled while its request runs                               |             |

## Permissions

| Role                                       | Can see               | Can do                                                                                                   |
| ------------------------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------- |
| System admin (global `ADMIN`)              | Every project         | Create; open; change project admin and archive (active projects); restore and delete (archived projects) |
| Anyone else (Project admin, Member, Guest) | "Page not found" only | — (BR-ADMIN-01; creating a project through the API returns 403 MSG-ADMIN-09, BR-ADMIN-18)                |

## Messages

Shown on this screen; texts are kept in [admin messages](../../../requirements/admin/messages.md) and
[project messages](../../../requirements/project/messages.md).

- Empty workspace: MSG-ADMIN-20. No match: MSG-PROJECT-20.
- New project: MSG-PROJECT-01 to MSG-PROJECT-05 (fields), MSG-PROJECT-33 (first project admin).
- Change project admin: MSG-ADMIN-17 (unknown or deactivated user), MSG-ADMIN-21 (nothing would change),
  MSG-PROJECT-08 (archived project).
- Delete: MSG-PROJECT-09 (rule and refusal), MSG-PROJECT-10 (confirmation label).
- Toast after create and change project admin: MSG-PROJECT-19; after archive, restore, delete: MSG-PROJECT-50, 51, 52 (shared dialogs of SCR-PROJECT-02).

## Accessibility

- Page title "Projects · QA Work Management"; one `<h1>` "Projects".
- Landmarks: the Admin console `header`, `nav` (named "Admin") and `main` (SCR-ADMIN-01).
- Tab order: New project → Search projects → Status → for each row, Open → More.
- The table has a visually hidden caption "All projects"; column headers are `<th scope="col">`; the actions column
  header is visually hidden "Actions".
- "Open" links are named "Open `<project name>`"; each row menu button is named "Actions for `<project name>`"
  (visible text "More"). The menu follows the ARIA menu button pattern; choosing an item puts focus back on the
  button, so a dialog it opens returns focus there on close.
- Dialogs use the native `<dialog>` (`showModal()`): focus is trapped inside, Esc closes. "New project" and
  "Change project admin" are `role="dialog"`; "Archive project?" and "Delete project?" are `role="alertdialog"`.
  All are labelled by their title; Archive and Delete are described by their text.
- New project: focus starts in Key; field errors are linked with `aria-describedby` and `aria-invalid="true"`;
  on submit with errors, focus moves to the first invalid field. MSG-ADMIN-21 is the select's hint, linked with
  `aria-describedby`.
- Loading is announced through `role="status"`; empty and no-match headings are `<h2>` in a labelled section.
- Statuses are text badges, not colour only; text contrast at least 4.5:1.

## Responsive

The filters wrap. Below 1024 px the table scrolls horizontally inside its card. Dialogs take the full width minus
16 px gutters on small screens. Collapsing the Admin side nav below 768 px belongs to the Admin layout
(SCR-ADMIN-01).

## Locators for tests

Page: `getByRole('heading', { level: 1, name: 'Projects' })`, `getByRole('searchbox', { name: 'Search projects' })`,
`getByRole('combobox', { name: 'Status' })` (`selectOption('archived')`), `getByRole('table', { name: 'All projects' })`,
`getByRole('columnheader', { name: 'Release' })`, `getByRole('columnheader', { name: 'Sprint' })`,
`getByRole('row', { name: /Legacy Portal/ })`, `getByRole('link', { name: 'Open ShopEase Web' })`,
`getByRole('button', { name: 'Actions for Legacy Portal' })`, `getByRole('menuitem', { name: 'Restore' })`,
`getByRole('status')` (loading), `getByRole('heading', { name: 'No projects in this workspace yet' })`. Inside the Admin nav:
`getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Projects' })`.

New project: `getByRole('button', { name: 'New project' })`, `getByRole('dialog', { name: 'New project' })`,
`getByLabel('Key')`, `getByLabel('Name')`, `getByLabel('First project admin')`, `getByLabel('Description')`,
`getByRole('button', { name: 'Create' })`.

Change project admin: `getByRole('menuitem', { name: 'Change project admin' })`,
`getByRole('dialog', { name: 'Change project admin of ShopEase Web' })`, `getByLabel('New project admin')`,
`getByRole('checkbox', { name: 'Make the current project admins members' })`, `getByRole('button', { name: 'Save' })`.

Archive and Delete: `getByRole('menuitem', { name: 'Archive' })`, `getByRole('alertdialog', { name: 'Archive project?' })`,
`getByRole('alertdialog', { name: 'Delete project?' })`, `getByLabel('Type OLD to confirm')`, and inside the
dialog `getByRole('button', { name: 'Archive' })` / `getByRole('button', { name: 'Delete' })`. No `data-testid` needed.

## Change log

| Date       | Change                                                                                                                                                                                                                                                                        | Why                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 2026-10-09 | First version                                                                                                                                                                                                                                                                 | Phase 3C                                                          |
| 2026-10-09 | "New project" button and dialog; row action "Change project admin" (API-ADMIN-12)                                                                                                                                                                                             | BR-ADMIN-18, BR-ADMIN-04                                          |
| 2026-10-10 | Review C1–C8: Archive and Delete use the User UI dialogs; Release and Sprint columns; empty, loading states; Change project admin marks current admins and blocks a no-op; filters in the URL; New project dialog spec moved here from SCR-PROJECT-01; full template sections | Linh's screen review (thread "Man hinh Admin projects"), R-SCR-03 |
| 2026-10-10 | Archive, restore and delete toasts are MSG-PROJECT-50, 51, 52 (shared with SCR-PROJECT-02)                                                                                                                                                                                    | SCR-PROJECT-02 review F-03                                        |
