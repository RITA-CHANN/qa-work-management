---
id: SCR-DASH-01
title: Project dashboard
type: screen
feature: dash
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /
traces:
  requirements:
    [
      US-DASH-01,
      US-DASH-02,
      BR-DASH-01,
      BR-DASH-02,
      BR-DASH-03,
      BR-DASH-04,
      BR-DASH-05,
      BR-DASH-06,
      BR-DASH-07,
      BR-DASH-08,
      BR-SHELL-04,
    ]
  acceptance: [AC-DASH-01, AC-DASH-02, AC-DASH-03, AC-DASH-05, AC-DASH-06, AC-DASH-07, AC-SHELL-04]
  api: [API-ME-01, API-PROJECT-03, API-PROJECT-08, API-PROJECT-12, API-RELEASE-01, API-MILESTONE-01]
  design: [SCR-SHELL-01, SCR-PROJECT-04, SCR-PROJECT-05]
updated: 2026-10-09
---

# SCR-DASH-01 Project dashboard

One project at a glance, monitoring only: the release in focus, the current sprint, deadlines in the next 14
days, the team and recent activity (mockup U1). In the Phase 3C code PR it is served at `/` for the **current
project** of the shell ([SCR-SHELL-01](SCR-SHELL-01-app-shell.md), BR-SHELL-04); `/projects/:key` still opens the
3A Overview tab ([SCR-PROJECT-02](SCR-PROJECT-02-project-page.md)) until Q-ADMIN-04 is built. The page reads the
existing project endpoints; there is no dashboard endpoint yet. Follows ISO 9241-110 and WCAG 2.2 level AA.

## Layout

```
Dashboard                                                                     <h1>
ShopEase Web · SHOP
(This project is archived. Restore it to make changes.)                       role="status", archived only
┌────────────────┐┌────────────────┐┌────────────────┐┌────────────────┐
│Release in focus││Release target  ││Current sprint  ││Members         │      KPI row
│2.4             ││30 Nov 2026     ││Sprint 4        ││8               │
│Active          ││52 days to target││3 days left     ││8 roles         │
└────────────────┘└────────────────┘└────────────────┘└────────────────┘
┌─ Release ──────────────────────────── All releases ┐┌─ Current sprint ─────┐  <h2> per card
│ 2.4 [Active]  10 Sep 2026 – 30 Nov 2026            ││ Sprint 4             │
│ Sprints completed                           1/2    ││ Checkout             │
│ [██████████░░░░░░░░░░]                  progressbar││ 29 Sep – 12 Oct 2026 │
│ [Sprint 3 · Completed] [Sprint 4 · Active]         ││ 3 days left          │
└────────────────────────────────────────────────────┘└──────────────────────┘
┌─ Deadlines (next 14 days) ─┐┌─ Team ──────── Members ┐┌─ Recent activity ─ Full log ┐
│ Sprint 4 ends   12 Oct 2026││ Owner              1   ││ Oanh Owner created …        │
│ …                          ││ QA engineer        1   ││ … (10 newest)               │
└────────────────────────────┘└────────────────────────┘└─────────────────────────────┘
```

## Elements

| Element                         | What it shows                                                                                                                                                   | Rule       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Header                          | `<h1>` "Dashboard", description "`<name>` · `<KEY>`"                                                                                                            | BR-DASH-01 |
| KPI "Release in focus"          | The Active release, else the Planned one with the earliest start date; its status, or MSG-DASH-01 when none                                                     | BR-DASH-03 |
| KPI "Release target"            | Target date and "N days to target" / "Overdue by N days" (red when overdue); "No target date" when there is none                                                | BR-DASH-03 |
| KPI "Current sprint"            | The Active milestone and "N days left" / "Overdue by N days"; MSG-DASH-02 when none                                                                             | BR-DASH-04 |
| KPI "Members"                   | Number of members and "N roles" (distinct roles)                                                                                                                | BR-DASH-06 |
| Card "Release"                  | Name, status badge, dates, "Sprints completed" done / total with a progress bar, a badge per sprint of that release; MSG-DASH-01 when none; link "All releases" | BR-DASH-03 |
| Card "Current sprint"           | Name, goal, dates, days left / overdue; MSG-DASH-02 when none                                                                                                   | BR-DASH-04 |
| Card "Deadlines (next 14 days)" | Release target dates (not Released) and sprint end dates (not Completed) from today to today + 14, soonest first; "No deadlines in the next 14 days"            | BR-DASH-05 |
| Card "Team"                     | Count of members per project role (Phase 3A roles until role model v2); link "Members"                                                                          | BR-DASH-06 |
| Card "Recent activity"          | The 10 newest activity entries (same list as SCR-PROJECT-05); "No activity yet"; link "Full log"                                                                | BR-DASH-07 |

