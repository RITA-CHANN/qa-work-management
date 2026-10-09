---
title: activity_logs
type: table
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
model: ActivityLog
updated: 2026-10-09
---

# activity_logs

One row per change to a project's data: who did what, to which record, when, with old and new values. Append-only:
the code has no update or delete path (BR-PROJECT-21). Later phases write to the same table.

## Columns

| Column        | Type         | Null | Default  | Key | Definition                                                                                                                                                       | Classification | Rule          | Since phase |
| ------------- | ------------ | ---- | -------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------- | ----------- |
| `id`          | text         | no   | `cuid()` | PK  | Unique identifier of the entry; also the pagination cursor                                                                                                       | internal       |               | 3           |
| `project_id`  | text         | no   |          | FK  | Project the change belongs to                                                                                                                                    | internal       |               | 3           |
| `actor_id`    | text         | no   |          | FK  | User who made the change                                                                                                                                         | internal       | BR-PROJECT-20 | 3           |
| `action`      | text         | no   |          |     | Machine name of what happened, `<entity>.<verb>`, for example `member.updated`                                                                                   | internal       | BR-PROJECT-19 | 3           |
| `entity_type` | text         | no   |          |     | Kind of record changed: `project`, `member`, `release`, `milestone`                                                                                              | internal       |               | 3           |
| `entity_id`   | text         | no   |          |     | Id of the record changed (a user id for `member`)                                                                                                                | internal       |               | 3           |
| `summary`     | text         | no   |          |     | Sentence shown to people, written at the time of the change, for example "Oanh Owner changed Linh QA's access from Member to Project admin"                      | personal       | BR-PROJECT-20 | 3           |
| `changes`     | jsonb        | yes  |          |     | Changed fields with old and new value: `{ "name": { "from": "A", "to": "B" } }` (for `member.updated`: `access` and/or `jobTitle`); `null` for create and delete | internal       | BR-PROJECT-20 | 3           |
| `created_at`  | timestamp(3) | no   | `now()`  |     | Time of the change (UTC)                                                                                                                                         | internal       |               | 3           |

`Classification`: public, internal, personal (identifies a person), secret (must never leave the API). `summary`
is personal because it contains names.

## Indexes and constraints

| Name                                         | Columns                                    | Kind        | Why                                                     |
| -------------------------------------------- | ------------------------------------------ | ----------- | ------------------------------------------------------- |
| `activity_logs_pkey`                         | `id`                                       | primary key |                                                         |
| `activity_logs_project_id_created_at_id_idx` | `project_id`, `created_at` desc, `id` desc | index       | Newest-first pages with a stable cursor (BR-PROJECT-21) |

## Relationships

| Column       | References    | On delete | Meaning                                                    |
| ------------ | ------------- | --------- | ---------------------------------------------------------- |
| `project_id` | `projects.id` | cascade   | The log goes with a deleted project                        |
| `actor_id`   | `users.id`    | restrict  | Keep the audit trail: a user with entries can't be deleted |

## Lifecycle

| Event                              | Effect on rows                                       | Rule                         |
| ---------------------------------- | ---------------------------------------------------- | ---------------------------- |
| Any change listed in BR-PROJECT-19 | Insert one row in the same transaction as the change | BR-PROJECT-19, BR-PROJECT-22 |
| A change is refused                | No row                                               | BR-PROJECT-22                |
| Project deleted                    | All its rows cascade                                 | BR-PROJECT-09                |

## Retention

Kept as long as the project exists; never edited. Deleting the project removes its log. A retention limit (for
example 2 years) can be added later if the table grows; not needed in Phase 3.

## Data quality rules

| Rule                                                    | Checked by                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Every write in BR-PROJECT-19 produces exactly one entry | `recordActivity(tx, …)` called by each service; API tests count entries |
| No entry for a refused change                           | Same transaction (NFR-PROJECT-03)                                       |
| `changes` lists only fields whose value changed         | `diff()` helper, unit-tested                                            |

## Seed data

A few entries per seed project ("Ada Admin created the project", "Ada Admin added Oanh Owner as Project admin (Product owner)") so the Activity tab is not empty.

## Used by

API-PROJECT-12 (read); every write endpoint of projects, members, releases and milestones (write).
[DD-PROJECT-02](../../design/detail/logic/DD-PROJECT-02-activity-log.md).

## Change log

| Date       | Change                                                                                                                                   | Migration                                    | Why                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------- |
| 2026-10-08 | First version                                                                                                                            | `<ts>_add_projects` (in the Phase 3 code PR) | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects (`member.role_changed` renamed `member.updated`) | —                                            | Linh's decision 2026-10-09 |
