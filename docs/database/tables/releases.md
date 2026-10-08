---
title: releases
type: table
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
model: Release
updated: 2026-10-08
---

# releases

One row per planned or shipped version of the product under test (for example "2.4"). Milestones (sprints) belong
to a release; later phases group test runs and bugs by release.

## Columns

| Column            | Type            | Null | Default             | Key | Definition                                                          | Classification | Rule                         | Since phase |
| ----------------- | --------------- | ---- | ------------------- | --- | ------------------------------------------------------------------- | -------------- | ---------------------------- | ----------- |
| `id`              | text            | no   | `cuid()`            | PK  | Unique identifier of the release                                    | internal       |                              | 3           |
| `project_id`      | text            | no   |                     | FK  | Project the release belongs to                                      | internal       |                              | 3           |
| `name`            | text            | no   |                     |     | Display name of the release as typed (trimmed), 1–50 characters     | internal       | BR-PROJECT-14                | 3           |
| `name_normalized` | text            | no   |                     |     | `name` trimmed and lower-cased, used only to enforce uniqueness     | internal       | BR-PROJECT-14                | 3           |
| `status`          | `ReleaseStatus` | no   | `PLANNED`           |     | Where the release is in its life: `PLANNED`, `ACTIVE` or `RELEASED` | internal       | BR-PROJECT-16, BR-PROJECT-17 | 3           |
| `start_date`      | date            | yes  |                     |     | Calendar day work on the release starts                             | internal       | BR-PROJECT-15                | 3           |
| `target_date`     | date            | yes  |                     |     | Calendar day the release is planned to ship                         | internal       | BR-PROJECT-15                | 3           |
| `version`         | integer         | no   | `1`                 |     | Edit counter used to detect concurrent edits                        | internal       | BR-PROJECT-07                | 3           |
| `created_at`      | timestamp(3)    | no   | `now()`             |     | Time the row was created (UTC)                                      | internal       |                              | 3           |
| `updated_at`      | timestamp(3)    | no   | Prisma `@updatedAt` |     | Time the row was last changed (UTC)                                 | internal       |                              | 3           |

`Classification`: public, internal, personal (identifies a person), secret (must never leave the API). Dates are
calendar dates without time (ISO 8601 `YYYY-MM-DD`).

## Indexes and constraints

| Name                                      | Columns                                | Kind                                                | Why                                                                                    |
| ----------------------------------------- | -------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `releases_pkey`                           | `id`                                   | primary key                                         |                                                                                        |
| `releases_project_id_name_normalized_key` | `project_id`, `name_normalized`        | unique                                              | No two releases with the same name in one project (BR-PROJECT-14)                      |
| `releases_one_active_per_project`         | `project_id` where `status = 'ACTIVE'` | partial unique index                                | At most one active release per project, even under concurrent requests (BR-PROJECT-17) |
| `releases_dates_check`                    | `start_date`, `target_date`            | check `target_date >= start_date` when both are set | BR-PROJECT-15                                                                          |

## Relationships

| Column                          | References    | On delete | Meaning                                                    |
| ------------------------------- | ------------- | --------- | ---------------------------------------------------------- |
| `project_id`                    | `projects.id` | restrict  | A project with releases can't be deleted (BR-PROJECT-09)   |
| (child) `milestones.release_id` | `releases.id` | restrict  | A release with milestones can't be deleted (BR-PROJECT-18) |

## Lifecycle

| Event         | Effect on rows                                                                              | Rule                                        |
| ------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Create        | Insert with status `PLANNED`                                                                | BR-PROJECT-14, BR-PROJECT-15                |
| Edit          | Name and dates change; `version` + 1                                                        | BR-PROJECT-07                               |
| Status change | `PLANNED → ACTIVE → RELEASED` only; `RELEASED` only when all its milestones are `COMPLETED` | BR-PROJECT-16, BR-PROJECT-17, BR-PROJECT-25 |
| Delete        | Only while `PLANNED` with no milestones                                                     | BR-PROJECT-18                               |

State diagram: [DD-PROJECT-04](../../design/detail/logic/DD-PROJECT-04-release-milestone-lifecycle.md).

## Retention

Kept as long as the project. A released release is history and is never deleted.

## Data quality rules

| Rule                                         | Checked by                                |
| -------------------------------------------- | ----------------------------------------- |
| `name_normalized` equals `lower(trim(name))` | Set by the release service on every write |
| Status never moves backwards                 | Release workflow table (unit-tested)      |
| One `ACTIVE` release per project             | Service check plus partial unique index   |
| Dates in order                               | Zod schema plus check constraint          |

## Seed data

`SHOP`: 2.3 Released, 2.4 Active, 2.5 Planned. `MOBI`: 1.0 Planned. `OLD`: 1.0 Released. Dates are relative to
the day the seed runs.

## Used by

API-RELEASE-01 to API-RELEASE-04, API-PROJECT-01 (active release column), API-MILESTONE-02 (date checks).

## Change log

| Date       | Change        | Migration                                    | Why      |
| ---------- | ------------- | -------------------------------------------- | -------- |
| 2026-10-08 | First version | `<ts>_add_projects` (in the Phase 3 code PR) | Phase 3A |
