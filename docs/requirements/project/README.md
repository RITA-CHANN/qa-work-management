---
title: Projects
type: feature
feature: project
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Projects

Business requirements for projects, members and their access levels and job titles, releases, milestones and the activity log (ISO/IEC/IEEE
29148: business and stakeholder requirements). Technical plan: [phase-3-plan.md](../../phases/phase-3-plan.md).
Phase 3 is split: this is **3A**; requirements and comments come in 3B (Q-PROJECT-01).

| File                           | Contains                                     |
| ------------------------------ | -------------------------------------------- |
| [stories.md](stories.md)       | User stories `US-PROJECT-NN`                 |
| [rules.md](rules.md)           | Business rules `BR-PROJECT-NN`               |
| [acceptance.md](acceptance.md) | Acceptance criteria `AC-PROJECT-NN`          |
| [nfr.md](nfr.md)               | Non-functional requirements `NFR-PROJECT-NN` |
| [messages.md](messages.md)     | Exact UI and error texts `MSG-PROJECT-NN`    |

## Design and API

| Layer         | Docs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screens       | [SCR-PROJECT-01 Project list](../../design/basic/screens/SCR-PROJECT-01-project-list.md), [SCR-PROJECT-02 Project page](../../design/basic/screens/SCR-PROJECT-02-project-page.md), [SCR-PROJECT-03 Members](../../design/basic/screens/SCR-PROJECT-03-members.md), [SCR-PROJECT-04 Releases and milestones](../../design/basic/screens/SCR-PROJECT-04-releases-milestones.md), [SCR-PROJECT-05 Activity](../../design/basic/screens/SCR-PROJECT-05-activity.md)                                                            |
| Flows         | [FLW-PROJECT-01 Create a project](../../design/basic/flows/FLW-PROJECT-01-create-project.md), [FLW-PROJECT-02 Manage members](../../design/basic/flows/FLW-PROJECT-02-manage-members.md), [FLW-PROJECT-03 Archive, restore, delete](../../design/basic/flows/FLW-PROJECT-03-archive-restore-delete.md), [FLW-PROJECT-04 Plan releases and milestones](../../design/basic/flows/FLW-PROJECT-04-releases-milestones.md), [FLW-PROJECT-05 Two people edit at once](../../design/basic/flows/FLW-PROJECT-05-concurrent-edit.md) |
| API           | [projects](../../api/README.md#endpoint-index) (API-PROJECT-01 to API-PROJECT-12), releases (API-RELEASE-01 to API-RELEASE-04), milestones (API-MILESTONE-01 to API-MILESTONE-04), users (API-USER-01)                                                                                                                                                                                                                                                                                                                      |
| Detail design | [DD-PROJECT-01 Permissions](../../design/detail/logic/DD-PROJECT-01-permissions.md), [DD-PROJECT-02 Activity log](../../design/detail/logic/DD-PROJECT-02-activity-log.md), [DD-PROJECT-03 Optimistic locking](../../design/detail/logic/DD-PROJECT-03-optimistic-locking.md), [DD-PROJECT-04 Release and milestone lifecycle](../../design/detail/logic/DD-PROJECT-04-release-milestone-lifecycle.md)                                                                                                                      |
| Data          | [projects](../../database/tables/projects.md), [project_members](../../database/tables/project_members.md), [releases](../../database/tables/releases.md), [milestones](../../database/tables/milestones.md), [activity_logs](../../database/tables/activity_logs.md)                                                                                                                                                                                                                                                       |
| Decisions     | [ADR-0008 Hide other projects (404)](../../decisions/ADR-0008-hide-projects-from-non-members.md), [ADR-0011 Project access levels and job titles](../../decisions/ADR-0011-project-access-levels-and-job-titles.md), [ADR-0009 Optimistic locking](../../decisions/ADR-0009-optimistic-locking.md), [ADR-0010 Problem details for API errors](../../decisions/ADR-0010-problem-details-errors.md)                                                                                                                           |

## Goal

Every piece of QA work (requirements, test cases, runs, bugs) belongs to a **project**. This feature lets a team
create projects, decide who is in each project and what they may do, plan releases and the agile milestones
(sprints) inside them, and see who changed what. After it, the app knows not only **who** is acting (Phase 2) but
**where** and **with which rights**.

## Stakeholders

| Stakeholder                                              | What they care about                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Project admin (product owner, project manager, QA lead…) | Runs the project: details, members, releases and sprints; nothing lost by mistake   |
| QA team                                                  | A clear release and sprint to test against; access for the whole QA team            |
| Leaders of other teams (dev, BA, design)                 | See the plan and the sprints their team works in                                    |
| Stakeholders (client, product owner, sponsor)            | See the plan and progress without being able to change it by accident               |
| System admin                                             | Creates projects, picks who runs them, and can help any team without being a member |
| QA (Linh) as tester of this app                          | Every rule has a criterion; seed data covers every access level and every job title |

## Actors

| Actor          | Description                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| User           | Any logged-in person (global role `USER`). Sees only the projects they are a member of.                                     |
| System admin   | Global role `ADMIN`. Creates projects and acts as a Project admin on every project, without being a member (BR-PROJECT-36). |
| Project member | A user added to a project with exactly one access level (below) and an optional job title.                                  |

### Access levels

An access level decides what a member may do in one project (BR-PROJECT-35). The same person can be Project admin
in one project and Member in another.

| Level         | Stored as                                | In short                                                                                                                         |
| ------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| System admin  | `users.global_role = ADMIN`              | Everything, on every project, without being a member. Only a System admin creates projects (BR-PROJECT-01).                      |
| Project admin | `project_members.access = PROJECT_ADMIN` | Runs one project: details, members (other Project admins included), releases, milestones, archive, restore, delete.              |
| Member        | `project_members.access = MEMBER`        | Sees the whole project. In 3A: read only (the daily work of later phases, such as test cases and bugs, comes with those phases). |
| Guest         | `project_members.access = GUEST`         | Outside person (client, sponsor), read only, sees only the areas switched on for Guests; names only, never other Guests (3C).    |

The Guest level and its per-project visibility switches are specified in
[requirements/guest](../guest/README.md) (BR-GUEST-01 to BR-GUEST-06).

### Job titles

A job title describes what a member does and **never** changes what they may do (BR-PROJECT-37). It is optional,
set by a Project admin, and stored as its short key (`project_members.job_title`). Tables show the name and key,
for example "QA lead · QAL"; pickers show "QA lead (QAL)". Later phases use it for assignment and dashboards.

| Key   | Name                   | Typical work                                       |
| ----- | ---------------------- | -------------------------------------------------- |
| `QAE` | QA engineer            | Writes and runs test cases, reports bugs           |
| `QAL` | QA lead                | Plans testing, reviews test cases, reports quality |
| `QAA` | QA automation engineer | Writes and maintains automated tests               |
| `PM`  | Project manager        | Plans releases and sprints, tracks delivery        |
| `PO`  | Product owner          | Owns requirements and priorities, accepts releases |
| `BA`  | Business analyst       | Writes and clarifies requirements                  |
| `DEV` | Developer              | Fixes bugs, delivers features                      |
| `TL`  | Team lead              | Leads a dev, BA or design team                     |
| `DES` | Designer               | UX/UI design                                       |
| `STK` | Stakeholder            | Business side (client, sponsor): follows progress  |
| `OTH` | Other                  | Anything else                                      |

### Permission matrix

✅ allowed · ❌ refused with 403 · A System admin can do everything a Project admin can (BR-PROJECT-36). Job titles
play no part. This table is BR-PROJECT-35 and also the permission test matrix: one row × one column = one test.

| Action                                                             | System admin | Project admin | Member | Guest | Not a member |
| ------------------------------------------------------------------ | ------------ | ------------- | ------ | ----- | ------------ |
| See the project (name, key, access)                                | ✅           | ✅            | ✅     | ✅    | 404          |
| See members, releases, milestones, activity                        | ✅           | ✅            | ✅     | ✅⁴   | 404          |
| Edit name and description                                          | ✅           | ✅            | ❌     | ❌    | 404          |
| Change what Guests can see                                         | ✅           | ✅            | ❌     | ❌    | 404          |
| Create, edit, change status of, delete a release                   | ✅           | ✅            | ❌     | ❌    | 404          |
| Create, edit, change status of, delete a milestone                 | ✅           | ✅            | ❌     | ❌    | 404          |
| Add a member, change an access level or job title, remove a member | ✅           | ✅            | ❌     | ❌    | 404          |
| Archive or restore the project                                     | ✅           | ✅            | ❌     | ❌    | 404          |
| Delete the project                                                 | ✅           | ✅            | ❌     | ❌    | 404          |
| Leave the project                                                  | —¹           | ✅²           | ✅     | ✅    | —            |
| Create a project                                                   | ✅³          | ❌            | ❌     | ❌    | ❌           |

¹ A System admin who is not a member has nothing to leave; one who is a member leaves like anyone else.
² Only while another Project admin remains (BR-PROJECT-12).
³ Only a System admin, anyone else gets 403 (BR-PROJECT-01); the System admin picks the first Project admin.
⁴ Only the areas switched on for Guests; an area switched off answers 404 and a Guest sees people by name only,
never other Guests (BR-GUEST-02 to BR-GUEST-05).
On an archived project every change is refused with 422 for everyone (BR-PROJECT-08).

## Assumptions and constraints

- Accounts still come from the seed; there is no sign-up or invitation by email.
- The team is small: up to a few hundred projects and a few dozen members per project.
- One API instance and one PostgreSQL database; all dates are calendar dates in UTC, times are stored in UTC.
- A change of access level takes effect on the next request (it is read from the database each time, not from the
  session).
- The project key becomes part of later IDs, so it can never change.

## Dependencies

- Authentication ([requirements/auth](../auth/README.md)) for `req.user` and the global role.
- Shared messages and schemas in `packages/shared`.
- RFC 9457 error format ([ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)), introduced with this
  phase and used by all endpoints.
- Every later feature (requirements, test cases, runs, bugs) depends on projects, access levels and the activity log.

## Out of scope

- Requirements and comments: Phase 3B.
- Inviting people by email, creating user accounts from the UI.
- Handing a project over as one action (add another Project admin, then leave).
- A Guest access level and per-area Guest visibility: Phase 3C.
- Editing the job title list in the Admin console; creating projects from a separate Admin console page.
- Sprint board, story points, burndown chart. Milestones hold dates, goal and status only; later phases link test
  runs and bugs to them.
- Several teams running parallel sprints in the same release (BR-PROJECT-30 forbids overlap inside a release).
- Notifications about changes; an activity feed across all projects.
- The Practice Sandbox project (`isPractice`): Phase 14.

## Business risks

| Risk                                                               | Why it matters                                               | Covered by                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------- |
| Someone sees a project they are not in (a client's project)        | Confidential plans leak; we lose the client's trust          | BR-PROJECT-06, NFR-PROJECT-01, ADR-0008      |
| A member does more than they should (stakeholder edits the plan)   | Wrong plan, no accountability                                | BR-PROJECT-35, BR-PROJECT-37, NFR-PROJECT-02 |
| A Member makes themselves Project admin and takes over the project | The people running the project lose control                  | BR-PROJECT-23, BR-PROJECT-24                 |
| A project is left without a Project admin                          | Only a System admin can fix membership, archive or delete it | BR-PROJECT-12                                |
| Two people overwrite each other's edits                            | Lost work, wrong data that nobody notices                    | BR-PROJECT-07, ADR-0009                      |
| A project or release is deleted by mistake                         | QA history is lost                                           | BR-PROJECT-09, BR-PROJECT-18, BR-PROJECT-33  |
| The activity log misses or invents a change                        | Changes can't be traced; audit fails                         | BR-PROJECT-21, BR-PROJECT-22, NFR-PROJECT-03 |

## Test data

All seed users share the password `Password123!` (dev and test only). Phase 3 adds four users: **Oanh Owner**
`owner@qawm.test`, **Mai PM** `pm@qawm.test`, **Tuan TeamLead** `teamlead@qawm.test`, **Sam Stakeholder**
`stakeholder@qawm.test` ([users](../../database/tables/users.md#seed-data)). Every seed project is created by
**Ada Admin** `admin@qawm.test` (System admin), who is not a member of any of them (BR-PROJECT-01).

| Key      | Name            | State    | Members (access, job title)                                                                                                                                                 | Releases → milestones                                                                                                           |
| -------- | --------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `SHOP`   | ShopEase Web    | Active   | Project admins: Oanh Owner (PO), Mai PM (PM). Members: Minh Lead (QAL), Linh QA (QAE), Tuan TeamLead (TL), Dev Nguyen (DEV), Pat Viewer (OTH). Guest: Sam Stakeholder (STK) | 2.3 Released → Sprint 1, Sprint 2 Completed · 2.4 Active → Sprint 3 Completed, Sprint 4 Active · 2.5 Planned → Sprint 5 Planned |
| `MOBI`   | ShopEase Mobile | Active   | Project admin: Linh QA (QAE). Member: Minh Lead (QAL)                                                                                                                       | 1.0 Planned, no milestones                                                                                                      |
| `OLD`    | Legacy Portal   | Archived | Project admin: Minh Lead (QAL). Member: Linh QA (QAE)                                                                                                                       | 1.0 Released → M1 Completed                                                                                                     |
| `SECRET` | Internal Tools  | Active   | Project admin: Oanh Owner (PM) only. Linh QA is not a member (404)                                                                                                          | —                                                                                                                               |

`SHOP` has two Project admins (so one can step down or leave) and Members with different job titles, so each column
of the permission matrix can be tested by logging in as one seed user (Sam Stakeholder covers the Guest column); Ada Admin covers the System admin column.
Sprint dates are set relative to the day the seed runs, so "days left" stays meaningful. Tests only **read** the
seed projects; a test that changes data creates its own project through the API (as Ada Admin).

## Open questions

| ID           | Question                                                       | Default if you don't answer                                                                                                                                                                  |
| ------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-PROJECT-01 | Split Phase 3 into 3A Projects and 3B Requirements + Comments? | Answered 2026-10-08: yes.                                                                                                                                                                    |
| Q-PROJECT-02 | Separate milestones besides releases?                          | Answered 2026-10-08: yes, agile milestones (sprints) inside a release.                                                                                                                       |
| Q-PROJECT-03 | Can a QA lead add members?                                     | Answered 2026-10-08: yes. Since 2026-10-09: any Project admin adds members; QA lead is a job title.                                                                                          |
| Q-PROJECT-04 | Non-member: 404 or 403?                                        | Answered 2026-10-08: 404.                                                                                                                                                                    |
| Q-PROJECT-05 | Archive before delete?                                         | Answered 2026-10-08: yes.                                                                                                                                                                    |
| Q-PROJECT-06 | Can a PM or QA lead make someone Owner?                        | Superseded 2026-10-09: there is no Owner; any Project admin manages all members (BR-PROJECT-23).                                                                                             |
| Q-PROJECT-07 | Must every milestone belong to a release?                      | Yes (BR-PROJECT-26).                                                                                                                                                                         |
| Q-PROJECT-08 | Sprint length limit?                                           | 1 to 28 days, as a setting (BR-PROJECT-28).                                                                                                                                                  |
| Q-PROJECT-09 | Close a sprint automatically when its end date passes?         | No; show "Overdue by N days" and let a person complete it (BR-PROJECT-34).                                                                                                                   |
| Q-PROJECT-10 | 8 permission roles, or access levels plus a job title?         | Answered 2026-10-09: Project admin / Member plus an optional job title; only a System admin creates projects ([ADR-0011](../../decisions/ADR-0011-project-access-levels-and-job-titles.md)). |

## Change log

| Date       | Change                                                                                                           | Why                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version, from the Phase 3 business requirements v2 and Linh's answers                                      | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                          | Linh's decision 2026-10-09 |
| 2026-10-09 | Guest access level: row in Access levels, Guest column in the permission matrix, Sam Stakeholder a Guest of SHOP | Guest access (BR-GUEST-01) |
