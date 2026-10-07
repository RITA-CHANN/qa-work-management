---
title: Database
type: database
status: review
updated: 2026-10-07
---

# Database

PostgreSQL 16 in Docker, accessed through Prisma 7 (`apps/api/prisma/schema.prisma`). This page is the overview:
all tables, how they relate, and the shared conventions. Each table has its own file in [tables/](tables/).
The full entity plan for later phases is in
[phases/phase-0-architecture.md §10](../phases/phase-0-architecture.md#10-database-erd-proposal).

## Tables

| Table                          | Holds                            | Prisma model | Since phase | Status                       |
| ------------------------------ | -------------------------------- | ------------ | ----------- | ---------------------------- |
| [users](tables/users.md)       | People who can log in            | `User`       | 1           | built; Phase 2 adds a column |
| [sessions](tables/sessions.md) | Login sessions (one per browser) | `Session`    | 2           | planned                      |

## Relationships

```mermaid
erDiagram
    users ||--o{ sessions : "has"
    users {
        text id PK
        text email UK
        text name
        GlobalRole global_role
        text password_hash "Phase 2"
        timestamp created_at
        timestamp updated_at
    }
    sessions {
        text id_hash PK
        text user_id FK
        timestamp expires_at
        timestamp created_at
    }
```

| From               | To         | Type        | On delete | Meaning                                     |
| ------------------ | ---------- | ----------- | --------- | ------------------------------------------- |
| `sessions.user_id` | `users.id` | many to one | cascade   | A user can be logged in on several browsers |

## Enums

| Enum         | Values          | Used by             |
| ------------ | --------------- | ------------------- |
| `GlobalRole` | `ADMIN`, `USER` | `users.global_role` |

## Conventions

- Prisma models are `PascalCase`, tables and columns are `snake_case` (`@@map`, `@map`).
- Primary keys are `cuid` strings; human-readable keys (`BUG-7`) arrive with each entity. Exception: `sessions`
  uses the token hash as its key.
- Timestamps are `timestamp(3)` in UTC.
- Foreign keys are indexed.
- One file per table in [tables/](tables/), copied from [../\_templates/table.md](../_templates/table.md). A table
  file changes in the same PR as its migration.

## Databases

| Name        | Used by                           | Reset how                                                   |
| ----------- | --------------------------------- | ----------------------------------------------------------- |
| `qawm_dev`  | `npm run dev`, Prisma Studio      | `npm run db:reset` (destructive, asks nothing, your call)   |
| `qawm_test` | Playwright runs (`NODE_ENV=test`) | Migrated and seeded automatically before each `npm run e2e` |

Both live in the same Docker container (`qawm-postgres`). `docker/postgres/init/01-create-test-db.sql`
creates `qawm_test` the first time the volume is created.

## Migrations

| Migration            | Phase | Changes                                      |
| -------------------- | ----- | -------------------------------------------- |
| `init`               | 1     | Create `users` and `GlobalRole`              |
| `add_auth` (planned) | 2     | Add `users.password_hash`, create `sessions` |

```bash
# 1. Edit apps/api/prisma/schema.prisma
# 2. Create + apply a migration to qawm_dev (give it a meaningful name)
npm run db:migrate -- --name add_user_password
# 3. Commit the generated folder in apps/api/prisma/migrations/
# 4. Update the table files in docs/database/tables/ and the tables above
```

- Never edit a migration that has been committed and applied; create a new one.
- `npm run db:migrate` also regenerates the Prisma client (`apps/api/src/generated`, git-ignored).
- Test DB: `npm run db:test:prepare -w @qawm/api` applies migrations and seeds (Playwright runs this for you).

## Seed data

`apps/api/prisma/seed/` is deterministic and idempotent (upserts by unique keys), so it is safe to run repeatedly.
The rows for each table are listed in its table file, for example [users](tables/users.md#seed-data).

## Change log

| Date       | Change                                                                        | Why                                           |
| ---------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| 2026-10-07 | Split `DATABASE.md` into this overview and one file per table; Phase 2 tables | One file per table, easier to find and review |
