---
id: SCR-SHELL-01
title: App shell
type: screen
feature: shell
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: every page of the User UI (not /login, /change-password or /admin)
traces:
  requirements:
    [
      US-SHELL-01,
      US-SHELL-02,
      US-SHELL-03,
      BR-SHELL-01,
      BR-SHELL-02,
      BR-SHELL-03,
      BR-SHELL-04,
      BR-SHELL-05,
      BR-SHELL-06,
      BR-SHELL-07,
      BR-SHELL-08,
      US-AUTH-03,
      US-AUTH-05,
    ]
  acceptance:
    [
      AC-SHELL-01,
      AC-SHELL-02,
      AC-SHELL-03,
      AC-SHELL-04,
      AC-SHELL-05,
      AC-SHELL-06,
      AC-SHELL-07,
      AC-SHELL-08,
      AC-AUTH-18,
    ]
  api:
    [API-ME-01, API-ME-02, API-SEARCH-01, API-AUTH-02, API-AUTH-03, API-PROJECT-01, API-HEALTH-01]
  design: [SCR-AUTH-02, SCR-DASH-01, FLW-AUTH-02]
updated: 2026-10-09
---

# SCR-SHELL-01 App shell

The frame around every page of the User UI (`AppLayout`): side nav grouped by module with the project switcher on
top, a top bar with the search button, API status and the account menu, and the ⌘K / Ctrl+K search dialog. It
replaces the Phase 2 header and its "Log out" button ([SCR-AUTH-02](SCR-AUTH-02-user-menu.md)). The Admin console
has its own layout ([SCR-ADMIN-01](SCR-ADMIN-01-all-projects-dashboard.md)). Follows ISO 9241-110 and WCAG 2.2
level AA.

## Layout

```
┌────────────────────────┬──────────────────────────────────────────────────────────────────┐
│ [QA] QA Work Management│ [🔍 Search            ⌘K]          API: Online   (LQ) Linh QA ▾ │ <header> (banner)
│ ┌────────────────────┐ ├──────────────────────────────────────────────────────────────────┤
│ │ SHOP ShopEase Web ▾│ │                                                                  │ "Switch project"
│ │      SHOP          │ │  <main id="main-content">                                        │
│ └────────────────────┘ │     page content (one <h1>)                                      │
│ OVERVIEW               │                                                                  │ <nav "Main">
│  ▣ Dashboard           │                                                                  │
│ PROJECT & REQUIREMENTS │                                                                  │ only when a project
│  ⓘ Project overview    │                                                                  │ is current
│  ▤ Releases & sprints  │                                                                  │
│  👥 Members            │                                                                  │
│  ∿ Activity            │                                                                  │
│ WORKSPACE              │                                                                  │
│  ▦ Projects            │                                                                  │
└────────────────────────┴──────────────────────────────────────────────────────────────────┘

Account menu (open)            Search dialog (⌘K / Ctrl+K)            role="dialog", name "Search"
┌───────────────┐              ┌──────────────────────────────────┐
│ Admin console │ Admins only  │ Search                         ✕ │
│ Log out       │              │ 🔍 [Type a project, release or…] │ role="combobox"
└───────────────┘              │ Projects                         │ role="group"
                               │  ShopEase Web              SHOP  │ role="option"
                               │ Releases                         │
                               │  2.4          SHOP · Release · … │
                               │ Sprints                          │
                               │  Sprint 4         SHOP · 2.4 · … │
                               │ (No results for "xyz")           │ role="status"
                               └──────────────────────────────────┘
```

## Elements

