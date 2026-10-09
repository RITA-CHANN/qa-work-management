---
title: Admin console user stories
type: stories
feature: admin
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Admin console user stories

Attributes (Priority, Source, Status) are explained in [docs/README.md](../../README.md#requirement-attributes).

| ID          | Story                                                                                                                                                                                       | Priority | Source                                   | Status   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------- | -------- |
| US-ADMIN-01 | As an **admin**, I want a separate Admin console, so that admin work is clearly apart from daily project work.                                                                              | Must     | Linh comment "UI rieng cho 2 role"       | proposed |
| US-ADMIN-02 | As an **admin**, I want an all-projects dashboard comparing every project, so that I can see which project needs help.                                                                      | Must     | Linh comment (all projects = Admin only) | proposed |
| US-ADMIN-03 | As an **admin**, I want to list, open, archive, restore, delete and change the project admin of any project, so that I can manage projects I didn't create.                                 | Must     | Linh request (1)                         | proposed |
| US-ADMIN-04 | As an **admin**, I want to create user accounts, change a user's global role, deactivate them, reset their password and sign them out everywhere, so that I control who can use the system. | Must     | Redesign proposal §8                     | proposed |
| US-ADMIN-05 | As an **admin**, I want an audit log of sign-ins and admin actions, so that I can check who did what.                                                                                       | Must     | Redesign proposal §8 rule 3              | proposed |

## Change log

| Date       | Change                                                                                                           | Why      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 ("transfer ownership" is now "change project admin") | Phase 3C |
