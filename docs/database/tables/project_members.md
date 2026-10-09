---
title: project_members
type: table
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
model: ProjectMember
updated: 2026-10-09
---

# project_members

One row per person in a project, with their one access level and an optional job title. Read on every project-scoped request to decide what
the caller may do ([DD-PROJECT-01](../../design/detail/logic/DD-PROJECT-01-permissions.md)).

## Columns

| Column       | Type            | Null | Default             | Key    | Definition                                                                                                                                               | Classification | Rule                                      | Since phase |
| ------------ | --------------- | ---- | ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------- | ----------- |
| `project_id` | text            | no   |                     | PK, FK | Project the person belongs to                                                                                                                            | internal       |                                           | 3           |
| `user_id`    | text            | no   |                     | PK, FK | Person who is a member                                                                                                                                   | internal       | BR-PROJECT-11                             | 3           |
| `access`     | `ProjectAccess` | no   |                     |        | What the member may do in this project: `PROJECT_ADMIN`, `MEMBER` or `GUEST` (read only, limited to `projects.guest_areas`)                              | internal       | BR-PROJECT-10, BR-PROJECT-35, BR-GUEST-01 | 3           |
| `job_title`  | `JobTitle`      | yes  |                     |        | What the member does, as a short key: `QAE`, `QAL`, `QAA`, `PM`, `PO`, `BA`, `DEV`, `TL`, `DES`, `STK` or `OTH`; `NULL` = none. No effect on permissions | internal       | BR-PROJECT-37                             | 3           |
| `created_at` | timestamp(3)    | no   | `now()`             |        | Time the person was added (UTC)                                                                                                                          | internal       |                                           | 3           |
| `updated_at` | timestamp(3)    | no   | Prisma `@updatedAt` |        | Time the access level or job title last changed (UTC)                                                                                                    | internal       |                                           | 3           |

`Classification`: public, internal, personal (identifies a person), secret (must never leave the API).

## Indexes and constraints

| Name                          | Columns                 | Kind        | Why                                            |
| ----------------------------- | ----------------------- | ----------- | ---------------------------------------------- |
| `project_members_pkey`        | `project_id`, `user_id` | primary key | One row per person per project (BR-PROJECT-10) |
| `project_members_user_id_idx` | `user_id`               | index       | "My projects" list (API-PROJECT-01)            |

## Relationships

| Column       | References    | On delete | Meaning                                                                   |
| ------------ | ------------- | --------- | ------------------------------------------------------------------------- |
| `project_id` | `projects.id` | cascade   | Members go with the project                                               |
| `user_id`    | `users.id`    | cascade   | Users are not deleted in Phase 3; if they are later, their memberships go |

## Lifecycle

| Event                                   | Effect on rows                                                                                                                       | Rule                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Project created                         | First Project admin (picked by the System admin) inserted as `PROJECT_ADMIN`, no job title                                           | BR-PROJECT-01                                              |
| Member added                            | Insert; 409 if the pair exists                                                                                                       | BR-PROJECT-10, BR-PROJECT-23                               |
| Access level or job title changed       | Update `access` and/or `job_title`                                                                                                   | BR-PROJECT-13, BR-PROJECT-23, BR-PROJECT-24, BR-PROJECT-37 |
| Project admin changed by a System admin | The chosen user inserted or updated to `PROJECT_ADMIN`; optionally the other `PROJECT_ADMIN` rows updated to `MEMBER` (API-ADMIN-12) | BR-ADMIN-04                                                |
| Member removed or leaves                | Delete the row, unless it is the last `PROJECT_ADMIN`                                                                                | BR-PROJECT-12                                              |
| Project deleted                         | All rows cascade                                                                                                                     | BR-PROJECT-09                                              |

## Retention

A row lives while the person is in the project. Removing a member deletes the row; the activity log keeps the
record that they were added and removed.

## Data quality rules

| Rule                                                                              | Checked by                                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| At least one `PROJECT_ADMIN` per project at all times                             | Member service, inside the same transaction as the change (BR-PROJECT-12) |
| `job_title` is one of the 11 keys or `NULL`                                       | Postgres enum `JobTitle` (BR-PROJECT-37)                                  |
| Nobody changes their own `access`, except a Project admin stepping down to Member | Member service (BR-PROJECT-24)                                            |

## Seed data

`SHOP` has two Project admins, five Members and one Guest (Sam Stakeholder, `stakeholder@qawm.test`, job title `STK`), each with a different job title; full list in [requirements/project/README.md](../../requirements/project/README.md#test-data).

## Used by

API-PROJECT-01, API-PROJECT-03, API-PROJECT-08 to API-PROJECT-11, API-ADMIN-12, and the permission check of every project-scoped
endpoint.

## Change log

| Date       | Change                                                                                              | Migration                                                                                                                                                                                                                                                                                                                 | Why                                     |
| ---------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 2026-10-08 | First version                                                                                       | `<ts>_add_projects` (in the Phase 3 code PR)                                                                                                                                                                                                                                                                              | Phase 3A                                |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects             | `20261009080000_project_access_job_title` (role → access + job title: `OWNER`, `PROJECT_MANAGER`, `QA_LEAD` → `PROJECT_ADMIN`, others → `MEMBER`; job title `OWNER`/`PROJECT_MANAGER` → `PM`, `QA_LEAD` → `QAL`, `QA_ENGINEER` → `QAE`, `TEAM_LEAD` → `TL`, `DEVELOPER` → `DEV`, `STAKEHOLDER` → `STK`, `VIEWER` → `OTH`) | Linh's decision 2026-10-09              |
| 2026-10-09 | `ProjectAccess` gains `GUEST`; Change project admin; Sam Stakeholder is a Guest of SHOP in the seed | `20261009123334_guest_access_and_settings`                                                                                                                                                                                                                                                                                | Guest access (BR-GUEST-01), BR-ADMIN-04 |
