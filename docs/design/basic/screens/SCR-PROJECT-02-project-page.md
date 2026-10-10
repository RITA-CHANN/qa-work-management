---
id: SCR-PROJECT-02
title: Project page (header, dashboard, project dialogs)
type: screen
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /projects/:key
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
      US-DASH-01,
      BR-DASH-01,
      BR-ADMIN-05,
      US-GUEST-01,
      BR-GUEST-02,
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
      AC-DASH-04,
      AC-ADMIN-03,
      AC-GUEST-01,
      AC-GUEST-02,
      AC-GUEST-05,
    ]
  api:
    [API-PROJECT-03, API-PROJECT-04, API-PROJECT-05, API-PROJECT-06, API-PROJECT-07, API-PROJECT-13]
  design: [FLW-PROJECT-03, FLW-PROJECT-05, DD-PROJECT-01, DD-PROJECT-03, SCR-DASH-01]
updated: 2026-10-09
---

# SCR-PROJECT-02 Project page (header, dashboard, project dialogs)

The page of one project. The header and tabs are shared by every tab; this doc covers the header, the
**Dashboard** tab (the project home, which embeds [SCR-DASH-01](SCR-DASH-01-project-dashboard.md) and replaces the
3A Overview, BR-DASH-01) and the project-level dialogs (edit, archive, restore, delete). Other
tabs: SCR-PROJECT-03 Members, SCR-PROJECT-04 Releases & sprints, SCR-PROJECT-05 Activity,
[SCR-PROJECT-06 Project settings](SCR-PROJECT-06-project-settings.md) (which reuses the archive and delete dialogs).

## Layout

```
┌──────────┬────────────────────────────────────────────────────────────────────────────┐
│ nav      │  ShopEase Web  SHOP  [Project admin]              [ Edit ] [ ⋯ More ▾ ]     │ <h1> name, key, my-access badge
│          │  You are viewing this project as Admin                                     │ MSG-ADMIN-08, System admin not a member
│          │  ⚠ This project is archived. Restore it to make changes. [Restore]         │ banner only when archived
│          │  Current: Sprint 4 · release 2.4 · 3 days left                             │ or "Overdue by 2 days"
│          │  [ Dashboard ] [ Releases & sprints ] [ Members ] [ Activity ] [ Settings ] │ tabs (links, URL per tab)
│          │  ── Dashboard ─────────────────────────────────────────────────────────────  │
│          │  KPI row and cards of SCR-DASH-01 (without its own header)                  │
└──────────┴────────────────────────────────────────────────────────────────────────────┘
More ▾ (Project admins and System admins): Archive / Restore, Delete (only when archived)
Badge: "Project admin", "Member" or "Guest" (my access); "System admin" for a System admin who is not a member
Tabs: a Guest sees only the tabs of areas switched on for Guests; Settings only for Project admins and System admins

Settings tab: see SCR-PROJECT-06.

Dialog "Edit project": Key (read-only text), Name, Description, [Cancel] [Save]
Dialog "Archive project?": explains read-only effect, [Cancel] [Archive]
Dialog "Delete project?": warning, "Type SHOP to confirm" [______], [Cancel] [Delete] (disabled until it matches)
```

Routes: `/projects/:key` (Dashboard), `/projects/:key/releases`, `/projects/:key/members`,
`/projects/:key/activity`, `/projects/:key/settings`. A tab a person may not see answers with the "Page not found"
page (MSG-COMMON-13), the same as the API's 404 (BR-GUEST-03).

## Fields

| Field                       | Input type     | Required | Client validation               | Message        | Notes                                   |
| --------------------------- | -------------- | -------- | ------------------------------- | -------------- | --------------------------------------- |
| Key (edit dialog)           | read-only text | —        | —                               | —              | Not an input (BR-PROJECT-03)            |
| Name                        | `text`         | yes      | 3–100 characters after trimming | MSG-PROJECT-03 |                                         |
| Description                 | `textarea`     | no       | at most 2000 characters         | MSG-PROJECT-05 |                                         |
| Confirm key (delete dialog) | `text`         | yes      | equals the project key exactly  | MSG-PROJECT-10 | Delete button disabled until it matches |

## Actions

| Action                                            | Result                                                                    | Criteria      |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ------------- |
| Open `/projects/SHOP`                             | `GET /api/projects/SHOP`; header and the Dashboard tab                    | AC-PROJECT-15 |
| Open a key you can't see                          | "Project not found" page (MSG-PROJECT-06) with a link back to Projects    | AC-PROJECT-16 |
| Edit (header) → Save                              | `PATCH` with `version`; dialog closes, toast MSG-PROJECT-19               | AC-PROJECT-19 |
| Save, server 409                                  | Alert MSG-PROJECT-07 in the dialog, input kept, "Reload" button refetches | AC-PROJECT-21 |
| More → Archive → confirm                          | `POST …/archive`; banner appears, all write buttons disappear             | AC-PROJECT-30 |
| Restore (banner or More)                          | `POST …/restore`; banner goes, buttons return                             | AC-PROJECT-32 |
| More → Delete (archived only) → type key → Delete | `DELETE`; go to `/projects`, toast                                        | AC-PROJECT-35 |
| Delete with the wrong key typed                   | Delete stays disabled; MSG-PROJECT-10 under the field                     | AC-PROJECT-35 |