| Element                                 | What it shows                                                                                                         | Rule                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Brand                                   | "QA Work Management" (text, not a link)                                                                               |                         |
| Project switcher                        | Current project's name and key, or "Choose a project". Hidden when the user can see no project                        | BR-SHELL-03             |
| Switcher items                          | Every project the user can see (all for Admins), active first, archived last as "`<name>` (`<KEY>`) · Archived"       | BR-SHELL-03             |
| Side nav group "Overview"               | Link "Dashboard" → `/` (current project's dashboard, SCR-DASH-01)                                                     | BR-SHELL-01, BR-DASH-01 |
| Side nav group "Project & requirements" | Only when a project is current: "Project overview", "Releases & sprints", "Members", "Activity" → `/projects/<KEY>/…` | BR-SHELL-01             |
| Side nav group "Workspace"              | Link "Projects" → `/projects`                                                                                         | BR-SHELL-01             |
| Search button                           | "Search" with a `⌘K` hint; opens the search dialog                                                                    | BR-SHELL-06             |
| API status                              | "API: Online / Offline / Checking…" (MSG-COMMON-10 to MSG-COMMON-12)                                                  |                         |
| Account menu                            | Initials avatar and name; menu items "Admin console" (System admins only) and "Log out". No role text anywhere        | BR-SHELL-02, US-AUTH-05 |

There is no generic "Create" button in the top bar (BR-SHELL-05). The **current project** is the project of the URL
when on `/projects/<KEY>/…`; elsewhere it is the one from [GET /api/me/current-project](../../../api/me/get-current-project.md).

## Actions

| Action                                             | Result                                                                                                                      | Criteria    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Open any `/projects/<KEY>/…` page                  | That project becomes current: `PUT /api/me/current-project`, so the next login opens it                                     | AC-SHELL-04 |
| Choose a project in the switcher on a project page | Same sub-page of the chosen project opens (`/projects/MOBI/releases` from `/projects/SHOP/releases`) and it becomes current | AC-SHELL-03 |
| Choose a project in the switcher elsewhere         | It becomes current; the page stays (on `/` the dashboard switches to it)                                                    | AC-SHELL-03 |
| Press ⌘K / Ctrl+K anywhere, or click "Search"      | Search dialog opens, focus in the search box                                                                                | AC-SHELL-05 |
| Type in search                                     | After 150 ms `GET /api/search?q=`; results grouped Projects, Releases, Sprints, Users (Admins), at most 5 each              | AC-SHELL-05 |
| ↓ / ↑ in search, Enter                             | Moves the highlighted result; Enter opens its page and closes the dialog                                                    | AC-SHELL-05 |
| Esc or ✕ in search                                 | Dialog closes, focus back where it was                                                                                      | AC-SHELL-05 |
| Account menu → "Admin console"                     | Opens `/admin` (System admins only)                                                                                         | AC-SHELL-02 |
| Account menu → "Log out"                           | `POST /api/auth/logout`, then `/login`                                                                                      | AC-AUTH-18  |
| "Skip to main content" (first Tab)                 | Focus moves to `<main>`                                                                                                     | AC-SHELL-06 |

## States

| State                   | What the user sees                                                                                    | Criteria                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------ |
| Loading                 | Switcher shows "Choose a project" until the project list loads; nav without the project group         |                          |
| No project at all       | No switcher; nav shows only "Dashboard" and "Projects"                                                |                          |
| Project current         | Switcher shows it; the "Project & requirements" group links to it                                     | AC-SHELL-01              |
| Search: no match        | MSG-SHELL-01 `No results for "<query>"` in `role="status"`                                            | AC-SHELL-05              |
| Search: error           | No results list (the error is not shown in 3C)                                                        |                          |
| User (global role User) | No "Admin console" in the account menu; search has no Users group; never a project they are not in    | AC-SHELL-01, AC-SHELL-05 |
| Admin                   | "Admin console" in the account menu; switcher and search list every project; search has a Users group | AC-SHELL-02              |

## Permissions

| Role              | Can see                                                                 | Can do                            |
| ----------------- | ----------------------------------------------------------------------- | --------------------------------- |
| User              | Their projects in the switcher and search; no admin entry, no role text | Switch project, search, log out   |
| Admin             | Every project; "Admin console" in the account menu; users in search     | Same, plus open the Admin console |
| Not logged in     | Nothing (sent to `/login`, BR-AUTH-08)                                  | —                                 |
| One-time password | Nothing (sent to `/change-password`, SCR-AUTH-03)                       | —                                 |

## Accessibility

- Page title and `<h1>` come from each page (`PageHeader`); the shell adds none.
- Landmarks: `header` (banner), `nav` "Main", `main` (`#main-content`). A "Skip to main content" link is the first
  focusable element.
- Tab order: skip link → project switcher → side nav links → Search → account menu → page content.
- Active nav link has `aria-current="page"`.
- Project switcher and account menu follow the ARIA menu button pattern: `aria-haspopup="menu"`, `aria-expanded`;
  ↓ / ↑ move between `menuitem`s, Esc closes and returns focus to the button.
- Search: native `<dialog>` (focus trapped, Esc closes); input `role="combobox"` with `aria-controls`,
  `aria-expanded` and `aria-activedescendant`; results `role="listbox"` with one `role="group"` per group and
  `role="option"` items (`aria-selected` on the highlighted one).
- The avatar initials are `aria-hidden`; the account button's name is "Account: `<name>`".
- Colour contrast at least 4.5:1; the active nav link and statuses are not shown by colour alone.

## Responsive

The side nav has a fixed width of 256 px; below 768 px it still shows (a collapsible nav is not built in 3C). The
user name next to the avatar is hidden below 640 px (`sm`); the account button keeps its name "Account: `<name>`".

## Locators for tests

- Side nav: `page.getByRole('navigation', { name: 'Main' })`, then `getByRole('link', { name: 'Dashboard', exact: true })`,
  `getByRole('link', { name: 'Projects' })`, and with a current project `getByRole('link', { name: 'Project overview' })`,
  `getByRole('link', { name: 'Releases & sprints' })`, `getByRole('link', { name: 'Members' })`,
  `getByRole('link', { name: 'Activity' })`. Group names ("Overview", "Workspace") are plain text, not headings.
- On project pages the tab bar `getByRole('navigation', { name: 'Project sections' })` also has "Members" and
  "Activity" links, and "Overview" matches "Project overview" as a substring: scope link locators to one navigation.
- Project switcher: `getByRole('button', { name: 'Switch project' })`, then
  `getByRole('menuitem', { name: 'ShopEase Mobile (MOBI)' })`; archived ones end in "· Archived".
- Account menu: `getByRole('button', { name: 'Account: Linh QA' })`, then `getByRole('menuitem', { name: 'Log out' })`
  or `getByRole('menuitem', { name: 'Admin console' })`.
- Search: `getByRole('button', { name: /Search/ })` or `page.keyboard.press('ControlOrMeta+k')`;
  `getByRole('dialog', { name: 'Search' })`, `getByRole('combobox', { name: 'Search projects, releases and sprints' })`,
  `getByRole('listbox', { name: 'Results' })`, `getByRole('group', { name: 'Sprints' })`,
  `getByRole('option', { name: /Sprint 4/ })` (an option's name is its title followed by its subtitle),
  `getByRole('status').filter({ hasText: 'No results for' })`.
- API status: `getByRole('status', { name: 'API status' })`.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
