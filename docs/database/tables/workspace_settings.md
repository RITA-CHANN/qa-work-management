---
title: workspace_settings
type: table
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
model: WorkspaceSetting
updated: 2026-10-09
---

# workspace_settings

One row (`id` = `default`) holding the workspace-wide settings a System admin changes in Admin console › Settings
(SCR-ADMIN-05): the Guest areas new projects start with (BR-GUEST-02) and how long audit events are kept
(BR-ADMIN-17). Read and written only through [API-ADMIN-13](../../api/admin/get-settings.md) and
[API-ADMIN-14](../../api/admin/put-settings.md); also read when a project is created (API-PROJECT-02) and by the audit
retention clean-up. Requirements: [requirements/admin](../../requirements/admin/README.md),
[requirements/guest](../../requirements/guest/README.md).

## Columns

| Column                 | Type         | Null | Default                | Key | Definition                                                                                                                         | Classification | Rule        | Since phase |
| ---------------------- | ------------ | ---- | ---------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------- | ----------- |
| `id`                   | text         | no   | `'default'`            | PK  | Fixed identifier of the single settings row                                                                                        | internal       |             | 3 (3C)      |
| `default_guest_areas`  | text[]       | yes  | `{dashboard,releases}` |     | Guest areas copied into `projects.guest_areas` when a project is created, values of `GUEST_AREAS` (`packages/shared/src/guest.ts`) | internal       | BR-GUEST-02 | 3 (3C)      |
| `audit_retention_days` | integer      | no   | `365`                  |     | Number of days an audit event is kept before the clean-up deletes it, 30 to 3650                                                   | internal       | BR-ADMIN-17 | 3 (3C)      |
| `updated_at`           | timestamp(3) | no   | Prisma `@updatedAt`    |     | Time the settings were last changed (UTC)                                                                                          | internal       |             | 3 (3C)      |

`Classification`: public, internal, personal (identifies a person), secret (must never leave the API).
Times are stored in UTC and shown as ISO 8601.

## Indexes and constraints

| Name                      | Columns | Kind        | Why                                                     |
| ------------------------- | ------- | ----------- | ------------------------------------------------------- |
| `workspace_settings_pkey` | `id`    | primary key | The code reads and writes only the row `id = 'default'` |

There is no check constraint on the range of `audit_retention_days` or the area names: the API schema
(`workspaceSettingsSchema`) is the only writer.

## Relationships

None. `projects.guest_areas` is a copy taken at creation, not a reference: changing the default does not change
existing projects.

## Lifecycle

| Event                                               | Effect on rows                                                                                   | Rule                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------ |
| First read (API-ADMIN-13, project create, clean-up) | `getSettings` upserts the row with the defaults if it is missing                                 | BR-ADMIN-17, BR-GUEST-02 |
| Settings saved (API-ADMIN-14)                       | Both values replaced; one audit event `settings.updated` with before and after, same transaction | BR-ADMIN-14, BR-ADMIN-16 |
| Same values saved                                   | Row updated (`updated_at`), no audit event                                                       |                          |

## Retention

Kept for ever: the row is never deleted.

## Data quality rules

| Rule                                                     | Checked by                                       |
| -------------------------------------------------------- | ------------------------------------------------ |
| Exactly one row, `id = 'default'`                        | `settings.service.ts` uses only that id (upsert) |
| `audit_retention_days` is a whole number from 30 to 3650 | Zod schema (`workspaceSettingsSchema`)           |
| `default_guest_areas` holds only known areas             | Zod schema (`guestAreaSchema`)                   |

## Seed data

None: the row is created with its defaults (`dashboard`, `releases`; 365 days) on the first read.

## Used by

[API-ADMIN-13](../../api/admin/get-settings.md), [API-ADMIN-14](../../api/admin/put-settings.md),
[API-PROJECT-02](../../api/projects/post-project.md) (reads `default_guest_areas`), and the audit retention clean-up
in `apps/api/src/server.ts` (reads `audit_retention_days`). Screen:
[SCR-ADMIN-05](../../design/basic/screens/SCR-ADMIN-05-settings.md).

## Change log

| Date       | Change        | Migration                                  | Why                                 |
| ---------- | ------------- | ------------------------------------------ | ----------------------------------- |
| 2026-10-09 | First version | `20261009123334_guest_access_and_settings` | Phase 3C (BR-GUEST-02, BR-ADMIN-17) |
