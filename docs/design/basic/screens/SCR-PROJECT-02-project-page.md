---
id: SCR-PROJECT-02
title: Project page frame (header, banners, project dialogs)
type: screen
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /projects/:key/*
traces:
  requirements:
    [
      US-PROJECT-03,
      US-PROJECT-04,
      US-PROJECT-06,
      US-PROJECT-07,
      US-PROJECT-12,
      BR-PROJECT-03,
      BR-PROJECT-04,
      BR-PROJECT-05,
      BR-PROJECT-06,
      BR-PROJECT-07,
      BR-PROJECT-08,
      BR-PROJECT-09,
      BR-PROJECT-34,
      BR-PROJECT-35,
      BR-PROJECT-50,
      BR-ADMIN-05,
      BR-GUEST-03,
      BR-GUEST-06,
    ]
  acceptance:
    [
      AC-PROJECT-15,
      AC-PROJECT-16,
      AC-PROJECT-17,
      AC-PROJECT-19,
      AC-PROJECT-20,
      AC-PROJECT-21,
      AC-PROJECT-22,
      AC-PROJECT-30,
      AC-PROJECT-32,
      AC-PROJECT-33,
      AC-PROJECT-35,
      AC-PROJECT-64,
      AC-PROJECT-111,
      AC-PROJECT-112,
      AC-PROJECT-113,
      AC-PROJECT-114,
      AC-PROJECT-115,
      AC-ADMIN-03,
      AC-GUEST-01,
    ]
  api: [API-PROJECT-03, API-PROJECT-04, API-PROJECT-05, API-PROJECT-06, API-PROJECT-07]
  design:
    [
      SCR-SHELL-01,
      SCR-DASH-01,
      SCR-PROJECT-03,
      SCR-PROJECT-04,
      SCR-PROJECT-05,
      FLW-PROJECT-03,
      FLW-PROJECT-05,
      DD-PROJECT-01,
      DD-PROJECT-03,
    ]
updated: 2026-10-10
---

# SCR-PROJECT-02 Project page frame (header, banners, project dialogs)

The frame around every page of one project (`/projects/:key/*`): the header, the banners, the current milestone
line and the project-level dialogs (edit, archive, restore, delete). Follows ISO 9241-110 and WCAG 2.2 AA.

What goes inside the frame is another screen: Dashboard [SCR-DASH-01](SCR-DASH-01-project-dashboard.md) at
`/projects/:key`, Releases & sprints SCR-PROJECT-04, Members SCR-PROJECT-03, Activity SCR-PROJECT-05, Project settings
(screen in design, ID reserved in the screen inventory). There is **no tab bar**: the side nav of the app shell ([SCR-SHELL-01](SCR-SHELL-01-app-shell.md)) is
the only way between these pages, and it marks the current one (BR-PROJECT-50). Each inner page starts with its own
`<h2>`, so the frame needs no section title.

## Layout

```
┌──────────────────┬──────────────────────────────────────────────────────────────────┐
│ side nav (Main)  │  ShopEase Web  SHOP  [Project admin] [Archived]   [ Edit ] [More ▾] │ <h1> name, key, my-access badge
│  Dashboard   ◀── │  You are viewing this project as Admin                             │ MSG-ADMIN-08, System admin not a member
│  Releases &…     │  This project is archived. Restore it to make changes. [Restore]   │ only when archived, amber
│  Members         │  Current: Sprint 4 · release 2.4 · 3 days left                     │ or "Overdue by 2 days"
│  Activity        │  ── page of the current side nav item ───────────────────────────  │
│  Project settings│  <h2> Members …                                                    │
└──────────────────┴──────────────────────────────────────────────────────────────────┘
More ▾ (Project admins and System admins): Archive / Restore, Delete (only when archived)
Badge: "Project admin", "Member" or "Guest" (my access); "System admin" for a System admin who is not a member
Below 768 px: [ Actions ▾ ] replaces Edit and More, with the same items (Edit, Archive / Restore, Delete)

Dialog "Edit project": Key (read-only text), Name, Description, [Cancel] [Save]
Dialog "Archive project?": explains read-only effect, [Cancel] [Archive]
Dialog "Delete project?": warning, "Type SHOP to confirm" [______], [Cancel] [Delete] (disabled until it matches)
```

The Danger zone of Project settings reuses the archive and delete dialogs of this screen.

## Fields

| Field                       | Input type     | Required | Client validation               | Message        | Notes                                                       |
| --------------------------- | -------------- | -------- | ------------------------------- | -------------- | ----------------------------------------------------------- |
| Key (edit dialog)           | read-only text | —        | —                               | —              | Not an input (BR-PROJECT-03)                                |
| Name                        | `text`         | yes      | 3–100 characters after trimming | MSG-PROJECT-03 |                                                             |
| Description                 | `textarea`     | no       | at most 2000 characters         | MSG-PROJECT-05 | Counter "n / 2000" under the field                          |
| Confirm key (delete dialog) | `text`         | yes      | equals the project key exactly  | MSG-PROJECT-10 | MSG-PROJECT-10 is the label; no error text while typing (1) |

(1) The Delete button stays disabled until the key matches, which already shows the state. A red error before the
user has finished typing would blame them for an unfinished input (ISO 9241-110, error tolerance).

## Actions

| Action                                                    | Result                                                                             | Criteria                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------- |
| Open `/projects/SHOP`                                     | `GET /api/projects/SHOP`; header, then the dashboard; side nav "Dashboard" current | AC-PROJECT-15, AC-PROJECT-111 |
| Click an item in the side nav                             | Its page opens inside the same frame; that item is current                         | AC-PROJECT-112                |
| Open a key you can't see                                  | "Project not found" page with a link back to Projects                              | AC-PROJECT-16, AC-PROJECT-114 |
| Edit → Save                                               | `PATCH` with `version`; dialog closes, toast MSG-PROJECT-19                        | AC-PROJECT-19                 |
| Save, server 409                                          | Alert MSG-PROJECT-07 in the dialog, input kept, "Reload" button refetches          | AC-PROJECT-21                 |
| More → Archive → confirm                                  | `POST …/archive`; toast MSG-PROJECT-50; banner appears, write buttons go           | AC-PROJECT-30, AC-PROJECT-113 |
| Restore (banner or More)                                  | `POST …/restore`; toast MSG-PROJECT-51; banner goes, buttons return                | AC-PROJECT-32, AC-PROJECT-113 |
| More → Delete (archived only) → type key → Delete         | `DELETE`; go to `/projects`, toast MSG-PROJECT-52                                  | AC-PROJECT-35, AC-PROJECT-113 |
| Delete with a wrong or unfinished key typed               | Delete stays disabled; no error text                                               | AC-PROJECT-35                 |
| Restore or archive fails                                  | Error text in an alert under the banners                                           |                               |
| Below 768 px: Actions → Edit / Archive / Restore / Delete | Same as the matching Edit or More item                                             | AC-PROJECT-115                |

## States

| State                      | What the user sees                                                                                                                              | Criteria                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Loading                    | Header skeleton (`aria-busy="true"`)                                                                                                            |                               |
| Not found / not a member   | Heading MSG-PROJECT-06, line MSG-PROJECT-53, "Back to projects"; same for both                                                                  | AC-PROJECT-16, AC-PROJECT-114 |
| Error                      | The error text (MSG-COMMON-01 when the server gives none) with "Try again"                                                                      |                               |
| System admin, not a member | Badge "System admin"; banner MSG-ADMIN-08 under the header on every page (`role="status"`)                                                      | AC-ADMIN-03                   |
| Member (read only)         | No Edit, More or Actions; no "Project settings" in the side nav                                                                                 | AC-PROJECT-17, AC-PROJECT-22  |
| Guest                      | Badge "Guest"; no Edit, More or Actions; the side nav lists only the areas switched on for Guests                                               | AC-GUEST-01                   |
| Guest, area switched off   | That page (dashboard included) answers "Page not found" (MSG-COMMON-13), like the API's 404                                                     | AC-GUEST-01                   |
| Archived                   | Badge "Archived"; amber banner MSG-PROJECT-08 with Restore (Project admins and System admins); no Edit; every write button hidden on every page | AC-PROJECT-30                 |
| Active milestone           | "Current: <milestone> · release <name> · N days left" or "Overdue by N days"                                                                    | AC-PROJECT-64                 |
| No active milestone        | Line hidden                                                                                                                                     |                               |
| Success                    | Toast MSG-PROJECT-19 (save), MSG-PROJECT-50 (archive), MSG-PROJECT-51 (restore), MSG-PROJECT-52 (delete)                                        | AC-PROJECT-19, AC-PROJECT-113 |

## Permissions

| Access level                | Can see                                                   | Can do                         |
| --------------------------- | --------------------------------------------------------- | ------------------------------ |
| Project admin, System admin | The frame on every page                                   | Edit, archive, restore, delete |
| Member (any job title)      | The frame on every page except Project settings           | Nothing in the frame           |
| Guest                       | The frame on the pages of areas switched on (BR-GUEST-03) | Nothing (BR-GUEST-04)          |
| Not a member                | "Project not found"                                       | —                              |

The API checks every action again (DD-PROJECT-01); hiding a button is not the security.

## Accessibility

- Page title "<Name> · Projects · QA Work Management" (inner pages may add their name in front); "Project not
  found · QA Work Management" on the not-found page. `<h1>` is the project name; key and badges are text.
- Landmarks come from the app shell: side nav `nav` "Main" (current item has `aria-current="page"`), `main` holds
  the frame and the page.
- The archived banner and the "viewing as Admin" banner are `role="status"`. Archived is said in words ("Archived"
  badge, banner text), not only by colour.
- Dialogs: `role="dialog"` (edit) / `role="alertdialog"` (archive, delete), focus trapped and returned to the
  button that opened them. The delete field's requirement is its label: "Type SHOP to confirm".
- More and Actions are buttons with `aria-haspopup="menu"`; items reachable with arrow keys; Esc closes and returns
  focus to the button.
- "3 days left" is text; overdue is shown with the word "Overdue", not only red.
- Contrast: banner text on the amber tint and the admin banner both at least 4.5:1.

## Responsive

Below 768 px the header wraps (name on one line, badges below) and Edit and More become one "Actions" menu. The side
nav's own behaviour on narrow screens belongs to SCR-SHELL-01.

## Locators for tests

`getByRole('heading', { level: 1 })`; side nav: `getByRole('navigation', { name: 'Main' })` then
`getByRole('link', { name: 'Dashboard' })` (also "Releases & sprints", "Members", "Activity", "Project settings"),
current one `toHaveAttribute('aria-current', 'page')`; `getByRole('button', { name: 'Edit' })`,
`getByRole('button', { name: 'More' })`, `getByRole('button', { name: 'Actions' })` (narrow screen),
`getByRole('menuitem', { name: 'Archive' })`, `getByRole('dialog', { name: 'Edit project' })`,
`getByRole('alertdialog', { name: 'Archive project?' })`, `getByRole('alertdialog', { name: 'Delete project?' })`,
`getByLabel('Type SHOP to confirm')`, `getByText(msg('MSG-PROJECT-08'))`, `getByText(msg('MSG-ADMIN-08'))`, toasts
`getByText(msg('MSG-PROJECT-50'))` etc.

## Change log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                               | Why                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 2026-10-08 | First version                                                                                                                                                                                                                                                                                                                                                                                                        | Phase 3A                                                                    |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                                                                                                                                                                                                                                                                                                                              | Linh's decision 2026-10-09                                                  |
| 2026-10-09 | Dashboard tab replaces Overview; tab "Releases & sprints"; Settings tab (Project details, Guests); tabs hidden for Guests by area; banner MSG-ADMIN-08                                                                                                                                                                                                                                                               | Phase 3C (BR-DASH-01, BR-GUEST-02, BR-GUEST-03, BR-ADMIN-05)                |
| 2026-10-10 | Frame only: Dashboard content is SCR-DASH-01, Settings content moves to the Project settings screen. Tab bar removed, side nav is the only section nav (BR-PROJECT-50, AC-PROJECT-111/112). Toasts MSG-PROJECT-50/51/52 for archive, restore, delete; not-found page title and line MSG-PROJECT-53; no error while typing the delete key; amber archived banner; "Actions" menu below 768 px (AC-PROJECT-113 to 115) | Screen review REV-SCR-PROJECT-02 (F-01 to F-08), Linh's decision 2026-10-10 |
