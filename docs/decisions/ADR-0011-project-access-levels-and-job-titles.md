---
id: ADR-0011
title: Project access levels and job titles (Backlog style)
type: decision
status: accepted
phase: 3
owner: Claude
reviewers: [Linh]
deciders: [Linh, Claude]
approved: 2026-10-09
updated: 2026-10-09
---

# ADR-0011 Project access levels and job titles (Backlog style)

Format: MADR 4.0 (Markdown Architectural Decision Records), the decision-and-rationale part of an ISO/IEC/IEEE
42010 architecture description.

## Context and problem

The first Phase 3A design gave each member one of 8 project roles (Owner, Project manager, QA lead, QA engineer,
Team lead, Developer, Stakeholder, Viewer), and each role had its own rights. The role mixed two questions: **what
may this person do** in the project, and **what is their job**. That made the permission matrix 8 columns wide, gave
small differences (a Team lead could plan sprints but not releases; only an Owner could archive), and forced a title
change whenever someone needed more or fewer rights. Any logged-in user could also create a project and became its
Owner, so projects could appear without anyone in charge of the system knowing.

## Decision drivers

- Permissions that people can explain in one sentence and test with few logins.
- A job title that describes the person (for assignment, filters and dashboards later) without changing rights.
- Control over which projects exist: a client's project should not be created by just anyone.
- Room for a read-only outside follower (client, sponsor) later, with limited areas.
- Keep the 404-for-non-members rule (ADR-0008) and the System admin's reach (BR-PROJECT-36).

## Considered options

1. 8 permission roles, each with its own rights (the first 3A design).
2. 3 access levels (System admin, Project admin, Member) plus an optional job title with no rights.
3. 3 access levels plus a Guest level (read only, only the areas the Project admins switch on) plus a job title.

## Decision outcome

Chosen option: "3 access levels plus an optional job title", because it answers "what may this person do" with two
project levels and a global one (driver 1), keeps the job title free to describe the person (driver 2), and is the
model of Backlog and similar trackers the team already knows. Decided by Linh on 2026-10-09 ("3 cấp + chức danh").
Option 3 is kept for later: the Guest level and its per-area visibility switches come in Phase 3C, with the Project
settings page they need (driver 4).

Together with this, Linh decided that **only a System admin creates projects** (driver 3): `POST /api/projects`
returns 403 for everyone else, and the System admin picks the first Project admin, an existing user, who becomes the
project's only member. The System admin is not added as a member.

The model in short:

| Level         | Where                                    | What                                                                                                                      |
| ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| System admin  | `users.global_role = ADMIN`              | Creates projects; acts as Project admin on every project without being a member                                           |
| Project admin | `project_members.access = PROJECT_ADMIN` | Edits the project, manages all members (other Project admins included), releases, milestones; archives, restores, deletes |
| Member        | `project_members.access = MEMBER`        | Sees the whole project; in 3A read only                                                                                   |

Job titles (`project_members.job_title`, optional, stored as a short key): QAE QA engineer, QAL QA lead, QAA QA
automation engineer, PM Project manager, PO Product owner, BA Business analyst, DEV Developer, TL Team lead, DES
Designer, STK Stakeholder, OTH Other.

### Consequences

- Good, because the permission matrix has two project columns and every write is "Project admin only"; the API
  checks the same map (`packages/shared/src/permissions.ts`) and `npm run docs:check` compares it with the README.
- Good, because a job title can change without touching rights, and later phases can assign bugs or reviews by it.
- Good, because projects only appear when a System admin creates them, each with a named Project admin.
- Bad, because a Team lead loses the right to plan sprints unless they are made Project admin; finer rights (for
  example "may plan sprints") would need a new level or per-action grants later.
- Bad, because any Project admin can demote or remove another Project admin; there is no Owner above them. The
  last-Project-admin rule (BR-PROJECT-12) and the activity log are the safety net.
- Bad, because a team that needs a new project must ask a System admin.
- Neutral: existing rows are migrated (`20261009080000_project_access_job_title`): `OWNER`, `PROJECT_MANAGER`,
  `QA_LEAD` become Project admins, the others Members, and the old role becomes the job title (`OWNER` → `PM`,
  `PROJECT_MANAGER` → `PM`, `QA_LEAD` → `QAL`, `QA_ENGINEER` → `QAE`, `TEAM_LEAD` → `TL`, `DEVELOPER` → `DEV`,
  `STAKEHOLDER` → `STK`, `VIEWER` → `OTH`).
- Neutral: the API renames `myRole` to `myAccess`, the member's `role` to `access` plus `jobTitle`, the activity
  action `member.role_changed` to `member.updated`, and the error codes `LAST_OWNER` / `OWN_ROLE` to
  `LAST_PROJECT_ADMIN` / `OWN_ACCESS`.

### Confirmation

BR-PROJECT-01, BR-PROJECT-12, BR-PROJECT-23, BR-PROJECT-24, BR-PROJECT-35, BR-PROJECT-37 and their criteria;
`permissions.test.ts` (2 access levels × every action), `guards.test.ts` (every service write calls `assertCan`, and
`createProject` checks the global role), and the permission-matrix check in `npm run docs:check`.

## Pros and cons of the options

### 8 permission roles

- Good, because each job could get exactly the rights it needs.
- Bad, because 8 columns × every action is a large matrix to explain and test, and small differences surprise people.
- Bad, because a job title and a set of rights are tied together: changing one changes the other.
- Bad, because special rules (only an Owner manages Owners) add cases the UI must explain.

### 3 access levels plus a job title

- Good, because rights are simple and the job title is free to describe the person.
- Good, because it matches tools the team knows (Backlog).
- Bad, because there are no finer rights between Project admin and Member.

### 3 access levels plus a Guest level

- Good, because outside followers could see only the areas the Project admins allow.
- Bad, because it needs per-area visibility switches checked on the server, a Project settings page and search and
  dashboard filtering: too much for 3A. Planned for Phase 3C.

## More information

[requirements/project README](../requirements/project/README.md#access-levels) (access levels, job titles,
permission matrix), [DD-PROJECT-01 Permissions](../design/detail/logic/DD-PROJECT-01-permissions.md),
[ADR-0008](ADR-0008-hide-projects-from-non-members.md). Replaces the 8-role model of the first Phase 3A design (no
earlier ADR).
