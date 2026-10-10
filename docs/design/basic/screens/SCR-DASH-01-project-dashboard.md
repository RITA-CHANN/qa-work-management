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
      BR-GUEST-03,
      BR-GUEST-05,
    ]
  acceptance:
    [
      AC-DASH-01,
      AC-DASH-02,
      AC-DASH-03,
      AC-DASH-05,
      AC-DASH-06,
      AC-DASH-07,
      AC-DASH-08,
      AC-DASH-09,
      AC-SHELL-04,
      AC-GUEST-01,
    ]
  api: [API-ME-01, API-PROJECT-03, API-DASH-01]
  design: [SCR-SHELL-01, SCR-PROJECT-02, SCR-PROJECT-04, SCR-PROJECT-05]
updated: 2026-10-09
---

# SCR-DASH-01 Project dashboard

One project at a glance, monitoring only: the release in focus, the current sprint, deadlines (overdue and next 14
days), the team and recent activity (mockup U1). It is served at `/` for the **current project** of the shell
([SCR-SHELL-01](SCR-SHELL-01-app-shell.md), BR-SHELL-04), and as the **Dashboard** tab of `/projects/:key`
([SCR-PROJECT-02](SCR-PROJECT-02-project-page.md)), which replaces the 3A Overview (BR-DASH-01, Q-ADMIN-04). In the
tab the page has no header of its own (the project page's header is above it) and no archived line (the project page
shows the banner). All card data comes from one request, `GET /api/projects/:key/dashboard`
([API-DASH-01](../../../api/projects/get-project-dashboard.md)); the server leaves out the parts of areas switched off
for a Guest (BR-GUEST-03). Follows ISO 9241-110 and WCAG 2.2 level AA.

Widgets that need tests, defects or tasks (needs my attention, test runs, pass rate, defects trend, release
readiness in mockup U1) are added by the phases that build that data (3B to 7); nothing is shown for them before.

## Layout

```
Dashboard                                                                     <h1>, not in the tab
ShopEase Web · SHOP
(This project is archived. Restore it to make changes.)                       role="status", archived only
┌────────────────┐┌────────────────┐┌────────────────┐┌────────────────┐
│Release in focus││Current sprint  ││Deadlines, 14 d ││Members         │      KPI row, each a link
│2.4             ││Sprint 4        ││1               ││8               │
│20 days to target││3 days left    ││None overdue    ││2 project admins│
└────────────────┘└────────────────┘└────────────────┘└────────────────┘
┌─ Release ─────────────────────────── All releases ┐┌─ Current sprint ─ Releases & sprints ┐
│ 2.4 [Active]  15 Sep 2026 – 29 Oct 2026           ││ Sprint 4                             │
│ Sprints completed                          1/2    ││ Checkout                             │
│ [██████████░░░░░░░░░░]                 progressbar││ 29 Sep – 12 Oct 2026 · 3 days left   │
│ [Sprint 3 · Completed] [Sprint 4 · Active]        │└──────────────────────────────────────┘
└───────────────────────────────────────────────────┘┌─ Recent activity ────────── Full log ┐
┌─ Deadlines ── Releases & sprints ┐┌─ Team ─ Members┐│ (AA) Ada Admin added Pat Viewer …    │
│ Sprint 2 ends  Overdue by 2 days ││ Project admin 2 ││      2 h ago                         │
│ Sprint 4 ends  12 Oct · In 3 days││ Member        5 ││ … 10 newest                          │
│ …                                ││ Guest         1 ││                                      │
│                                  ││ Developer 1  QA…││                                      │
└──────────────────────────────────┘└─────────────────┘└──────────────────────────────────────┘
```

From 1024 px the page has two columns: the left one (two thirds) holds Release, then Deadlines and Team side by
side; the right one (one third) holds Current sprint, then Recent activity.

## Elements