## States

| State                         | What the user sees                                                                                                                              | Criteria                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Loading                       | Header skeleton                                                                                                                                 |                              |
| Not found / not a member      | MSG-PROJECT-06 page, same for both                                                                                                              | AC-PROJECT-16                |
| Error                         | MSG-COMMON-01 with "Try again"                                                                                                                  |                              |
| System admin, not a member    | Banner MSG-ADMIN-08 under the header on every tab (`role="status"`)                                                                             | AC-ADMIN-03                  |
| Member (read only)            | No Edit, no More menu, no Settings tab                                                                                                          | AC-PROJECT-17, AC-PROJECT-22 |
| Guest                         | Badge "Guest"; only the tabs of areas switched on; no Edit, More or Settings; Dashboard shows only the cards of those areas                     | AC-GUEST-01                  |
| Guest, dashboard switched off | The Dashboard tab is hidden and `/projects/:key` shows "Page not found"                                                                         | AC-GUEST-01                  |
| Archived                      | Banner MSG-PROJECT-08 style text with Restore (Project admins only); every write button hidden on all tabs; Settings read-only (SCR-PROJECT-06) | AC-PROJECT-30                |
| Active milestone              | "Current: <milestone> · release <name> · N days left" or "Overdue by N days"                                                                    | AC-PROJECT-64                |
| No active milestone           | Line hidden                                                                                                                                     |                              |
| Success                       | Toast MSG-PROJECT-19 after a project save, MSG-GUEST-02 after a Guests save                                                                     | AC-PROJECT-19, AC-GUEST-02   |

## Permissions

| Access level                | Can see                                                | Can do                                                 |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Project admin, System admin | Every tab, Settings included                           | Edit, archive, restore, delete; change what Guests see |
| Member (any job title)      | Every tab except Settings                              | Nothing on these tabs                                  |
| Guest                       | The tabs of areas switched on for Guests (BR-GUEST-03) | Nothing (BR-GUEST-04)                                  |
| Not a member                | "Project not found"                                    | —                                                      |

## Accessibility

- Page title "<Name> · Projects · QA Work Management"; `<h1>` is the project name; the key and access badge are text.
- Tabs are links in a `nav` labelled "Project sections" with `aria-current="page"` on the active one (they change
  the URL, so they are links, not an ARIA tab widget).
- The archived banner and the "viewing as Admin" banner are `role="status"`.
- Dialogs: `role="dialog"` / `role="alertdialog"` (archive, delete), focus trapped and returned to the button that
  opened them. The delete field's requirement is in its label: "Type SHOP to confirm".
- The More menu is a button with `aria-haspopup="menu"`; items reachable with arrow keys; Esc closes.
- "3 days left" is text; overdue is shown with the word "Overdue", not only red.

## Responsive

Below 768 px the header wraps (name on one line, badges below); Edit and More become one "Actions" menu; tabs
scroll horizontally.

## Locators for tests

`getByRole('heading', { level: 1 })`, in `getByRole('navigation', { name: 'Project sections' })`:
`getByRole('link', { name: 'Dashboard' })`, `getByRole('link', { name: 'Releases & sprints' })`,
`getByRole('link', { name: 'Members' })`, `getByRole('link', { name: 'Activity' })`,
`getByRole('link', { name: 'Settings' })`; `getByRole('button', { name: 'Edit' })`,
`getByRole('button', { name: 'More' })`, `getByRole('menuitem', { name: 'Archive' })`,
`getByRole('dialog', { name: 'Edit project' })`, `getByRole('alertdialog', { name: 'Delete project?' })`,
`getByLabel('Type SHOP to confirm')`, `getByText('This project is archived', { exact: false })`,
`getByText(msg('MSG-ADMIN-08'))`. Settings locators: SCR-PROJECT-06.

## Change log

| Date       | Change                                                                                                                                                 | Why                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 2026-10-08 | First version                                                                                                                                          | Phase 3A                                                     |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                                                                | Linh's decision 2026-10-09                                   |
| 2026-10-09 | Dashboard tab replaces Overview; tab "Releases & sprints"; Settings tab (Project details, Guests); tabs hidden for Guests by area; banner MSG-ADMIN-08 | Phase 3C (BR-DASH-01, BR-GUEST-02, BR-GUEST-03, BR-ADMIN-05) |
| 2026-10-09 | Settings tab content moved to SCR-PROJECT-06                                                                                                           | Screen inventory v1.2                                        |
