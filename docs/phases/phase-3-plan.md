# Phase 3A Plan: Projects

Status: **Code in review** (Phase 3A code PR; design docs PR #12 merged) · 2026-10-09
Business requirements: [requirements/project](../requirements/project/README.md) (what and why, with the
US / BR / AC / MSG IDs). This file says **how** we build it.

> **Role model v2 (Linh, 2026-10-09).** The 8 project roles of the first design are replaced by **access levels**
> (System admin, Project admin, Member) plus an optional **job title** (QAE, QAL, QAA, PM, PO, BA, DEV, TL, DES, STK,
> OTH) that has no effect on permissions, Backlog style. Every write is Project admin only, and **only a System admin
> creates projects**, picking the first Project admin. Migration `20261009080000_project_access_job_title` converts
> existing rows. Why and what else was considered: [ADR-0011](../decisions/ADR-0011-project-access-levels-and-job-titles.md).
> A read-only Guest level comes in Phase 3C. The sections below are updated to the new model.

## 1. Current codebase

- `main` is at the merge of PR #11 (documentation standards). Your Phase 2 tests (PR #8, #9) are green.
- Database has `users` (6 seed users, global role ADMIN/USER) and `sessions`. **No project tables yet.**
- `/projects` is a placeholder page. The web app has only one shadcn component (`button`).
- Every protected API router starts with `requireAuth`; messages live in one catalog (`msg('MSG-…')`).

## 2. Process (same as Phase 2)

1. **Done:** you answered Q-PROJECT-01 to Q-PROJECT-05 on the business requirements draft.
2. **Now, design docs PR:** `docs/requirements/project/`, screens, flows, API docs, tables, detail design, ADRs.
   You review it on GitHub before any code.
3. **Code PR:** I build it on a branch; you push your Playwright tests to that branch before it merges.

## 3. What we are building

**Database** (one migration)

| Table             | Columns (main)                                                                                             | Notes                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects`        | id, key (unique), name, description, archived_at, version, created_by_id, timestamps                       | `version` for optimistic locking (BR-PROJECT-07)                                                                                            |
| `project_members` | project_id, user_id, access, job_title, created_at                                                         | unique(project_id, user_id); access enum PROJECT_ADMIN, MEMBER; job_title enum QAE, QAL, QAA, PM, PO, BA, DEV, TL, DES, STK, OTH (nullable) |
| `releases`        | id, project_id, name, name_normalized, status, start_date, target_date, version, timestamps                | unique(project_id, name_normalized); status enum PLANNED/ACTIVE/RELEASED                                                                    |
| `milestones`      | id, project_id, release_id, name, name_normalized, goal, start_date, end_date, status, version, timestamps | unique(project_id, name_normalized); status PLANNED/ACTIVE/COMPLETED; overlap check in the service inside the transaction                   |
| `activity_logs`   | id, project_id, actor_id, action, entity_type, entity_id, summary, changes jsonb, created_at               | append-only, no update/delete code path                                                                                                     |

Projects are deleted with their members and activity (cascade). Users are never deleted in this phase.

**API** (projects are addressed by **key**, so URLs are readable: `/api/projects/SHOP`)

```
GET    /api/projects?search=&archived=           list (mine, or all for admin)
POST   /api/projects                             System admin only: create with { key, name, description?, firstAdminId }
GET    /api/projects/:key                        detail + myAccess
PATCH  /api/projects/:key                        name, description, version  → 409 on stale version
POST   /api/projects/:key/archive | /restore
DELETE /api/projects/:key                        only archived + no releases
GET    /api/projects/:key/members
POST   /api/projects/:key/members                { userId, access, jobTitle? }
PATCH  /api/projects/:key/members/:userId        { access?, jobTitle? }
DELETE /api/projects/:key/members/:userId        also used to leave (own userId)
GET    /api/projects/:key/releases
POST   /api/projects/:key/releases
PATCH  /api/projects/:key/releases/:id           fields, status, version
DELETE /api/projects/:key/releases/:id           only PLANNED, no milestones
GET    /api/projects/:key/milestones?releaseId=
POST   /api/projects/:key/milestones
PATCH  /api/projects/:key/milestones/:id         fields, status, version
DELETE /api/projects/:key/milestones/:id         only PLANNED
GET    /api/projects/:key/activity?cursor=       20 per page, newest first
GET    /api/users                                for the member picker (id, name, email)
```

Phase 0 sketched flat routes (`/api/releases?projectId=`). Nesting under the project is clearer here because every
call needs the project's permission check anyway. Status codes: 400 validation, 401, **403 wrong access level**,
**404 not a member or unknown key**, 409 duplicate / stale version / backwards status, 422 business rule
(archived, last Project admin, own access level, second active release or milestone, open milestones, overlap, outside release dates,
delete not allowed).

**Error format and contract** (from the doc-standards proposal you approved, steps B and C)

- Errors move to **RFC 9457** Problem Details (`Content-Type: application/problem+json`, fields `type`, `title`,
  `status`, `detail`, `instance`, plus our extensions `code` (e.g. `PROJECT_ARCHIVED`), `messageId` (e.g.
  `MSG-PROJECT-08`), `errors` (field list for 400) and `requestId`). This applies to the auth endpoints too, so all
  errors look the same.
- `docs/api/openapi.yaml` (OpenAPI 3.1) is **generated from the Zod schemas** in `packages/shared`; `docs:check`
  fails if it and the Markdown endpoint docs disagree. You can import it into Postman and use it for contract tests.
- Each endpoint doc gets the new **Security** (OWASP API Top 10: object-level authorization = our 404/403 rule),
  **Idempotency & side effects** (which activity entry it writes) and **Status codes** (RFC 9110) sections.
- If the Traceability thread ships B or C first, I build on that instead of repeating it.

**Permissions**: one static map `access level → actions` in `packages/shared/src/permissions.ts`, checked by one
helper `assertCan(access, 'project:edit')`. The matrix in the requirements is generated from the same map, so
docs and code can't drift (`docs:check` compares them).

**Web**

- `/projects`: table (Key, Name, My access, Members, Active release, Updated), search box, "Show archived" switch,
  "New project" dialog with a "First project admin" picker (System admins only), empty states.
- `/projects/:key`: header (name, key, access badge ("Project admin", "Member" or "System admin"), Archived banner, **current milestone with days left**), tabs
  **Overview · Members · Releases & milestones · Activity**. Milestones are listed under their release.
  Buttons appear only if your access level allows them (the API still checks, so hiding is not the security).
- Dialogs: edit project, add member (user, access, job title), confirm remove, archive, delete (type the key), release form,
  milestone form (release picker, date fields).
- New shadcn components: input, textarea, label, dialog, alert-dialog, table, select, badge, tabs, switch, toast.
- Side nav gets a "Projects" link; the dashboard stays a placeholder until Phase 7.

## 4. Architecture decisions

| Decision                                                                                                   | Reason                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Non-member gets **404**, wrong access level gets **403** (Phase 0)                                         | Doesn't reveal which projects exist; still tells a member why they can't act                                             |
| Optimistic locking with `version` on project and release edits                                             | Two-tab editing is a real bug class and a good multi-page Playwright exercise                                            |
| Activity row written **in the same transaction** as the change, through one `recordActivity(tx, …)` helper | The log can't drift from the data (BR-PROJECT-22)                                                                        |
| Activity stores a ready-to-read `summary` + `changes` jsonb (old/new)                                      | The page doesn't need to rebuild sentences; later phases reuse the same table                                            |
| Cursor pagination for activity (`?cursor=<id>`)                                                            | Stable while new entries arrive; good `Load more` test                                                                   |
| "Not your own access level" and "at least one Project admin" live in the member service next to the matrix | They depend on the _target_ member, which a plain access → action map can't express                                      |
| Milestone overlap and "inside release dates" checked in the service, in the same transaction as the write  | Postgres exclusion constraints would work but are harder to read and to explain; one function with unit tests is clearer |
| Sprint max length `MILESTONE_MAX_DAYS=28` in `.env`                                                        | BR-PROJECT-28 says it's a setting; tests can lower it                                                                    |
| Release name compared through a normalized column (trim + lower case)                                      | Uniqueness enforced by the database, not only by code                                                                    |
| Shared Zod schemas in `packages/shared/src/projects.ts`                                                    | Web form, API and your tests validate the same rules                                                                     |
| Test-support reset stays as in Phase 2 (`migrate deploy` + idempotent seed)                                | Tests that change data create their own project with a unique key, so the seed stays clean                               |

## 5. Files that change

```
apps/api/prisma/schema.prisma + migrations/<ts>_add_projects/
apps/api/prisma/seed/data/{users,projects}.ts   4 new users (owner, pm, teamlead, stakeholder), 4 seed projects (requirements §8)
apps/api/src/modules/projects/                   routes, service, permissions, schemas, *.test.ts
apps/api/src/modules/releases/                   routes, service, workflow (status table), *.test.ts
apps/api/src/modules/milestones/                 routes, service, dates.ts (length, inside release, overlap), *.test.ts
apps/api/src/modules/activity/                   record-activity.ts, routes
apps/api/src/modules/users/                      GET /api/users
packages/shared/src/{projects,releases,milestones,activity}.ts, messages.ts (+ MSG-PROJECT-01..31)
apps/web/src/features/projects/                  pages, dialogs, query hooks
apps/web/src/components/ui/                      new shadcn components
apps/web/src/app/router.tsx, components/layout/SideNav.tsx
docs/requirements/project/                       README, stories, rules, acceptance, messages
docs/design/basic/screens/SCR-PROJECT-01..04, flows/FLW-PROJECT-01..03
docs/design/detail/logic/DD-PROJECT-01 permissions, DD-PROJECT-02 activity log, DD-PROJECT-03 optimistic locking
docs/api/projects/…, releases/…, milestones/…   one file per endpoint (+ index rows)
docs/database/tables/{projects,project_members,releases,milestones,activity_logs}.md
docs/decisions/ADR-0008-project-404-vs-403.md, ADR-0009-optimistic-locking.md
docs/traceability.md, ARCHITECTURE.md, TESTING.md, PLAYWRIGHT.md, README.md
```

## 6. Risks

| Risk                                                                         | Mitigation                                                                                                                                                                             |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 3 too big for one PR and one test round                                | Split into 3A (this) and 3B Requirements + Comments (Q-PROJECT-01)                                                                                                                     |
| Tests that change shared seed projects break each other when run in parallel | Rule in TESTING.md: tests only **read** seed projects; anything that writes creates its own project via the API in `beforeEach` (good exercise in API setup + UI check)                |
| Your login tests open `/projects` and check the "Projects" heading           | The real page keeps that heading and the side-nav link name, so they stay green                                                                                                        |
| Permission bugs hide in access levels × many actions                         | Unit test over the whole matrix in the API; `docs:check` compares the README matrix with the map; your Playwright tests cover each access level                                        |
| Phase 2 storageState logs in one user only                                   | Exercise: one storageState **per access level** plus a System admin: Ada Admin, Oanh Owner (Project admin in `SHOP`), Linh QA (Member in `SHOP`)                                       |
| Date tests break as days pass ("3 days left")                                | Seed dates are relative to today; tests that check days left create their own milestone with dates from `new Date()`                                                                   |
| Your Phase 2 API tests read the old error shape (`body.error.code`)          | They go red when errors switch to RFC 9457. Expected; fixing them is part of your exercise (read `code` / `status` from the problem body, check the `application/problem+json` header) |
| Phase grew (milestones, more people per project)                             | Still one code PR, but I build it in commits per area (projects → members → releases → milestones → activity) so the review is readable                                                |

## 7. How I'll verify before handing over

- Migration on a clean DB; seed runs twice without errors.
- Unit tests (permission matrix, release workflow, key validation), typecheck, lint, format, `docs:check`.
- By hand with curl and a browser: every row of the permission matrix for one action each; 404 for `SECRET` as Linh;
  409 on two-tab edit; last-Project-admin rule; archive → read-only → restore; delete rules; activity entries.
- Your existing 20 tests stay green, except the auth API tests that assert the old error shape (expected, see risks).

## 8. QA view of this phase

| Dimension             | Cases                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Happy path            | Create project → add member → create release → activate → see activity                                                                                                                                                                            |
| Validation / boundary | Key 1/2/10/11 chars, name 2/3/100/101 chars, target date = start date, sprint 1/28/29 days, sprint 1 day before/after release                                                                                                                     |
| Uniqueness            | Duplicate key (incl. archived and hidden), duplicate release name with spaces/case, same release name in another project                                                                                                                          |
| Permissions           | Matrix: System admin, Project admin, Member, non-member; job titles give no rights; only a System admin creates projects; UI hides buttons **and** API refuses (403/404)                                                                          |
| Business rules        | Last Project admin, no change of one's own access level (stepping down allowed), one active release / milestone, forward-only status, release needs completed milestones, no overlapping sprints, archived = read-only, delete only after archive |
| Concurrency           | Two tabs edit the same project → 409                                                                                                                                                                                                              |
| Data integrity        | Refused change leaves no activity entry                                                                                                                                                                                                           |
| Pagination            | 25 activity entries → 20 + Load more                                                                                                                                                                                                              |

## 9. Your Phase 3A exercise (preview)

Default I've picked: same as Phase 2, you push your tests onto the code PR branch before it merges.

1. **One login per access level + a System admin:** extend `auth.setup.ts` to save one storage state each for Ada
   Admin (System admin), Oanh Owner (Project admin in `SHOP`) and Linh QA (Member in `SHOP`); use
   `test.use({ storageState })` per describe. Concepts: multiple storage states, parameterized tests over access
   levels.
2. **Forms and validation:** create-project dialog, boundary values, duplicate key. Concepts: `getByRole('dialog')`,
   `getByLabel`, `toHaveText` on field errors, data-driven tests with a `for` loop over cases.
3. **Tables:** find a row by its text and check a cell (`getByRole('row', { name: /SHOP/ })`), search filtering,
   `toHaveCount`.
4. **API CRUD + permissions:** create → read → update → delete with the `request` fixture; 403 vs 404 per access level;
   409 on stale `version`. Concept: `request.newContext({ storageState })` for each access level.
5. **Contract:** validate responses against `openapi.yaml`, and update your Phase 2 API tests to the RFC 9457 error shape.
6. **Dates:** milestone boundaries (1, 28, 29 days; overlap by one day) built from `new Date()`, not hard-coded dates.
7. **Two tabs (stretch):** open the same project in two pages and prove the 409 conflict message.

As always: I explain each concept first, you try, I review on the PR. No full solutions from me.