| Element                  | What it shows                                                                                                                                                                                                                                                        | Rule                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Header                   | `<h1>` "Dashboard", description "`<name>` · `<KEY>`"; not shown in the Dashboard tab of SCR-PROJECT-02                                                                                                                                                               | BR-DASH-01             |
| KPI "Release in focus"   | Name of the Active release, else the Planned one with the earliest start date; hint "N days to target", "Due today", "Overdue by N days" (red) or "No target date"; MSG-DASH-01 as hint and "—" as value when there is none. Links to Releases & sprints             | BR-DASH-03             |
| KPI "Current sprint"     | Name of the Active sprint; hint "N days left" / "Overdue by N days" (BR-PROJECT-34); MSG-DASH-02 when none. Links to Releases & sprints                                                                                                                              | BR-DASH-04             |
| KPI "Deadlines, 14 days" | Number of rows in the Deadlines card; hint "None overdue" or "N overdue" (red). Links to Releases & sprints                                                                                                                                                          | BR-DASH-05             |
| KPI "Members"            | Number of members the caller may see and "N project admins". Links to Members                                                                                                                                                                                        | BR-DASH-06             |
| Card "Release"           | Name, status badge, dates, "Sprints completed" done / total with a progress bar and a badge per sprint of that release; "No sprints in this release yet" instead of the bar when it has none; MSG-DASH-01 when there is no release; link "All releases"              | BR-DASH-03             |
| Card "Current sprint"    | Name, goal, dates, days left / overdue; MSG-DASH-02 when none; link "Releases & sprints"                                                                                                                                                                             | BR-DASH-04, BR-DASH-02 |
| Card "Deadlines"         | Overdue items first (oldest first), then the ones from today to today + 14 (soonest first): "Release `<name>` target" or "`<sprint>` ends", the date, and "Overdue by N days", "Today" or "In N days"; "No deadlines in the next 14 days"; link "Releases & sprints" | BR-DASH-05, BR-DASH-02 |
| Card "Team"              | Count of Project admins, Members and (when there are any) Guests, then members per job title in two columns ("No job title" for none); link "Members"                                                                                                                | BR-DASH-06             |
| Card "Recent activity"   | The 10 newest entries: initials of the actor, the summary, the time as "Just now", "N min ago", "N h ago", "Yesterday" or the date (full date and time on hover); "No activity yet"; link "Full log"                                                                 | BR-DASH-07             |

No create, edit or delete control and no cost, budget or rate data (BR-DASH-02, BR-DASH-08). Days are counted on
the calendar date in UTC returned by the API as `asOf` (DD-PROJECT-04), so the page and the API agree.

For a Guest each part belongs to an area (BR-GUEST-03): the Release, Current sprint and Deadlines KPIs and cards to
`releases`, the Members KPI and the Team card to `members`, the Recent activity card to `activity`. The API leaves out
the data of an area that is off and the page does not render its KPI or card.

## Actions

| Action                               | Result                                                                 | Criteria    |
| ------------------------------------ | ---------------------------------------------------------------------- | ----------- |
| Open `/`                             | `GET /api/me/current-project`, then that project's dashboard           | AC-SHELL-04 |
| Open the page or the tab             | `GET /api/projects/<KEY>` (header, cached) and `GET …/<KEY>/dashboard` | AC-DASH-01  |
| A KPI tile                           | Opens the page named in Elements                                       | AC-DASH-03  |
| "All releases", "Releases & sprints" | `/projects/<KEY>/releases` (SCR-PROJECT-04)                            | AC-DASH-03  |
| "Members"                            | `/projects/<KEY>/members` (SCR-PROJECT-03)                             | AC-DASH-06  |
| "Full log"                           | `/projects/<KEY>/activity` (SCR-PROJECT-05)                            | AC-DASH-07  |
| "Show changes" on an entry           | Expands old → new values of that activity entry                        |             |
| Switch project (shell)               | The dashboard shows the chosen project                                 |             |

## States

