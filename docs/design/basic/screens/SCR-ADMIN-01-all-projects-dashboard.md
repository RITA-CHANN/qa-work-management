---
id: SCR-ADMIN-01
title: All-projects dashboard
type: screen
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /admin
traces:
  requirements: [US-ADMIN-01, US-ADMIN-02, BR-ADMIN-01, BR-ADMIN-02, BR-SHELL-02]
  acceptance: [AC-ADMIN-01, AC-ADMIN-02, AC-SHELL-02, AC-SHELL-06]
  api: [API-ADMIN-01]
  design: [SCR-SHELL-01, SCR-ADMIN-02, SCR-ADMIN-03, SCR-ADMIN-04]
updated: 2026-10-09
---

# SCR-ADMIN-01 All-projects dashboard

The home of the Admin console (mockup A1): workspace KPIs and one row per project, so a System admin sees which
project needs help. This file also describes the **Admin console layout** shared by SCR-ADMIN-01 to SCR-ADMIN-04
(`AdminLayout`): its own deep-indigo top bar, its own side nav and a "Back to workspace" link (BR-ADMIN-01). Follows
ISO 9241-110 and WCAG 2.2 level AA.

## Layout

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ QA Work Management · Admin console                    [← Back to workspace] [(AA) Ada ▾] │ <header>, deep indigo
├──────────────┬────────────────────────────────────────────────────────────────────────────┤
│ <nav Admin>  │ All projects                                                               │ <h1>
│ ▣ Dashboard  │ Every project in the workspace                                             │
│ ▦ Projects   │ ┌──────────┐┌──────────┐┌──────┐┌────────────────┐┌───────────────────┐   │
│ 👥 Users      │ │Active    ││Active    ││Admins││Failed sign-ins ││Actions as Admin   │   │ KPIs
│ ☰ Audit log  │ │projects 3││users 10/11││ 1    ││(7 days) 2      ││(7 days) 1         │   │
│ ⚙ Settings   │ │1 archived│└──────────┘└──────┘└────────────────┘└───────────────────┘   │
│              │ └──────────┘                                                               │
│              │ ┌─ Projects ─────────────────────────────────────────── Manage projects ┐ │ <h2>
│              │ │ Project | Status | Project admins | Members | Active release |         │ │ <table>
│              │ │ Current sprint | Last activity                                        │ │
│              │ │ ShopEase Web SHOP | Active | Oanh Owner | 8 | 2.4 target 30 Nov 2026 │ │ name is a link
│              │ │ Legacy Portal OLD | Archived | …                                      │ │
│              │ └───────────────────────────────────────────────────────────────────────┘ │
└──────────────┴────────────────────────────────────────────────────────────────────────────┘
```

## Elements

| Element                         | What it shows                                                                                                                                                                                       | Rule        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Top bar                         | "QA Work Management · Admin console", link "Back to workspace" (→ `/`), the account menu of SCR-SHELL-01                                                                                            | BR-ADMIN-01 |
| Side nav "Admin"                | Links "Dashboard" (`/admin`), "Projects", "Users", "Audit log", "Settings" (SCR-ADMIN-05). Pages not built yet are not listed (Q-ADMIN-03)                                                          | BR-ADMIN-01 |
| KPI "Active projects"           | Count, hint "N archived"                                                                                                                                                                            | BR-ADMIN-02 |
| KPI "Active users"              | `active/total`                                                                                                                                                                                      | BR-ADMIN-02 |
| KPI "Admins"                    | Active Admins                                                                                                                                                                                       | BR-ADMIN-02 |
| KPI "Failed sign-ins (7 days)"  | Count; amber when above 0                                                                                                                                                                           | BR-ADMIN-02 |
| KPI "Actions as Admin (7 days)" | Audit entries marked as Admin                                                                                                                                                                       | BR-ADMIN-14 |
| Card "Projects"                 | Table: Project (name link + key), Status (Active / Archived badge), Project admins, Members, Active release ("target `<date>`" or "Overdue"), Current sprint, Last activity; link "Manage projects" | BR-ADMIN-02 |

## Actions

| Action                  | Result                                                                           | Criteria    |
| ----------------------- | -------------------------------------------------------------------------------- | ----------- |
| Open `/admin` as Admin  | `GET /api/admin/overview`; KPIs and table                                        | AC-ADMIN-02 |
| Open `/admin` as a User | The normal "Page not found" page (MSG-COMMON-13, MSG-COMMON-14), no Admin layout | AC-ADMIN-01 |
| Click a project name    | `/projects/<KEY>` in the User UI                                                 |             |
| "Manage projects"       | `/admin/projects` (SCR-ADMIN-02)                                                 |             |
| "Back to workspace"     | `/` (User UI dashboard)                                                          |             |

## States

| State         | What the user sees                                                   | Criteria    |
| ------------- | -------------------------------------------------------------------- | ----------- |
| Loading       | KPIs show "—"; "Loading…" (`role="status"`) in the Projects card     |             |
| Success       | Every project, SECRET and the archived OLD included                  | AC-ADMIN-02 |
| Error         | The API error text in an alert                                       |             |
| No permission | "Page not found" (`<h1>` MSG-COMMON-13) and "Back to dashboard"      | AC-ADMIN-01 |
| Empty         | Not possible in practice (the seed has projects); the table is empty |             |

## Permissions

| Role          | Can see               | Can do                  |
| ------------- | --------------------- | ----------------------- |
| Admin         | Every project and KPI | Open projects, navigate |
| User          | "Page not found" only | —                       |
| Not logged in | Sent to `/login`      | —                       |

## Accessibility

- Page title "All projects · QA Work Management"; one `<h1>` "All projects".
- Landmarks: `header` (banner), `nav` "Admin", `main` (`#main-content`); "Skip to main content" link first.
- Tab order: skip link → Back to workspace → account menu → side nav → Manage projects → project links.
- The table has a visually hidden caption "Project health"; the Projects card is a region named "Projects".
- Statuses and "Overdue" are text, not colour only.
- Colour contrast at least 4.5:1, white text on the deep-indigo top bar included.

## Responsive

KPIs: 5 columns from 1280 px, 2 from 640 px, 1 below. The table scrolls horizontally inside its card.

## Locators for tests

Layout (all Admin pages): `getByRole('banner')`, `getByRole('link', { name: 'Back to workspace' })`,
`getByRole('navigation', { name: 'Admin' })` with links `Dashboard`, `Projects`, `Users`, `Audit log`, `Settings`,
`getByRole('button', { name: 'Account: Ada Admin' })`.

This page: `getByRole('heading', { level: 1, name: 'All projects' })`, `getByText('Failed sign-ins (7 days)')`,
`getByRole('table', { name: 'Project health' })`, `getByRole('row', { name: /Internal Tools/ })`,
`getByRole('link', { name: 'Manage projects' })`. Not found: `getByRole('heading', { name: 'Page not found' })`.

## Change log

| Date       | Change                                  | Why                                 |
| ---------- | --------------------------------------- | ----------------------------------- |
| 2026-10-09 | First version                           | Phase 3C                            |
| 2026-10-09 | Side nav link "Settings" (SCR-ADMIN-05) | Phase 3C (BR-ADMIN-17, BR-GUEST-02) |
