---
id: SCR-PROJECT-01
title: Project list and new project dialog
type: screen
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /projects
traces:
  requirements:
    [
      US-PROJECT-01,
      US-PROJECT-02,
      US-PROJECT-10,
      BR-PROJECT-01,
      BR-PROJECT-02,
      BR-PROJECT-03,
      BR-PROJECT-04,
      BR-PROJECT-05,
      BR-PROJECT-06,
      BR-PROJECT-08,
      BR-PROJECT-36,
    ]
  acceptance:
    [
      AC-PROJECT-01,
      AC-PROJECT-02,
      AC-PROJECT-03,
      AC-PROJECT-04,
      AC-PROJECT-05,
      AC-PROJECT-06,
      AC-PROJECT-07,
      AC-PROJECT-09,
      AC-PROJECT-10,
      AC-PROJECT-11,
      AC-PROJECT-12,
      AC-PROJECT-13,
      AC-PROJECT-14,
    ]
  api: [API-PROJECT-01, API-PROJECT-02]
  design: [FLW-PROJECT-01]
updated: 2026-10-08
---

# SCR-PROJECT-01 Project list and new project dialog

Where every user starts: the projects they are in (all projects for an Admin), a search box, and the "New project"
dialog. Follows ISO 9241-110 and WCAG 2.2 level AA.

## Layout

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ header (Phase 2)                                                              │
├──────────┬────────────────────────────────────────────────────────────────────┤
│ nav      │  Projects                                         [ New project ] │  <h1>
│ Projects │  Search [______________]   [x] Show archived                      │
│          │ ┌──────┬──────────────┬────────────┬─────────┬────────────┬──────┐ │
│          │ │ Key  │ Name         │ My role    │ Members │ Active rel.│Updated│ │  <table>
│          │ ├──────┼──────────────┼────────────┼─────────┼────────────┼──────┤ │
│          │ │ SHOP │ ShopEase Web │ QA engineer│ 8       │ 2.4        │ 2 d  │ │  name is a link
│          │ │ OLD  │ Legacy…  [Archived]│ Viewer│ 2       │ —          │ 9 d  │ │  badge when archived
│          │ └──────┴──────────────┴────────────┴─────────┴────────────┴──────┘ │
│          │  (empty / no match message in role="status")                       │
└──────────┴────────────────────────────────────────────────────────────────────┘

Dialog "New project"                     role="dialog", aria-labelledby = title
┌──────────────────────────────────────┐
│ New project                       ✕  │
│ Key          [______]                │  hint: 2–10 letters or digits, can't change later
│              field message           │
│ Name         [__________________]    │
│              field message           │
│ Description  [__________________]    │  textarea, optional
│              [ Cancel ] [ Create ]   │
└──────────────────────────────────────┘
```

## Fields

| Field         | Input type                            | Required | Client validation               | Message                                        | Notes                                                                                  |
| ------------- | ------------------------------------- | -------- | ------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Search        | `search`                              | no       | at most 100 characters          | —                                              | Filters by key or name, case-insensitive, after 300 ms or Enter; kept in the URL `?q=` |
| Show archived | checkbox (switch)                     | no       | —                               | —                                              | Kept in the URL `?archived=1`                                                          |
| Key           | `text`, `autocapitalize="characters"` | yes      | `^[A-Za-z][A-Za-z0-9]{1,9}$`    | MSG-PROJECT-01, MSG-PROJECT-02, MSG-PROJECT-04 | Shown upper-case as you type (BR-PROJECT-02)                                           |
| Name          | `text`                                | yes      | 3–100 characters after trimming | MSG-PROJECT-03                                 |                                                                                        |
| Description   | `textarea`                            | no       | at most 2000 characters         | MSG-PROJECT-05                                 | Character counter below                                                                |

## Actions

| Action                     | Result                                                            | Criteria                                    |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| Open `/projects`           | `GET /api/projects`; table of active projects sorted by name      | AC-PROJECT-09, AC-PROJECT-13                |
| Type in Search             | Table shows only matching rows                                    | AC-PROJECT-10, AC-PROJECT-11                |
| Turn on "Show archived"    | Archived projects appear with an "Archived" badge                 | AC-PROJECT-12                               |
| Click a project name       | Go to `/projects/<KEY>` (SCR-PROJECT-02)                          | AC-PROJECT-15                               |
| Click "New project"        | Dialog opens, focus in Key                                        | AC-PROJECT-01                               |
| Click "Create" with errors | Messages under the fields, no request                             | AC-PROJECT-02, AC-PROJECT-03, AC-PROJECT-06 |
| Click "Create", server 201 | Dialog closes, go to the new project's page, toast MSG-PROJECT-19 | AC-PROJECT-01, AC-PROJECT-04                |
| Server 409 `KEY_TAKEN`     | MSG-PROJECT-04 under Key, focus on Key                            | AC-PROJECT-05                               |
| Cancel, ✕ or Esc           | Dialog closes without saving, focus back on "New project"         |                                             |

## States

| State                      | What the user sees                                                      | Criteria      |
| -------------------------- | ----------------------------------------------------------------------- | ------------- |
| Loading                    | Table skeleton rows; `aria-busy="true"` on the table                    |               |
| Empty (no projects at all) | MSG-PROJECT-21 and the "New project" button                             | AC-PROJECT-14 |
| No match                   | MSG-PROJECT-20 in place of the rows                                     | AC-PROJECT-11 |
| Error                      | MSG-COMMON-01 with a "Try again" button                                 |               |
| No permission              | Not possible: every logged-in user may see the list and create projects | BR-PROJECT-01 |
| Success                    | Rows; Admin sees "—" in My role for projects they are not in            | AC-PROJECT-13 |
| Creating                   | "Create" disabled while the request runs                                |               |

## Permissions

| Role  | Can see                                | Can do                                   |
| ----- | -------------------------------------- | ---------------------------------------- |
| User  | Projects they are a member of          | Search; create a project (becomes Owner) |
| Admin | Every project                          | Same                                     |
| Guest | Nothing (redirected to login, Phase 2) | —                                        |

## Accessibility

- Page title "Projects · QA Work Management"; one `<h1>` "Projects".
- Landmarks: `header`, `nav`, `main`.
- The table has a `<caption>` (visually hidden) "Your projects"; column headers are `<th scope="col">`.
- Tab order: New project → Search → Show archived → project links in row order.
- Dialog: `role="dialog"`, `aria-modal="true"`, labelled by its title; focus starts in Key, is trapped inside, and
  returns to "New project" on close.
- Field errors linked with `aria-describedby`, `aria-invalid="true"`; on submit with errors, focus moves to the first
  invalid field.
- Empty and no-match messages are in `role="status"`; the "Archived" badge is text, not colour only.
- Colour contrast at least 4.5:1 for text.

## Responsive

Below 768 px the table becomes a list of cards (key and name on top, role and active release below); the columns
Members and Updated are hidden. The dialog takes the full width.

## Locators for tests

`getByRole('heading', { name: 'Projects' })`, `getByRole('button', { name: 'New project' })`,
`getByRole('searchbox', { name: 'Search' })`, `getByRole('checkbox', { name: 'Show archived' })`,
`getByRole('row', { name: /SHOP/ })`, `getByRole('dialog', { name: 'New project' })`, `getByLabel('Key')`,
`getByLabel('Name')`, `getByRole('button', { name: 'Create' })`. No `data-testid` needed.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-08 | First version | Phase 3A |
