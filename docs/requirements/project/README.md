---
title: Projects
type: feature
feature: project
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-08
---

# Projects

Business requirements for projects, members and roles, releases, milestones and the activity log (ISO/IEC/IEEE
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
| Decisions     | [ADR-0008 Hide other projects (404)](../../decisions/ADR-0008-hide-projects-from-non-members.md), [ADR-0009 Optimistic locking](../../decisions/ADR-0009-optimistic-locking.md), [ADR-0010 Problem details for API errors](../../decisions/ADR-0010-problem-details-errors.md)                                                                                                                                                                                                                                              |

## Goal

Every piece of QA work (requirements, test cases, runs, bugs) belongs to a **project**. This feature lets a team
create projects, decide who is in each project and what they may do, plan releases and the agile milestones
(sprints) inside them, and see who changed what. After it, the app knows not only **who** is acting (Phase 2) but
**where** and **with which rights**.

## Stakeholders

| Stakeholder                                   | What they care about                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| Project owner                                 | Controls who is in the project and who else is Owner; nothing lost by mistake |
| Project manager                               | Plans releases and sprints; adds the right people quickly                     |
| QA lead and QA team                           | A clear release and sprint to test against; access for the whole QA team      |
| Leaders of other teams (dev, BA, design)      | Plan their team's sprints with the PM                                         |
| Stakeholders (client, product owner, sponsor) | See the plan and progress without being able to change it by accident         |
| Admin                                         | Can help any team, even without being a member                                |
| QA (Linh) as tester of this app               | Every rule has a criterion; seed data covers every role                       |

## Actors

| Actor          | Description                                                                             |
| -------------- | --------------------------------------------------------------------------------------- |
| User           | Any logged-in person (global role `USER`). Sees only the projects they are a member of. |
| Admin          | Global role `ADMIN`. Sees and manages every project, even without being a member.       |
| Project member | A user added to a project with exactly one project role (below).                        |

### Project roles

| Role              | In short                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `OWNER`           | Owns the project: everything, plus archive, delete, and who else is Owner.                         |
| `PROJECT_MANAGER` | Runs the delivery: project details, members, releases, milestones.                                 |
| `QA_LEAD`         | Leads the QA team: project details, members, releases, milestones.                                 |
| `QA_ENGINEER`     | Does the QA work. In 3A: read only (writes come with requirements, test cases, bugs).              |
| `TEAM_LEAD`       | Leader of another team (dev, BA, design…): plans milestones with the PM. Later: triages bugs.      |
| `DEVELOPER`       | Reads the project. Later: works on bugs assigned to them.                                          |
| `STAKEHOLDER`     | Business side (client, product owner, sponsor): read only. Later: comments and signs off releases. |
| `VIEWER`          | Read only, always.                                                                                 |

### Permission matrix

✅ allowed · ❌ refused with 403 · Admin can do everything an Owner can (BR-PROJECT-36). Columns: OWN Owner,
PM Project manager, QAL QA lead, QAE QA engineer, TL Team lead, DEV Developer, STK Stakeholder, VIEW Viewer.
This table is BR-PROJECT-35 and also the permission test matrix: one row × one column = one test.

| Action                                                       | OWN | PM  | QAL | QAE | TL  | DEV | STK | VIEW | Not a member |
| ------------------------------------------------------------ | --- | --- | --- | --- | --- | --- | --- | ---- | ------------ |
| See the project, members, releases, milestones, activity     | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅   | 404          |
| Edit name and description                                    | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌   | 404          |
| Create, edit, change status of, delete a release             | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌   | 404          |
| Create, edit, change status of, delete a milestone           | ✅  | ✅  | ✅  | ❌  | ✅  | ❌  | ❌  | ❌   | 404          |
| Add a member, change a role, remove a member (except Owners) | ✅  | ✅  | ✅  | ❌  | ❌  | ❌  | ❌  | ❌   | 404          |
| Give or take away the Owner role, remove an Owner            | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌   | 404          |
| Archive or restore the project                               | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌   | 404          |
| Delete the project                                           | ✅  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌  | ❌   | 404          |
| Leave the project                                            | ✅¹ | ✅  | ✅  | ✅  | ✅  | ✅  | ✅  | ✅   | —            |

¹ Only while another Owner remains (BR-PROJECT-12). Creating a project is open to every logged-in user
(BR-PROJECT-01). On an archived project every change is refused with 422 for every role (BR-PROJECT-08).

## Assumptions and constraints

- Accounts still come from the seed; there is no sign-up or invitation by email.
- The team is small: up to a few hundred projects and a few dozen members per project.
- One API instance and one PostgreSQL database; all dates are calendar dates in UTC, times are stored in UTC.
- A role change takes effect on the next request (the role is read from the database each time, not from the
  session).
- The project key becomes part of later IDs, so it can never change.

## Dependencies

- Authentication ([requirements/auth](../auth/README.md)) for `req.user` and the global role.
- Shared messages and schemas in `packages/shared`.
- RFC 9457 error format ([ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)), introduced with this
  phase and used by all endpoints.
- Every later feature (requirements, test cases, runs, bugs) depends on projects, roles and the activity log.

## Out of scope

- Requirements and comments: Phase 3B.
- Inviting people by email, creating user accounts from the UI.
- Transferring ownership as one action (add another Owner, then leave).
- Sprint board, story points, burndown chart. Milestones hold dates, goal and status only; later phases link test
  runs and bugs to them.
- Several teams running parallel sprints in the same release (BR-PROJECT-30 forbids overlap inside a release).
- Notifications about changes; an activity feed across all projects.
- The Practice Sandbox project (`isPractice`): Phase 14.

## Business risks

| Risk                                                         | Why it matters                                      | Covered by                                   |
| ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------- |
| Someone sees a project they are not in (a client's project)  | Confidential plans leak; we lose the client's trust | BR-PROJECT-06, NFR-PROJECT-01, ADR-0008      |
| A role does more than it should (stakeholder edits the plan) | Wrong plan, no accountability                       | BR-PROJECT-35, NFR-PROJECT-02                |
| A manager makes themselves Owner and takes over the project  | The real owner loses control                        | BR-PROJECT-23, BR-PROJECT-24                 |
| A project is left without an Owner                           | Nobody can archive, delete or fix membership        | BR-PROJECT-12                                |
| Two people overwrite each other's edits                      | Lost work, wrong data that nobody notices           | BR-PROJECT-07, ADR-0009                      |
| A project or release is deleted by mistake                   | QA history is lost                                  | BR-PROJECT-09, BR-PROJECT-18, BR-PROJECT-33  |
| The activity log misses or invents a change                  | Changes can't be traced; audit fails                | BR-PROJECT-21, BR-PROJECT-22, NFR-PROJECT-03 |

## Test data

All seed users share the password `Password123!` (dev and test only). Phase 3 adds four users: **Oanh Owner**
`owner@qawm.test`, **Mai PM** `pm@qawm.test`, **Tuan TeamLead** `teamlead@qawm.test`, **Sam Stakeholder**
`stakeholder@qawm.test` ([users](../../database/tables/users.md#seed-data)).

| Key      | Name            | State    | Members (role)                                                                                                                                                                                                       | Releases → milestones                                                                                                           |
| -------- | --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `SHOP`   | ShopEase Web    | Active   | One person per role: Oanh Owner (Owner), Mai PM (Project manager), Minh Lead (QA lead), Linh QA (QA engineer), Tuan TeamLead (Team lead), Dev Nguyen (Developer), Sam Stakeholder (Stakeholder), Pat Viewer (Viewer) | 2.3 Released → Sprint 1, Sprint 2 Completed · 2.4 Active → Sprint 3 Completed, Sprint 4 Active · 2.5 Planned → Sprint 5 Planned |
| `MOBI`   | ShopEase Mobile | Active   | Linh QA (Owner), Minh Lead (QA lead)                                                                                                                                                                                 | 1.0 Planned, no milestones                                                                                                      |
| `OLD`    | Legacy Portal   | Archived | Minh Lead (Owner), Linh QA (Viewer)                                                                                                                                                                                  | 1.0 Released → M1 Completed                                                                                                     |
| `SECRET` | Internal Tools  | Active   | Ada Admin (Owner) only                                                                                                                                                                                               | —                                                                                                                               |

`SHOP` has every role once, so each column of the permission matrix can be tested by logging in as one seed user.
Sprint dates are set relative to the day the seed runs, so "days left" stays meaningful. Tests only **read** the
seed projects; a test that changes data creates its own project through the API.

## Open questions

| ID           | Question                                                       | Default if you don't answer                                                |
| ------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Q-PROJECT-01 | Split Phase 3 into 3A Projects and 3B Requirements + Comments? | Answered 2026-10-08: yes.                                                  |
| Q-PROJECT-02 | Separate milestones besides releases?                          | Answered 2026-10-08: yes, agile milestones (sprints) inside a release.     |
| Q-PROJECT-03 | Can a QA lead add members?                                     | Answered 2026-10-08: yes; PM and Team lead, Stakeholder roles added too.   |
| Q-PROJECT-04 | Non-member: 404 or 403?                                        | Answered 2026-10-08: 404.                                                  |
| Q-PROJECT-05 | Archive before delete?                                         | Answered 2026-10-08: yes.                                                  |
| Q-PROJECT-06 | Can a PM or QA lead make someone Owner?                        | No, only an Owner (BR-PROJECT-23).                                         |
| Q-PROJECT-07 | Must every milestone belong to a release?                      | Yes (BR-PROJECT-26).                                                       |
| Q-PROJECT-08 | Sprint length limit?                                           | 1 to 28 days, as a setting (BR-PROJECT-28).                                |
| Q-PROJECT-09 | Close a sprint automatically when its end date passes?         | No; show "Overdue by N days" and let a person complete it (BR-PROJECT-34). |

## Change log

| Date       | Change                                                                      | Why      |
| ---------- | --------------------------------------------------------------------------- | -------- |
| 2026-10-08 | First version, from the Phase 3 business requirements v2 and Linh's answers | Phase 3A |
