---
title: Projects user stories
type: stories
feature: project
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Projects user stories

Attributes (Priority, Source, Status) are explained in [docs/README.md](../../README.md#requirement-attributes).

| ID            | Story                                                                                                                                                                                                                     | Priority | Source                                                    | Status     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------- | ---------- |
| US-PROJECT-01 | As a **System admin**, I want to create a project and choose its first Project admin, so that a team has a place for its QA work and someone to run it.                                                                   | Must     | Phase 3 business requirements; Linh's decision 2026-10-09 | proposed   |
| US-PROJECT-02 | As a **user**, I want to see a list of my projects and search it, so that I can open the one I need quickly.                                                                                                              | Must     | Phase 3 business requirements                             | proposed   |
| US-PROJECT-03 | As a **project member**, I want to open a project and see its details, members, releases, milestones and recent activity, so that I know its state.                                                                       | Must     | Phase 3 business requirements                             | proposed   |
| US-PROJECT-04 | As a **Project admin**, I want to edit the project name and description, so that they stay correct.                                                                                                                       | Must     | Phase 3 business requirements                             | proposed   |
| US-PROJECT-05 | As a **Project admin**, I want to add people (stakeholders, PM, leads of other teams, the whole QA team) with an access level, change their access level and remove them, so that the right people have the right access. | Must     | Linh's answer to Q-PROJECT-03; Linh's decision 2026-10-09 | proposed   |
| US-PROJECT-06 | As a **Project admin**, I want to archive a project that is finished and restore it if needed, so that the list only shows active work but nothing is lost.                                                               | Should   | Phase 3 business requirements                             | proposed   |
| US-PROJECT-07 | As a **Project admin**, I want to delete a project created by mistake, so that it doesn't clutter the system.                                                                                                             | Should   | Phase 3 business requirements                             | proposed   |
| US-PROJECT-08 | As a **Project admin**, I want to plan releases with dates and a status, so that QA work can be grouped by release later.                                                                                                 | Must     | Phase 3 business requirements                             | proposed   |
| US-PROJECT-09 | As a **project member**, I want to see an activity log of who changed what and when, so that changes are traceable.                                                                                                       | Must     | Phase 3 business requirements                             | proposed   |
| US-PROJECT-10 | As a **System admin**, I want to see and manage all projects, so that I can help any team.                                                                                                                                | Must     | Phase 3 business requirements                             | proposed   |
| US-PROJECT-11 | As a **Project admin**, I want to plan time-boxed milestones (sprints) with a goal and dates, inside a release, so that the team works in agile iterations.                                                               | Must     | Linh's answer to Q-PROJECT-02 (agile)                     | proposed   |
| US-PROJECT-12 | As a **project member**, I want to see which milestone is running now and how the release is split into milestones, so that I know what the team is working towards.                                                      | Should   | Linh's answer to Q-PROJECT-02 (agile)                     | proposed   |
| US-PROJECT-13 | ~~As an **owner**, I want only Owners to control who is an Owner, so that a manager can't take over the project.~~ Deprecated 2026-10-09: there is no Owner role; any Project admin manages all members (BR-PROJECT-23).  | Must     | Q-PROJECT-06 default                                      | deprecated |
| US-PROJECT-14 | As a **Project admin**, I want to give each member a job title (QA engineer, Developer, Product owner…), so that everyone can see who does what without it changing anyone's rights.                                      | Should   | Linh's decision 2026-10-09                                | proposed   |

## Change log

| Date       | Change                                                                                                                                 | Why                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version, from the Phase 3 business requirements v2 (with Linh's answers to Q-PROJECT-01 to Q-PROJECT-05)                         | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects. Deprecated US-PROJECT-13, added US-PROJECT-14 | Linh's decision 2026-10-09 |
