---
title: milestones
type: table
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
model: Milestone
updated: 2026-10-08
---

# milestones

One row per agile milestone (a sprint): a time-boxed iteration of 1–28 days inside one release, with a goal.

## Columns

| Column            | Type              | Null | Default             | Key | Definition                                                               | Classification | Rule                         | Since phase |
| ----------------- | ----------------- | ---- | ------------------- | --- | ------------------------------------------------------------------------ | -------------- | ---------------------------- | ----------- |
| `id`              | text              | no   | `cuid()`            | PK  | Unique identifier of the milestone                                       | internal       |                              | 3           |
| `project_id`      | text              | no   |                     | FK  | Project the milestone belongs to (same as its release's project)         | internal       | BR-PROJECT-26                | 3           |
| `release_id`      | text              | no   |                     | FK  | Release the milestone is part of                                         | internal       | BR-PROJECT-26                | 3           |
| `name`            | text              | no   |                     |     | Display name as typed (trimmed), 1–50 characters, for example "Sprint 4" | internal       | BR-PROJECT-27                | 3           |
| `name_normalized` | text              | no   |                     |     | `name` trimmed and lower-cased, used only to enforce uniqueness          | internal       | BR-PROJECT-27                | 3           |
| `goal`            | text              | yes  |                     |     | What the team wants to reach in this milestone, at most 500 characters   | internal       | BR-PROJECT-27                | 3           |
| `start_date`      | date              | no   |                     |     | First calendar day of the milestone                                      | internal       | BR-PROJECT-28                | 3           |
| `end_date`        | date              | no   |                     |     | Last calendar day of the milestone (inclusive)                           | internal       | BR-PROJECT-28                | 3           |
| `status`          | `MilestoneStatus` | no   | `PLANNED`           |     | Where the milestone is in its life: `PLANNED`, `ACTIVE` or `COMPLETED`   | internal       | BR-PROJECT-31, BR-PROJECT-32 | 3           |
| `version`         | integer           | no   | `1`                 |     | Edit counter used to detect concurrent edits                             | internal       | BR-PROJECT-07                | 3           |
| `created_at`      | timestamp(3)      | no   | `now()`             |     | Time the row was created (UTC)                                           | internal       |                              | 3           |
| `updated_at`      | timestamp(3)      | no   | Prisma `@updatedAt` |     | Time the row was last changed (UTC)                                      | internal       |                              | 3           |

`Classification`: public, internal, personal (identifies a person), secret (must never leave the API). Dates are
calendar dates without time (ISO 8601 `YYYY-MM-DD`).

## Indexes and constraints

| Name                                        | Columns                                | Kind                           | Why                                                                              |
| ------------------------------------------- | -------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `milestones_pkey`                           | `id`                                   | primary key                    |                                                                                  |
| `milestones_project_id_name_normalized_key` | `project_id`, `name_normalized`        | unique                         | Names unique within the project (BR-PROJECT-27)                                  |
| `milestones_one_active_per_project`         | `project_id` where `status = 'ACTIVE'` | partial unique index           | At most one active milestone per project (BR-PROJECT-32)                         |
| `milestones_dates_check`                    | `start_date`, `end_date`               | check `end_date >= start_date` | BR-PROJECT-28 (the 28-day maximum is a setting, so it is checked in the service) |
| `milestones_release_id_idx`                 | `release_id`                           | index                          | List milestones of a release; overlap check                                      |

## Relationships

| Column       | References    | On delete | Meaning                                                    |
| ------------ | ------------- | --------- | ---------------------------------------------------------- |
| `release_id` | `releases.id` | restrict  | A release with milestones can't be deleted (BR-PROJECT-18) |
| `project_id` | `projects.id` | restrict  | Kept for the per-project unique indexes                    |

## Lifecycle

| Event         | Effect on rows                                                                                     | Rule                                        |
| ------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Create        | Insert as `PLANNED` after the length, inside-release and no-overlap checks                         | BR-PROJECT-28, BR-PROJECT-29, BR-PROJECT-30 |
| Edit          | Name, goal, dates change (same checks); `version` + 1                                              | BR-PROJECT-07                               |
| Status change | `PLANNED → ACTIVE → COMPLETED`; activate only if the release is `ACTIVE` and no other milestone is | BR-PROJECT-31, BR-PROJECT-32                |
| Delete        | Only while `PLANNED`                                                                               | BR-PROJECT-33                               |

## Retention

Kept as long as the project. Completed milestones are history and are never deleted.

## Data quality rules

| Rule                                                  | Checked by                                               |
| ----------------------------------------------------- | -------------------------------------------------------- |
| Length 1 to `MILESTONE_MAX_DAYS` (28) days            | Zod schema with the setting                              |
| Inside the release's dates when they are set          | Milestone service (`dates.ts`), unit-tested              |
| No overlap with another milestone of the same release | Milestone service, in the same transaction as the write  |
| `project_id` equals the release's `project_id`        | Set by the service from the release, never from the body |

## Seed data

`SHOP`: Sprint 1, Sprint 2 (release 2.3, Completed); Sprint 3 (2.4, Completed), Sprint 4 (2.4, Active);
Sprint 5 (2.5, Planned). `OLD`: M1 (1.0, Completed). Dates are relative to the day the seed runs.

## Used by

API-MILESTONE-01 to API-MILESTONE-04, API-PROJECT-03 (current milestone), API-RELEASE-03 (release can't be
released with open milestones).

## Change log

| Date       | Change        | Migration                                    | Why      |
| ---------- | ------------- | -------------------------------------------- | -------- |
| 2026-10-08 | First version | `<ts>_add_projects` (in the Phase 3 code PR) | Phase 3A |
