---
title: Guest access business rules
type: rules
feature: guest
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Guest access business rules

One rule per row, and one testable statement per rule (ISO/IEC/IEEE 29148: singular, unambiguous, verifiable).
The areas and their defaults are in [README.md](README.md#guest-visibility-areas).

| ID          | Rule                                                                                                                                                                                                                                                           | Source                          | Status   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------- |
| BR-GUEST-01 | A project member has one access level: Project admin, Member or **Guest**. Project admins and System admins can add a Guest, turn a Member into a Guest or back.                                                                                               | Role model v2 (Linh 2026-10-09) | proposed |
| BR-GUEST-02 | Each project has a **Guest visibility** setting (one switch per area, list and defaults in the README), changed in Project settings › Guests by a Project admin or System admin. A System admin sets the default for new projects in Admin console › Settings. | Role model v2 §2b               | proposed |
| BR-GUEST-03 | For a Guest, an area that is Off does not exist: not in the nav, search, dashboard cards or links, and its API returns 404 (checked on the server).                                                                                                            | Role model v2 §2b               | proposed |
| BR-GUEST-04 | A Guest never creates, edits, deletes or comments (403), whatever the switches. Cost, budget, security and audit data are never shown to a Guest.                                                                                                              | Role model v2 §2b               | proposed |
| BR-GUEST-05 | A Guest sees other people by name only (no email) and never sees other Guests.                                                                                                                                                                                 | Role model v2 §2b               | proposed |
| BR-GUEST-06 | A change to Guest visibility applies on the Guest's next request and is written to the activity log and the audit log.                                                                                                                                         | Role model v2 §2b               | proposed |

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
