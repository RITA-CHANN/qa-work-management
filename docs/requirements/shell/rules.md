---
title: App shell business rules
type: rules
feature: shell
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# App shell business rules

One rule per row, and one testable statement per rule (ISO/IEC/IEEE 29148: singular, unambiguous, verifiable).

| ID          | Rule                                                                                                                                                                                                                                                                          | Source                                | Status   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------- |
| BR-SHELL-01 | The side nav lists the 7 modules in a fixed order; inside a module it shows **only screens that are built** in the current phase. A module with no built screen is not shown.                                                                                                 | Linh 2026-10-09 (7 modules)           | proposed |
| BR-SHELL-02 | The User UI shows **no** admin entries and no text about the user's role. The only way into the Admin console is "Admin console" in the account menu, shown to Admins only.                                                                                                   | Linh comment "UI rieng cho 2 role"    | proposed |
| BR-SHELL-03 | The project switcher lists the projects the user can see (members: their projects; Admins: all), active first, archived last and marked "Archived". Choosing one opens the same page for that project when it exists, otherwise its dashboard.                                | Mockup U1                             | proposed |
| BR-SHELL-04 | The last project a user opened is remembered per user (server side) and opened after login. If they no longer have access, they land on the projects list.                                                                                                                    | Phase 3C business requirements        | proposed |
| BR-SHELL-05 | The top bar has **no** generic "Create" button. Items are created inside their module with an explicit label (e.g. "New project", "New release").                                                                                                                             | Redesign proposal (closed 2026-10-09) | proposed |
| BR-SHELL-06 | ⌘K / Ctrl+K opens search. Results are grouped (Projects, Releases, Sprints, and for Admins Users), at most 5 per group, and only include things the user may see (same access rules as the API). Enter opens the highlighted result; Esc closes. No match shows MSG-SHELL-01. | Redesign proposal §3                  | proposed |
| BR-SHELL-07 | Every page meets WCAG 2.2 AA: text contrast ≥ 4.5:1, status is never shown by colour alone, everything works by keyboard, focus is visible.                                                                                                                                   | Phase 3C business requirements        | proposed |
| BR-SHELL-08 | Existing accessible names (button and link labels, headings, field labels) used by tests are kept unless the Phase 3C requirements change them; every changed name is listed in the 3C PR.                                                                                    | Phase 3C business requirements        | proposed |

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
