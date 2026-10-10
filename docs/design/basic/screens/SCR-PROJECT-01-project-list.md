---
id: SCR-PROJECT-01
title: Project list
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
      US-PROJECT-02,
      US-PROJECT-10,
      BR-PROJECT-06,
      BR-PROJECT-08,
      BR-PROJECT-36,
      BR-ADMIN-18,
      BR-GUEST-03,
    ]
  acceptance:
    [
      AC-PROJECT-09,
      AC-PROJECT-10,
      AC-PROJECT-11,
      AC-PROJECT-12,
      AC-PROJECT-13,
      AC-PROJECT-15,
      AC-PROJECT-71,
      AC-PROJECT-77,
      AC-PROJECT-78,
      AC-PROJECT-79,
      AC-PROJECT-80,
      AC-ADMIN-13,
      AC-ADMIN-22,
    ]
  api: [API-PROJECT-01]
  design: [SCR-SHELL-01, SCR-PROJECT-02, SCR-ADMIN-02]
updated: 2026-10-09
---

# SCR-PROJECT-01 Project list

Where every user starts: the projects they are in (every project for a System admin), with a search box and a
"Show archived" switch. It is a page to find and open a project, nothing else: it has no "New project" button for
anyone, because projects are created in Admin console › Projects (SCR-ADMIN-02, BR-ADMIN-18), which also owns the
"New project" dialog (R-SCR-03). Follows ISO 9241-110 and WCAG 2.2 level AA; style v2.1 (white card, indigo accent).

