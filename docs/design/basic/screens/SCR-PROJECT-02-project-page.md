---
id: SCR-PROJECT-02
title: Project page (header, overview, project dialogs)
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
    ]
  api: [API-PROJECT-03, API-PROJECT-04, API-PROJECT-05, API-PROJECT-06, API-PROJECT-07]
  design: [FLW-PROJECT-03, FLW-PROJECT-05, DD-PROJECT-01, DD-PROJECT-03]
updated: 2026-10-08
---

# SCR-PROJECT-02 Project page (header, overview, project dialogs)

The page of one project. The header and tabs are shared by every tab; this doc covers the header, the
**Overview** tab and the project-level dialogs (edit, archive, restore, delete). Other tabs: SCR-PROJECT-03
Members, SCR-PROJECT-04 Releases and milestones, SCR-PROJECT-05 Activity.

## Layout

```
┌──────────┬────────────────────────────────────────────────────────────────────┐
│ nav      │  ShopEase Web  SHOP  [QA lead]          [ Edit ] [ ⋯ More ▾ ]       │ <h1> name, key, my-role badge
│          │  ⚠ This project is archived. Restore it to make changes. [Restore] │ banner only when archived
│          │  Current: Sprint 4 · release 2.4 · 3 days left                     │ or "Overdue by 2 days"
│          │  [ Overview ] [ Members ] [ Releases & milestones ] [ Activity ]   │ tabs (links, URL per tab)
│          │  ── Overview ─────────────────────────────────────────────────────  │
│          │  Description text …                                                │
│          │  Members 8 · Active release 2.4 · Created by Oanh Owner, 2026-09-01 │
│          │  Recent activity (5 newest) …                      View all →      │
└──────────┴────────────────────────────────────────────────────────────────────┘
More ▾ (Owner only): Archive / Restore, Delete (only when archived)

Dialog "Edit project": Key (read-only text), Name, Description, [Cancel] [Save]
Dialog "Archive project?": explains read-only effect, [Cancel] [Archive]
Dialog "Delete project?": warning, "Type SHOP to confirm" [______], [Cancel] [Delete] (disabled until it matches)
```

Routes: `/projects/:key` (Overview), `/projects/:key/members`, `/projects/:key/releases`, `/projects/:key/activity`.

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
| Open `/projects/SHOP`                             | `GET /api/projects/SHOP`; header and Overview                             | AC-PROJECT-15 |
| Open a key you can't see                          | "Project not found" page (MSG-PROJECT-06) with a link back to Projects    | AC-PROJECT-16 |
| Edit → Save                                       | `PATCH` with `version`; dialog closes, toast MSG-PROJECT-19               | AC-PROJECT-19 |
| Save, server 409                                  | Alert MSG-PROJECT-07 in the dialog, input kept, "Reload" button refetches | AC-PROJECT-21 |
| More → Archive → confirm                          | `POST …/archive`; banner appears, all write buttons disappear             | AC-PROJECT-30 |
| Restore (banner or More)                          | `POST …/restore`; banner goes, buttons return                             | AC-PROJECT-32 |
| More → Delete (archived only) → type key → Delete | `DELETE`; go to `/projects`, toast                                        | AC-PROJECT-35 |
| Delete with the wrong key typed                   | Delete stays disabled; MSG-PROJECT-10 under the field                     | AC-PROJECT-35 |

## States

| State                    | What the user sees                                                                                | Criteria                     |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------- |
| Loading                  | Header skeleton                                                                                   |                              |
| Not found / not a member | MSG-PROJECT-06 page, same for both                                                                | AC-PROJECT-16                |
| Error                    | MSG-COMMON-01 with "Try again"                                                                    |                              |
| Read-only role           | No Edit, no More menu                                                                             | AC-PROJECT-17, AC-PROJECT-22 |
| Archived                 | Banner MSG-PROJECT-08 style text with Restore (Owner only); every write button hidden on all tabs | AC-PROJECT-30                |
| Active milestone         | "Current: <milestone> · release <name> · N days left" or "Overdue by N days"                      | AC-PROJECT-64                |
| No active milestone      | Line hidden                                                                                       |                              |
| Success                  | Toast MSG-PROJECT-19 after a save                                                                 | AC-PROJECT-19                |

## Permissions

| Role                                                   | Can see             | Can do                         |
| ------------------------------------------------------ | ------------------- | ------------------------------ |
| Owner, Admin                                           | Everything          | Edit, archive, restore, delete |
| Project manager, QA lead                               | Everything          | Edit                           |
| QA engineer, Team lead, Developer, Stakeholder, Viewer | Everything          | Nothing on this tab            |
| Not a member                                           | "Project not found" | —                              |

## Accessibility

- Page title "<Name> · Projects · QA Work Management"; `<h1>` is the project name; the key and role badge are text.
- Tabs are links in a `nav` labelled "Project sections" with `aria-current="page"` on the active one (they change
  the URL, so they are links, not an ARIA tab widget).
- The archived banner is `role="status"` when it appears after archiving.
- Dialogs: `role="dialog"` / `role="alertdialog"` (archive, delete), focus trapped and returned to the button that
  opened them. The delete field's requirement is in its label: "Type SHOP to confirm".
- The More menu is a button with `aria-haspopup="menu"`; items reachable with arrow keys; Esc closes.
- "3 days left" is text; overdue is shown with the word "Overdue", not only red.

## Responsive

Below 768 px the header wraps (name on one line, badges below); Edit and More become one "Actions" menu; tabs
scroll horizontally.

## Locators for tests

`getByRole('heading', { level: 1 })`, `getByRole('link', { name: 'Members' })` (in
`getByRole('navigation', { name: 'Project sections' })`), `getByRole('button', { name: 'Edit' })`,
`getByRole('button', { name: 'More' })`, `getByRole('menuitem', { name: 'Archive' })`,
`getByRole('dialog', { name: 'Edit project' })`, `getByRole('alertdialog', { name: 'Delete project?' })`,
`getByLabel('Type SHOP to confirm')`, `getByText('This project is archived', { exact: false })`.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-08 | First version | Phase 3A |
