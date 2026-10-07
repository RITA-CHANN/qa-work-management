---
title: users
type: table
status: review
phase: 1
model: User
updated: 2026-10-07
---

# users

One row per person who can log in. Created by the seed only in Phase 2 (no sign-up yet, see
[requirements/auth](../../requirements/auth/README.md)).

## Columns

| Column          | Type         | Null | Default             | Key    | Description                                       | Rule       | Since phase |
| --------------- | ------------ | ---- | ------------------- | ------ | ------------------------------------------------- | ---------- | ----------- |
| `id`            | text         | no   | `cuid()`            | PK     | User id                                           |            | 1           |
| `email`         | text         | no   |                     | unique | Login name, stored lower-case                     | BR-AUTH-01 | 1           |
| `name`          | text         | no   |                     |        | Shown in the header                               |            | 1           |
| `global_role`   | `GlobalRole` | no   | `USER`              |        | `ADMIN` or `USER`                                 |            | 1           |
| `password_hash` | text         | yes  |                     |        | argon2id hash. `null` means the user can't log in | BR-AUTH-12 | 2           |
| `created_at`    | timestamp(3) | no   | `now()`             |        |                                                   |            | 1           |
| `updated_at`    | timestamp(3) | no   | Prisma `@updatedAt` |        |                                                   |            | 1           |

## Indexes and constraints

| Name              | Columns | Kind        | Why                           |
| ----------------- | ------- | ----------- | ----------------------------- |
| `users_pkey`      | `id`    | primary key |                               |
| `users_email_key` | `email` | unique      | Login looks users up by email |

## Relationships

| Column | Referenced by      | On delete | Meaning                                 |
| ------ | ------------------ | --------- | --------------------------------------- |
| `id`   | `sessions.user_id` | cascade   | Deleting a user ends all their sessions |

## Lifecycle

- Created and updated by the seed (upsert by `email`).
- The API never returns `password_hash` (BR-AUTH-12).
- Not deleted by the app in Phase 2. An admin screen comes later.

## Seed data

Every seed user gets the password `Password123!` from Phase 2 (dev and test only).

| Email               | Name       | Global role | Persona                             |
| ------------------- | ---------- | ----------- | ----------------------------------- |
| admin@qawm.test     | Ada Admin  | ADMIN       | Admin                               |
| lead@qawm.test      | Minh Lead  | USER        | QA Lead                             |
| linh@qawm.test      | Linh QA    | USER        | QA Engineer                         |
| dev@qawm.test       | Dev Nguyen | USER        | Developer                           |
| viewer@qawm.test    | Pat Viewer | USER        | Viewer                              |
| ratelimit@qawm.test | Rate Limit | USER        | Only for rate-limit tests (Phase 2) |

## Used by

[API-AUTH-01](../../api/auth/post-login.md), [API-AUTH-03](../../api/auth/get-me.md),
[DD-AUTH-01](../../design/detail/logic/DD-AUTH-01-session.md).

## Change log

| Date       | Change                                           | Migration  | Why     |
| ---------- | ------------------------------------------------ | ---------- | ------- |
| 2026-10-07 | Created                                          | `init`     | Phase 1 |
| 2026-10-07 | `password_hash` and `ratelimit@` seed user added | `add_auth` | Phase 2 |