| State                        | What the user sees                                                                                                       | Criteria    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------- |
| Loading                      | Grey placeholders for the KPI row and the cards (`aria-busy="true"`); no empty-state text until the data has arrived     |             |
| No project the user can see  | `<h1>` "Dashboard" and an empty state: heading "No projects yet" and MSG-ADMIN-10                                        |             |
| No active or planned release | Release KPI and card show MSG-DASH-01                                                                                    | AC-DASH-02  |
| No active sprint             | Sprint KPI and card show MSG-DASH-02                                                                                     | AC-DASH-02  |
| Overdue                      | "Overdue by N days" in words (not colour only), in the KPI and in Deadlines                                              | AC-DASH-08  |
| Archived project             | MSG-PROJECT-08 under the header (only if the current project is archived)                                                |             |
| Error                        | The API error text in an alert in place of the KPIs and cards; no card shows an empty state                              |             |
| Guest, some areas off        | Only the KPIs and cards of the areas switched on for Guests                                                              | AC-GUEST-01 |
| Guest, dashboard off         | Empty state: heading "Dashboard not shared" and MSG-GUEST-01 (at `/`; in the project page the tab is hidden); no request | AC-GUEST-01 |

## Permissions

| Role                  | Can see                                                                                        | Can do           |
| --------------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| Project admin, Member | The dashboard of their projects                                                                | Follow the links |
| System admin          | The dashboard of any project; never cost data (BR-DASH-08)                                     | Follow the links |
| Guest                 | The parts of areas switched on for Guests, other Guests not counted (BR-GUEST-03, BR-GUEST-05) | Follow the links |

## Accessibility

- Page title "Dashboard · QA Work Management"; one `<h1>` "Dashboard" (unchanged from Phase 2).
- KPI tiles are links whose accessible name starts with the label, for example "Release in focus: 2.4, 20 days to
  target".
- Each card is a `<section>` labelled by its `<h2>` ("Release", "Current sprint", "Deadlines", "Team",
  "Recent activity").
- The progress bar is `role="progressbar"` named "Sprints completed" with `aria-valuenow` 0–100.
- Sprints of the release are an ordered list named "Sprints of `<release>`"; deadlines are a list named
  "Deadlines"; recent activity is an ordered list named "Recent activity". Initials are `aria-hidden`; times are
  `<time datetime>`.
- Status and overdue are written in words; badges are text.
- Colour contrast at least 4.5:1.

## Responsive

KPIs: 4 columns from 1280 px, 2 from 640 px, 1 below. Cards: two columns from 1024 px (see Layout), 1 below, in the
order Release, Current sprint, Deadlines, Team, Recent activity. Team's job titles: 1 column below 640 px.

## Locators for tests

`getByRole('heading', { level: 1, name: 'Dashboard' })`, `getByText('ShopEase Web · SHOP')`,
`getByRole('link', { name: /^Release in focus/ })`, `getByRole('link', { name: /^Deadlines, 14 days/ })`,
`getByRole('region', { name: 'Release', exact: true })`, `getByRole('region', { name: 'Current sprint' })`,
`getByRole('region', { name: 'Deadlines' })`, `getByRole('region', { name: 'Team' })`,
`getByRole('region', { name: 'Recent activity' })`, `getByRole('progressbar', { name: 'Sprints completed' })`,
`getByRole('list', { name: 'Sprints of 2.4' })`, `getByRole('list', { name: 'Deadlines' })`,
`getByRole('link', { name: 'All releases' })`, `getByRole('link', { name: 'Full log' })`; inside a region
`getByRole('link', { name: 'Releases & sprints' })` or `getByRole('link', { name: 'Members' })` (the side nav has
links with the same names). Empty: `getByRole('heading', { name: 'No projects yet' })`. Guest with the dashboard off:
`getByRole('heading', { name: 'Dashboard not shared' })`.

Which project `/` shows depends on the current project: after a fresh seed Linh's is **MOBI** (first by name of her
projects), until she opens another project.

## Change log

| Date       | Change                                                                                                                                                                                                                                                       | Why                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 2026-10-09 | First version                                                                                                                                                                                                                                                | Phase 3C                          |
| 2026-10-09 | Embedded as the Dashboard tab of SCR-PROJECT-02; cards hidden by Guest area; MSG-GUEST-01; Team card by access level and job title                                                                                                                           | BR-DASH-01, BR-GUEST-03           |
| 2026-10-09 | Screen thread review: one request (API-DASH-01) with Guest areas applied on the server; no false empty state while loading; overdue items in Deadlines and a Deadlines KPI; KPI tiles and every card link to their page; two-column layout; compact activity | SCR-DASH-01 thread, BR-DASH-05 v2 |