No create, edit or delete control and no cost, budget or rate data (BR-DASH-02, BR-DASH-08).

## Actions

| Action                     | Result                                                   | Criteria    |
| -------------------------- | -------------------------------------------------------- | ----------- |
| Open `/`                   | `GET /api/me/current-project`, then that project's cards | AC-SHELL-04 |
| "All releases"             | `/projects/<KEY>/releases` (SCR-PROJECT-04)              | AC-DASH-03  |
| "Members"                  | `/projects/<KEY>/members` (SCR-PROJECT-03)               | AC-DASH-06  |
| "Full log"                 | `/projects/<KEY>/activity` (SCR-PROJECT-05)              | AC-DASH-07  |
| "Show changes" on an entry | Expands old → new values of that activity entry          |             |
| Switch project (shell)     | The dashboard shows the chosen project                   |             |

## States

| State                        | What the user sees                                                                 | Criteria   |
| ---------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| Loading                      | "Loading…" (`role="status"`), then four grey KPI placeholders (`aria-busy="true"`) |            |
| No project the user can see  | `<h1>` "Dashboard" and an empty state: heading "No projects yet" and MSG-ADMIN-10  |            |
| No active or planned release | Release KPI and card show MSG-DASH-01                                              | AC-DASH-02 |
| No active sprint             | Sprint KPI and card show MSG-DASH-02                                               | AC-DASH-02 |
| Overdue                      | "Overdue by N days" in words (not colour only)                                     | AC-DASH-01 |
| Archived project             | MSG-PROJECT-08 under the header (only if the current project is archived)          |            |
| Error                        | The API error text in an alert                                                     |            |

## Permissions

| Role                      | Can see                                                     | Can do           |
| ------------------------- | ----------------------------------------------------------- | ---------------- |
| Member (any project role) | The dashboard of their current project                      | Follow the links |
| Admin                     | The dashboard of any project; never cost data (BR-DASH-08)  | Follow the links |
| Guest access level        | Not built yet (waits for role model v2, see the phase plan) | —                |

## Accessibility

- Page title "Dashboard · QA Work Management"; one `<h1>` "Dashboard" (unchanged from Phase 2).
- Each card is a `<section>` labelled by its `<h2>` ("Release", "Current sprint", "Deadlines (next 14 days)",
  "Team", "Recent activity").
- The progress bar is `role="progressbar"` named "Sprints completed" with `aria-valuenow` 0–100.
- Sprints of the release are an ordered list named "Sprints of `<release>`"; recent activity is an ordered list named
  "Recent activity".
- Status and overdue are written in words; badges are text.
- Colour contrast at least 4.5:1.

## Responsive

KPIs: 4 columns from 1280 px, 2 from 640 px, 1 below. Cards: 3 columns from 1024 px (Release spans 2), 1 below.

## Locators for tests

`getByRole('heading', { level: 1, name: 'Dashboard' })`, `getByText('ShopEase Web · SHOP')`,
`getByRole('region', { name: 'Release', exact: true })`, `getByRole('region', { name: 'Current sprint' })`,
`getByRole('region', { name: 'Deadlines (next 14 days)' })`, `getByRole('region', { name: 'Team' })`,
`getByRole('region', { name: 'Recent activity' })`, `getByRole('progressbar', { name: 'Sprints completed' })`,
`getByRole('list', { name: 'Sprints of 2.4' })`, `getByRole('link', { name: 'All releases' })`,
`getByRole('link', { name: 'Full log' })`; inside the Team region `getByRole('link', { name: 'Members' })` (the side
nav has a "Members" link too). Empty: `getByRole('heading', { name: 'No projects yet' })`.

Which project `/` shows depends on the current project: after a fresh seed Linh's is **MOBI** (first by name of her
projects), until she opens another project.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
