---
title: audit_events
type: table
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
model: AuditEvent
updated: 2026-10-09
---

# audit_events

One row per security or admin event in the whole workspace: sign-ins (successful and failed), sign-outs, password
changes, every action in Admin console › Users, and every write an Admin makes on a project they are not a member
of (BR-ADMIN-14). Read only through [API-ADMIN-11](../../api/admin/get-audit.md) and the counts of
[API-ADMIN-01](../../api/admin/get-overview.md). Append-only: the code has no update path and deletes only rows past the retention period (BR-ADMIN-15, BR-ADMIN-17).
Generic by target type, so later modules reuse it. Unlike [activity_logs](activity_logs.md), it is not tied to a
project and is shown to Admins only.

## Columns

| Column        | Type         | Null | Default  | Key | Definition                                                                                                                                              | Classification | Rule        | Since phase |
| ------------- | ------------ | ---- | -------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------- | ----------- |
| `id`          | text         | no   | `cuid()` | PK  | Unique identifier of the entry; with `created_at`, the pagination cursor                                                                                | internal       |             | 3           |
| `created_at`  | timestamp(3) | no   | `now()`  |     | Time of the event (UTC)                                                                                                                                 | internal       | BR-ADMIN-15 | 3           |
| `actor_id`    | text         | yes  |          | FK  | User who acted; `null` for a failed sign-in with an email that has no account                                                                           | internal       | BR-ADMIN-15 | 3           |
| `action`      | text         | no   |          |     | Machine name of the event, `<area>.<verb>`, for example `auth.sign_in_failed`, `user.role_changed`, `project.updated`                                   | internal       | BR-ADMIN-14 | 3           |
| `target_type` | text         | no   |          |     | Kind of thing acted on: `session`, `user`, `project`, `member`, `release`, `milestone`, `settings`                                                      | internal       |             | 3           |
| `target_id`   | text         | yes  |          |     | Id of the record acted on; `null` for sign-in events                                                                                                    | internal       |             | 3           |
| `target_name` | text         | no   |          |     | Readable name of the target frozen at write time: the email for sign-ins and user actions, the activity summary for project writes                      | personal       | BR-ADMIN-15 | 3           |
| `project_key` | text         | yes  |          |     | Key of the project the event is about; `null` for sign-ins and user actions. A plain value, not a foreign key, so it survives the project being deleted | internal       | BR-ADMIN-15 | 3           |
| `before`      | jsonb        | yes  |          |     | Values of the changed fields before the change, `{ "status": "ACTIVE" }`; never a password or hash                                                      | internal       | BR-ADMIN-14 | 3           |
| `after`       | jsonb        | yes  |          |     | Values of the changed fields after the change, or extra facts (`{ "reason": "deactivated" }`, `{ "endedSessions": 2 }`); never a password or hash       | internal       | BR-ADMIN-14 | 3           |
| `acted_as`    | text         | yes  |          |     | `ADMIN` when a System admin wrote to a project they are not a member of; otherwise `null` (also for Guest visibility changes by a Project admin)        | internal       | BR-ADMIN-14 | 3           |
| `ip`          | text         | yes  |          |     | Client IP address of the request (`req.ip`); `null` for project writes                                                                                  | personal       | BR-ADMIN-15 | 3           |

`Classification`: public, internal, personal (identifies a person), secret (must never leave the API).
`target_name` and `ip` are personal (emails, names, addresses).

## Indexes and constraints

| Name                             | Columns                      | Kind        | Why                                                   |
| -------------------------------- | ---------------------------- | ----------- | ----------------------------------------------------- |
| `audit_events_pkey`              | `id`                         | primary key |                                                       |
| `audit_events_created_at_id_idx` | `created_at` desc, `id` desc | index       | Newest-first pages with a stable cursor (BR-ADMIN-15) |
| `audit_events_actor_id_idx`      | `actor_id`                   | index       | Filter by actor; foreign keys are indexed             |
| `audit_events_action_idx`        | `action`                     | index       | Filter by action; "failed sign-ins in 7 days" count   |

## Relationships

| Column     | References | On delete | Meaning                                                    |
| ---------- | ---------- | --------- | ---------------------------------------------------------- |
| `actor_id` | `users.id` | restrict  | Keep the audit trail: a user with entries can't be deleted |

## Lifecycle

