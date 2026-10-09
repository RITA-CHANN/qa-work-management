---
title: Project dashboard business rules
type: rules
feature: dash
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Project dashboard business rules

One rule per row, and one testable statement per rule (ISO/IEC/IEEE 29148: singular, unambiguous, verifiable).
"Sprint" is the 3A milestone (BR-PROJECT-26).

| ID         | Rule                                                                                                                                                                                                                           | Source                                        | Status   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | -------- |
| BR-DASH-01 | The project dashboard (`/projects/:key`, and `/` for the current project, BR-SHELL-04) shows one project only. It replaces the 3A Overview tab as the project's home; project details move to "Settings".                      | Q-ADMIN-04 default                            | proposed |
| BR-DASH-02 | It contains no create, edit or delete actions. Every card links to the page where that item is managed.                                                                                                                        | Linh comment "dashboard chi dung de theo doi" | proposed |
| BR-DASH-03 | **Active release card**: name, status, dates, days to target date ("Overdue by N days" after it), and sprints completed / total. If no release is Active it shows the next Planned one; if none, an empty state (MSG-DASH-01). | Mockup U1                                     | proposed |
| BR-DASH-04 | **Current sprint card**: name, goal, dates, days left / overdue (same rule as BR-PROJECT-34). Empty state (MSG-DASH-02) if no sprint is Active.                                                                                | Mockup U1                                     | proposed |
| BR-DASH-05 | **Deadlines (next 14 days)**: release target dates and sprint end dates falling in the next 14 days, soonest first.                                                                                                            | Mockup U1                                     | proposed |
| BR-DASH-06 | **Team card**: number of Project admins and Members, members per job title, and a link to Members.                                                                                                                             | Mockup U1                                     | proposed |
| BR-DASH-07 | **Recent activity**: the 10 newest activity entries with a link to the full log.                                                                                                                                               | Mockup U1                                     | proposed |
| BR-DASH-08 | The dashboard never shows cost, budget, rate or security data, for any role, Admins included (those live in the Admin console only).                                                                                           | Linh 2026-10-09                               | proposed |

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
