---
title: sessions
type: table
status: review
phase: 2
model: Session
updated: 2026-10-07
---

# sessions

One row per logged-in browser. Login creates a row, logout deletes it. How the API uses it:
[DD-AUTH-01](../../design/detail/logic/DD-AUTH-01-session.md) and [DD-AUTH-02](../../design/detail/logic/DD-AUTH-02-api-guards.md).
Why sessions live in the database: [ADR-0006](../../decisions/ADR-0006-server-side-sessions.md).

## Columns

| Column       | Type         | Null | Default | Key        | Description                                                    | Rule       | Since phase |
| ------------ | ------------ | ---- | ------- | ---------- | -------------------------------------------------------------- | ---------- | ----------- |
| `id_hash`    | text         | no   |         | PK         | SHA-256 (hex) of the token in the `qawm_sid` cookie            | BR-AUTH-15 | 2           |
| `user_id`    | text         | no   |         | FK `users` | Who is logged in                                               |            | 2           |
| `expires_at` | timestamp(3) | no   |         |            | Login time + `SESSION_TTL_HOURS` (7 days). Not extended by use | BR-AUTH-05 | 2           |
| `created_at` | timestamp(3) | no   | `now()` |            | Login time                                                     |            | 2           |

The token itself is never stored, so a copy of this table can't be used to log in.

## Indexes and constraints

| Name                   | Columns   | Kind        | Why                            |
| ---------------------- | --------- | ----------- | ------------------------------ |
| `sessions_pkey`        | `id_hash` | primary key | Every request looks up by this |
| `sessions_user_id_idx` | `user_id` | index       | Foreign key; cascade delete    |

## Relationships

| Column    | References | On delete | Meaning                                       |
| --------- | ---------- | --------- | --------------------------------------------- |
| `user_id` | `users.id` | cascade   | A user can have several sessions (BR-AUTH-07) |

## Lifecycle

| Event                       | Effect on rows                                                             | Rule                   |
| --------------------------- | -------------------------------------------------------------------------- | ---------------------- |
| Login                       | Insert one row; delete the row of the cookie the request came with, if any | BR-AUTH-06             |
| Logout                      | Delete this browser's row only                                             | BR-AUTH-06, BR-AUTH-07 |
| Request with an expired row | Delete that row, answer 401                                                | BR-AUTH-05             |
| User deleted                | All their rows deleted (cascade)                                           |                        |

## Seed data

None. Tests create sessions by logging in.

## Used by

[API-AUTH-01](../../api/auth/post-login.md), [API-AUTH-02](../../api/auth/post-logout.md),
[API-AUTH-03](../../api/auth/get-me.md), every protected route through `requireAuth`.

## Change log

| Date       | Change  | Migration  | Why     |
| ---------- | ------- | ---------- | ------- |
| 2026-10-07 | Created | `add_auth` | Phase 2 |