| Event                                                                           | Effect on rows                                                                                            | Rule                                  |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Sign-in, failed sign-in, sign-out (API-AUTH-01, API-AUTH-02)                    | Insert one row with the plain client (no change to join)                                                  | BR-ADMIN-14                           |
| Password changed (API-AUTH-04), any user action (API-ADMIN-04 to API-ADMIN-10)  | Insert one row in the same transaction as the change                                                      | BR-ADMIN-14, BR-ADMIN-16              |
| Project write by a non-member Admin                                             | `recordActivity` also inserts one row with `acted_as = ADMIN`, same transaction                           | BR-ADMIN-14, BR-ADMIN-16              |
| Guest visibility changed (API-PROJECT-13), project admin changed (API-ADMIN-12) | `recordActivity` with `audit: true` inserts one row per activity entry, whoever acts; `acted_as` as above | BR-GUEST-06, BR-ADMIN-04, BR-ADMIN-16 |
| Workspace settings changed (API-ADMIN-14)                                       | Insert one row `settings.updated`, target type `settings`, same transaction                               | BR-ADMIN-14, BR-ADMIN-16              |
| Retention clean-up (API start, then daily)                                      | Delete rows with `created_at` older than `workspace_settings.audit_retention_days`                        | BR-ADMIN-17                           |
| A change is refused (422, 409) or fails                                         | No row                                                                                                    | BR-ADMIN-16                           |
| A request that changes nothing (same role, already deactivated)                 | No row                                                                                                    |                                       |

The only writer is `recordAudit(db, …)` in `apps/api/src/modules/audit/record-audit.ts`.

## Retention

Kept for `workspace_settings.audit_retention_days` days (default 365, 30 to 3650, set in Admin console › Settings,
BR-ADMIN-17, Q-ADMIN-05). `purgeOldAuditEvents` in `apps/api/src/modules/admin/settings.service.ts` deletes older
rows when the API starts and then every 24 hours (`apps/api/src/server.ts`); a failure is logged and retried at the
next run. The seed empties the table on every run.

## Data quality rules

| Rule                                                               | Checked by                                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| No password or hash in any column                                  | `recordAudit` callers pass only names, emails, roles and statuses; code review           |
| Every admin change produces exactly one entry, none when refused   | Same transaction (BR-ADMIN-16); `record-activity.test.ts`; API tests count entries       |
| `acted_as` is `ADMIN` only for a non-member Admin's project write  | `auditAdminWrite` in `record-activity.ts`                                                |
| Entries are never changed                                          | No update in the code; delete only by the retention clean-up; no API route (AC-ADMIN-11) |
| An entry 364 days old stays, one 366 days old goes (retention 365) | Unit test of `purgeOldAuditEvents` (AC-ADMIN-19)                                         |

## Seed data

`seedAudit` in `apps/api/prisma/seed/seed.ts` deletes every row, then inserts six, with times relative to the seed
run so the "last 7 days" counts are stable (2 failed sign-ins, 1 action as Admin):

| When     | Actor     | `action`              | `target_name`                       | Other                                                                         |
| -------- | --------- | --------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| 30 h ago | Linh QA   | `auth.sign_in`        | `linh@qawm.test`                    | IP `10.0.0.12`                                                                |
| 26 h ago | Linh QA   | `auth.sign_in_failed` | `linh@qawm.test`                    | IP `10.0.0.12`                                                                |
| 25 h ago | (none)    | `auth.sign_in_failed` | `unknown@qawm.test`                 | IP `203.0.113.7`                                                              |
| 5 h ago  | Ada Admin | `auth.sign_in`        | `admin@qawm.test`                   | IP `10.0.0.2`                                                                 |
| 4 h ago  | Ada Admin | `user.deactivated`    | `inactive@qawm.test`                | `ACTIVE` → `DEACTIVATED`                                                      |
| 3 h ago  | Ada Admin | `project.updated`     | `Ada Admin changed the description` | Project `SECRET`, description `null` → `Admin-only tools`, `acted_as` `ADMIN` |

## Used by

[API-ADMIN-11](../../api/admin/get-audit.md) and [API-ADMIN-01](../../api/admin/get-overview.md) (read);
[API-AUTH-01](../../api/auth/post-login.md), [API-AUTH-02](../../api/auth/post-logout.md),
[API-AUTH-04](../../api/auth/post-change-password.md), API-ADMIN-04 to API-ADMIN-10, API-ADMIN-12, API-ADMIN-14, API-PROJECT-13, and every project
write by a non-member Admin (write); the retention clean-up (delete). Screen: [SCR-ADMIN-04](../../design/basic/screens/SCR-ADMIN-04-audit-log.md).

## Change log

| Date       | Change                                                                                                | Migration                                                            | Why                      |
| ---------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| 2026-10-09 | First version                                                                                         | `20261009081118_admin_console_and_audit`                             | Phase 3C                 |
| 2026-10-09 | Retention clean-up built; target type `settings`; audit for Guest visibility and Change project admin | `20261009123334_guest_access_and_settings` (no change to this table) | BR-ADMIN-17, BR-GUEST-06 |