## Layout

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ top bar (SCR-SHELL-01)                                                        │
├──────────┬────────────────────────────────────────────────────────────────────┤
│ side nav │  Projects                                                          │  <h1>, no button
│ Projects │ ┌────────────────────────────────────────────────────────────────┐ │  card
│          │ │ Search [Key or name______]   [x] Show archived                 │ │
│          │ │ KEY   NAME                  MY ACCESS  MEMBERS  ACTIVE REL. UPD│ │  <table>, header row
│          │ │ SHOP  ShopEase Web          Member     8        2.4     2 days │ │  name is a link
│          │ │ OLD   Legacy Portal [Archived] Member  2        —       9 days │ │  badge when archived
│          │ └────────────────────────────────────────────────────────────────┘ │
│          │  or, in place of the table: empty state (heading + text)           │
└──────────┴────────────────────────────────────────────────────────────────────┘
```

## Data

From `GET /api/projects?search=&archived=` (API-PROJECT-01), sorted by name, then key.

| Column         | Value                                                                   | Empty value |
| -------------- | ----------------------------------------------------------------------- | ----------- |
| Key            | `key`, monospace                                                        | —           |
| Name           | `name`, a link to `/projects/<KEY>`; "Archived" badge when `archivedAt` | —           |
| My access      | `myAccess`: "Project admin", "Member" or "Guest"                        | "—"         |
| Members        | `memberCount`                                                           | "—"         |
| Active release | `activeRelease.name`                                                    | "—"         |
| Updated        | `updatedAt` as "today", "1 day ago", "N days ago"; full date in `title` | —           |

A Guest only sees what their project's Guest switches allow (BR-GUEST-03): the API returns `activeRelease: null`
when "Releases and sprints" is off and `memberCount: null` when "Members" is off. A System admin who is not a member
sees every column, with "—" in My access.

## Fields

| Field         | Input type        | Required | Client validation      | Message | Notes                                                                                  |
| ------------- | ----------------- | -------- | ---------------------- | ------- | -------------------------------------------------------------------------------------- |
| Search        | `search`          | no       | at most 100 characters | —       | Placeholder "Key or name". Filters after 300 ms without typing, or on Enter; URL `?q=` |
| Show archived | checkbox (switch) | no       | —                      | —       | URL `?archived=1`                                                                      |

## Actions

| Action                  | Result                                                                         | Criteria                     |
| ----------------------- | ------------------------------------------------------------------------------ | ---------------------------- |
| Open `/projects`        | `GET /api/projects`; table of active projects sorted by name                   | AC-PROJECT-09, AC-PROJECT-13 |
| Type in Search          | Only rows whose key or name contains the text stay (case-insensitive)          | AC-PROJECT-10, AC-PROJECT-11 |
| Turn on "Show archived" | Archived projects appear with an "Archived" badge; turned off, they are hidden | AC-PROJECT-12                |
| Reload, Back or share   | Search text and "Show archived" come back from the URL                         | AC-PROJECT-77                |
| Click a project name    | Go to `/projects/<KEY>` (SCR-PROJECT-02)                                       | AC-PROJECT-15                |
| Click "Try again"       | The list is requested again                                                    | AC-PROJECT-78                |

## States

| State                      | What the user sees                                                                                | Criteria                   |
| -------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| Loading                    | Three skeleton rows; `aria-busy="true"` on the table                                              |                            |
| Empty (no projects at all) | Empty state: heading "No projects yet", text MSG-ADMIN-10; no table, no "New project" button      | AC-ADMIN-22                |
| No match                   | Empty state: heading MSG-PROJECT-20; no table                                                     | AC-PROJECT-11              |
| Error                      | Alert MSG-COMMON-01 with a "Try again" button; no table                                           | AC-PROJECT-78              |
| No permission              | Nobody sees "New project" here; `POST /api/projects` returns 403 for anyone but a System admin    | AC-PROJECT-71, AC-ADMIN-13 |
| Guest row                  | Active release and Members show "—" when the project's Guest switch for that area is off          | AC-PROJECT-79              |
| Success                    | Rows; a System admin sees "—" in My access for projects they are not in, and their active release | AC-PROJECT-13              |

## Permissions

| Who           | Can see                                                                                 | Can do                                                            |
| ------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| User          | Projects they are a member of, as Project admin, Member or Guest ("Guest" in My access) | Search, show archived, open a project                             |
| System admin  | Every project                                                                           | Same (creates projects in Admin console › Projects, SCR-ADMIN-02) |
| Not logged in | Nothing (redirected to login, SCR-AUTH-01)                                              | —                                                                 |

## Accessibility

- Page title "Projects · QA Work Management"; one `<h1>` "Projects".
- Landmarks: `header`, `nav`, `main` (from SCR-SHELL-01).
- Search has the visible label "Search" (role `searchbox`); "Show archived" is a labelled checkbox.
- The table has a visually hidden `<caption>` "Your projects"; column headers are `<th scope="col">`.
- Tab order: Search → Show archived → project links in row order.
- The empty and no-match states are a `section` with `role="status"`, labelled by their `<h2>`, so a
  screen reader announces them after a search; the error is `role="alert"`.
- The "Archived" badge is text, not colour only. Text contrast at least 4.5:1.

## Responsive

Below 768 px the columns Members and Updated are hidden; Key, Name, My access and Active release stay, and the card
scrolls sideways if a name is very long (AC-PROJECT-80). Search and "Show archived" wrap onto two lines.

## Locators for tests

`getByRole('heading', { name: 'Projects', level: 1 })`, `getByRole('searchbox', { name: 'Search' })`,
`getByRole('checkbox', { name: 'Show archived' })`, `getByRole('table', { name: 'Your projects' })`,
`getByRole('row', { name: /SHOP/ })`, `getByRole('link', { name: 'ShopEase Web' })`,
`getByRole('heading', { name: 'No projects yet' })`, `getByRole('button', { name: 'Try again' })`. No `data-testid`
needed.

## Change log

| Date       | Change                                                                                                                                                                                                     | Why                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version                                                                                                                                                                                              | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                                                                                                                    | Linh's decision 2026-10-09 |
| 2026-10-09 | No "New project" button: the dialog opens from Admin console › Projects and the System admin stays there; empty text MSG-ADMIN-10; Guest in My access                                                      | BR-ADMIN-18, Phase 3C      |
| 2026-10-09 | Screen review: "New project" dialog moved to SCR-ADMIN-02; Data section; Guest columns follow the Guest switches; v2.1 card and empty states; responsive matches the build; AC-PROJECT-77 to AC-PROJECT-80 | R-SCR-02, R-SCR-03         |
