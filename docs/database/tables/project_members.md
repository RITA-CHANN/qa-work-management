---
title: project_members
type: table
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
model: ProjectMember
updated: 2026-10-08
---

# project_members

One row per person in a project, with their one project role. Read on every project-scoped request to decide what
the caller may do ([DD-PROJECT-01](../../design/detail/logic/DD-PROJECT-01-permissions.md)).

## Columns

| Column       | Type          | Null | Default             | Key    | Definition                                                                                                                                   | Classification | Rule                         | Since phase |
| ------------ | ------------- | ---- | ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------- | ----------- |
| `project_id` | text          | no   |                     | PK, FK | Project the person belongs to                                                                                                                | internal       |                              | 3           |
| `user_id`    | text          | no   |                     | PK, FK | Person who is a member                                                                                                                       | internal       | BR-PROJECT-11                | 3           |
| `role`       | `ProjectRole` | no   |                     |        | The member's role in this project: `OWNER`, `PROJECT_MANAGER`, `QA_LEAD`, `QA_ENGINEER`, `TEAM_LEAD`, `DEVELOPER`, `STAKEHOLDER` or `VIEWER` | internal       | BR-PROJECT-10, BR-PROJECT-35 | 3           |
| `created_at` | timestamp(3)  | no   | `now()`             |        | Time the person was added (UTC)                                                                                                              | internal       |                              | 3           |
| `updated_at` | timestamp(3)  | no   | Prisma `@updatedAt` |        | Time the role last changed (UTC)                                                                                                             | internal       |                              | 3           |

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

| Event                    | Effect on rows                                | Rule                                        |
| ------------------------ | --------------------------------------------- | ------------------------------------------- |
| Project created          | Creator inserted as `OWNER`                   | BR-PROJECT-01                               |
| Member added             | Insert; 409 if the pair exists                | BR-PROJECT-10, BR-PROJECT-23                |
| Role changed             | Update `role`                                 | BR-PROJECT-13, BR-PROJECT-23, BR-PROJECT-24 |
| Member removed or leaves | Delete the row, unless it is the last `OWNER` | BR-PROJECT-12                               |
| Project deleted          | All rows cascade                              | BR-PROJECT-09                               |

## Retention

A row lives while the person is in the project. Removing a member deletes the row; the activity log keeps the
record that they were added and removed.

## Data quality rules

| Rule                                                                                     | Checked by                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| At least one `OWNER` per project at all times                                            | Member service, inside the same transaction as the change (BR-PROJECT-12) |
| Only an `OWNER` (or Admin) writes a row whose old or new role is `OWNER`                 | Member service (BR-PROJECT-23)                                            |
| Nobody changes their own role, except an Owner stepping down while another Owner remains | Member service (BR-PROJECT-24)                                            |

## Seed data

`SHOP` has one member per role; full list in [requirements/project/README.md](../../requirements/project/README.md#test-data).

## Used by

API-PROJECT-01, API-PROJECT-03, API-PROJECT-08 to API-PROJECT-11, and the permission check of every project-scoped
endpoint.

## Change log

| Date       | Change        | Migration                                    | Why      |
| ---------- | ------------- | -------------------------------------------- | -------- |
| 2026-10-08 | First version | `<ts>_add_projects` (in the Phase 3 code PR) | Phase 3A |
