# API Reference

One file per endpoint, grouped by resource:

```
docs/api/
  README.md              ← you are here: conventions, error codes, endpoint index
  _template.md           ← copy this when documenting a new endpoint
  <resource>/<method>-<name>.md
```

Each endpoint file starts with front matter: an `id` (`API-<RESOURCE>-NN`, for example `API-HEALTH-01`) and the
requirement and acceptance IDs it serves under `traces`. See [../README.md](../README.md) for how IDs and traces work.

Base URL in development: `http://localhost:3000/api` (or via the web app at `http://localhost:5173/api`).
In Playwright API tests: `http://localhost:3100/api` (the `api` project's `baseURL`).

## Endpoint index

| Method | Path                                     | Auth                                                                         | Doc                                                                                  |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/health`                            | None                                                                         | [health/get-health.md](health/get-health.md)                                         |
| POST   | `/api/auth/login`                        | None                                                                         | [auth/post-login.md](auth/post-login.md)                                             |
| POST   | `/api/auth/logout`                       | None                                                                         | [auth/post-logout.md](auth/post-logout.md)                                           |
| GET    | `/api/auth/me`                           | Logged in                                                                    | [auth/get-me.md](auth/get-me.md)                                                     |
| POST   | `/api/auth/change-password`              | Logged in                                                                    | [auth/post-change-password.md](auth/post-change-password.md)                         |
| GET    | `/api/projects`                          | Logged in                                                                    | [projects/get-projects.md](projects/get-projects.md)                                 |
| POST   | `/api/projects`                          | System admin only                                                            | [projects/post-project.md](projects/post-project.md)                                 |
| GET    | `/api/projects/:key`                     | Any member, or System admin                                                  | [projects/get-project.md](projects/get-project.md)                                   |
| PATCH  | `/api/projects/:key`                     | Project admin (or System admin)                                              | [projects/patch-project.md](projects/patch-project.md)                               |
| POST   | `/api/projects/:key/archive`             | Project admin (or System admin)                                              | [projects/post-project-archive.md](projects/post-project-archive.md)                 |
| POST   | `/api/projects/:key/restore`             | Project admin (or System admin)                                              | [projects/post-project-restore.md](projects/post-project-restore.md)                 |
| DELETE | `/api/projects/:key`                     | Project admin (or System admin)                                              | [projects/delete-project.md](projects/delete-project.md)                             |
| GET    | `/api/projects/:key/members`             | Any member, or System admin; a Guest only while the area is on (BR-GUEST-03) | [projects/get-project-members.md](projects/get-project-members.md)                   |
| POST   | `/api/projects/:key/members`             | Project admin (or System admin)                                              | [projects/post-project-member.md](projects/post-project-member.md)                   |
| PATCH  | `/api/projects/:key/members/:userId`     | Project admin (or System admin); own access level rule in BR-PROJECT-24      | [projects/patch-project-member.md](projects/patch-project-member.md)                 |
| DELETE | `/api/projects/:key/members/:userId`     | Project admin (or System admin) to remove others; any member to leave        | [projects/delete-project-member.md](projects/delete-project-member.md)               |
| GET    | `/api/projects/:key/activity`            | Any member, or System admin; a Guest only while the area is on (BR-GUEST-03) | [projects/get-project-activity.md](projects/get-project-activity.md)                 |
| PUT    | `/api/projects/:key/guest-visibility`    | Project admin (or System admin)                                              | [projects/put-project-guest-visibility.md](projects/put-project-guest-visibility.md) |
| GET    | `/api/projects/:key/releases`            | Any member, or System admin; a Guest only while the area is on (BR-GUEST-03) | [releases/get-releases.md](releases/get-releases.md)                                 |
| POST   | `/api/projects/:key/releases`            | Project admin (or System admin)                                              | [releases/post-release.md](releases/post-release.md)                                 |
| PATCH  | `/api/projects/:key/releases/:id`        | Project admin (or System admin)                                              | [releases/patch-release.md](releases/patch-release.md)                               |
| DELETE | `/api/projects/:key/releases/:id`        | Project admin (or System admin)                                              | [releases/delete-release.md](releases/delete-release.md)                             |
| GET    | `/api/projects/:key/milestones`          | Any member, or System admin; a Guest only while the area is on (BR-GUEST-03) | [milestones/get-milestones.md](milestones/get-milestones.md)                         |
| POST   | `/api/projects/:key/milestones`          | Project admin (or System admin)                                              | [milestones/post-milestone.md](milestones/post-milestone.md)                         |
| PATCH  | `/api/projects/:key/milestones/:id`      | Project admin (or System admin)                                              | [milestones/patch-milestone.md](milestones/patch-milestone.md)                       |
| DELETE | `/api/projects/:key/milestones/:id`      | Project admin (or System admin)                                              | [milestones/delete-milestone.md](milestones/delete-milestone.md)                     |
| GET    | `/api/users`                             | Logged in                                                                    | [users/get-users.md](users/get-users.md)                                             |
| GET    | `/api/me/current-project`                | Logged in                                                                    | [me/get-current-project.md](me/get-current-project.md)                               |
| PUT    | `/api/me/current-project`                | Logged in; project visible to the caller                                     | [me/put-current-project.md](me/put-current-project.md)                               |
| GET    | `/api/search`                            | Logged in                                                                    | [search/get-search.md](search/get-search.md)                                         |
| GET    | `/api/admin/overview`                    | System admin (404 for others)                                                | [admin/get-overview.md](admin/get-overview.md)                                       |
| GET    | `/api/admin/projects`                    | System admin (404 for others)                                                | [admin/get-projects.md](admin/get-projects.md)                                       |
| POST   | `/api/admin/projects/:key/project-admin` | System admin (404 for others)                                                | [admin/post-project-admin.md](admin/post-project-admin.md)                           |
| GET    | `/api/admin/users`                       | System admin (404 for others)                                                | [admin/get-users.md](admin/get-users.md)                                             |
| POST   | `/api/admin/users`                       | System admin (404 for others)                                                | [admin/post-user.md](admin/post-user.md)                                             |
| GET    | `/api/admin/users/:id`                   | System admin (404 for others)                                                | [admin/get-user.md](admin/get-user.md)                                               |
| PATCH  | `/api/admin/users/:id`                   | System admin (404 for others); not on oneself                                | [admin/patch-user.md](admin/patch-user.md)                                           |
| POST   | `/api/admin/users/:id/deactivate`        | System admin (404 for others); not on oneself                                | [admin/post-user-deactivate.md](admin/post-user-deactivate.md)                       |
| POST   | `/api/admin/users/:id/reactivate`        | System admin (404 for others); not on oneself                                | [admin/post-user-reactivate.md](admin/post-user-reactivate.md)                       |
| POST   | `/api/admin/users/:id/reset-password`    | System admin (404 for others)                                                | [admin/post-user-reset-password.md](admin/post-user-reset-password.md)               |
| POST   | `/api/admin/users/:id/sign-out`          | System admin (404 for others)                                                | [admin/post-user-sign-out.md](admin/post-user-sign-out.md)                           |
| GET    | `/api/admin/audit`                       | System admin (404 for others)                                                | [admin/get-audit.md](admin/get-audit.md)                                             |
| GET    | `/api/admin/settings`                    | System admin (404 for others)                                                | [admin/get-settings.md](admin/get-settings.md)                                       |
| PUT    | `/api/admin/settings`                    | System admin (404 for others)                                                | [admin/put-settings.md](admin/put-settings.md)                                       |

Guest access (BR-GUEST-01 to BR-GUEST-06): a Guest gets 403 on every write and 404 on the reads of an area switched
off for Guests.

Planned endpoints: [phases/phase-0-architecture.md §11](../phases/phase-0-architecture.md#11-api-architecture).
Each phase adds its endpoint files and rows here. Phase 3 rows are designed; they are built in the Phase 3 code PR.
The Phase 3C rows (`/auth/change-password`, `/me`, `/search`, `/admin`) are built in the Phase 3C code PR.

## Conventions (apply to every endpoint)

| Topic             | Rule                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format            | JSON only                                                                                                                                                                                                                                                                                                                                                        |
| Success           | `{ "data": ... }`; lists: `{ "data": [...], "meta": { "page", "pageSize", "total" } }`                                                                                                                                                                                                                                                                           |
| Errors            | RFC 9457 problem details (`application/problem+json`), see [Error format](#error-format)                                                                                                                                                                                                                                                                         |
| Request id        | Every response has an `X-Request-Id` header. Send your own (letters, digits, `-`, `_`, max 64) to tag a request.                                                                                                                                                                                                                                                 |
| Dates             | ISO 8601 UTC strings                                                                                                                                                                                                                                                                                                                                             |
| One-time password | While the session user's `mustChangePassword` is `true` (an Admin created the account or reset its password, BR-ADMIN-07, BR-ADMIN-12), every endpoint that needs a session except `GET /api/auth/me` and `POST /api/auth/change-password` answers **403** `PASSWORD_CHANGE_REQUIRED` (MSG-ADMIN-07). Public endpoints (health, login, logout) are not affected. |
| Admin console     | Every `/api/admin/*` endpoint answers **404** to a logged-in user who is not a System admin, with the same body as an [unknown route](#unknown-routes) (BR-ADMIN-01). Not logged in is still 401.                                                                                                                                                                |

Types live in `packages/shared/src/api.ts`.

## Error format

Every error is an RFC 9457 problem details body with `Content-Type: application/problem+json`
([ADR-0010](../decisions/ADR-0010-problem-details-errors.md)). Since the Phase 3 code PR this includes the auth
endpoints, which used `{ "error": { "code", "message", "details" } }` before.

```json
{
  "type": "https://qawm.test/problems/validation-error",
  "title": "Validation error",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/projects",
  "code": "VALIDATION_ERROR",
  "messageId": "MSG-COMMON-04",
  "errors": [{ "pointer": "/key", "detail": "Key is required", "messageId": "MSG-PROJECT-01" }],
  "requestId": "…"
}
```

`type` is `https://qawm.test/problems/<code in kebab case>`. `detail` is the catalog text of `messageId`. `errors`
is only present for 400; a field the endpoint doesn't accept gets its own entry with `detail` "This field is not
allowed". The machine-readable contract is [openapi.yaml](openapi.yaml), generated from the Zod schemas and these
docs by `npm run docs:build`; `npm run docs:check` fails when it is out of date.

### Phase 3 codes

| HTTP | `code`                      | When                                                                                                                 |
| ---- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 409  | `KEY_TAKEN`                 | Project key already used (BR-PROJECT-03)                                                                             |
| 409  | `ALREADY_MEMBER`            | The user is already a member (BR-PROJECT-10)                                                                         |
| 409  | `VERSION_CONFLICT`          | Stale `version` on a `PATCH` (BR-PROJECT-07)                                                                         |
| 409  | `INVALID_TRANSITION`        | Status moved backwards or skipped (BR-PROJECT-16, BR-PROJECT-31)                                                     |
| 409  | `RELEASE_NAME_TAKEN`        | Release name used in the project (BR-PROJECT-14)                                                                     |
| 409  | `MILESTONE_NAME_TAKEN`      | Milestone name used in the project (BR-PROJECT-27)                                                                   |
| 422  | `PROJECT_ARCHIVED`          | Change to an archived project (BR-PROJECT-08)                                                                        |
| 422  | `DELETE_NOT_ALLOWED`        | Project, release or milestone can't be deleted in its state                                                          |
| 422  | `LAST_PROJECT_ADMIN`        | Change would leave no Project admin (BR-PROJECT-12)                                                                  |
| 422  | `OWN_ACCESS`                | Caller changes their own access level (BR-PROJECT-24)                                                                |
| 422  | `ACTIVE_RELEASE_EXISTS`     | Another release is active (BR-PROJECT-17)                                                                            |
| 422  | `OPEN_MILESTONES`           | Release has milestones not completed (BR-PROJECT-25)                                                                 |
| 422  | `CANNOT_ACTIVATE_MILESTONE` | Release not active or another milestone active (BR-PROJECT-32)                                                       |
| 422  | `MILESTONE_OUTSIDE_RELEASE` | Milestone dates outside the release (BR-PROJECT-29)                                                                  |
| 422  | `MILESTONE_OVERLAP`         | Milestones of one release overlap (BR-PROJECT-30)                                                                    |
| 422  | `RELEASE_CLOSED`            | Milestone added to a released release (MSG-PROJECT-32), or a released release edited (MSG-PROJECT-45, BR-PROJECT-45) |
| 422  | `MILESTONE_CLOSED`          | Completed milestone edited (MSG-PROJECT-46, BR-PROJECT-45)                                                           |

### Phase 3C codes

| HTTP | `code`                     | When                                                                                                    |
| ---- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| 409  | `EMAIL_TAKEN`              | An account with this email already exists (MSG-ADMIN-01, BR-ADMIN-07)                                   |
| 422  | `LAST_ADMIN`               | The change would leave no active Admin (MSG-ADMIN-03, BR-ADMIN-09)                                      |
| 422  | `OWN_ACCOUNT`              | An Admin changes their own role or status (MSG-ADMIN-04, BR-ADMIN-09)                                   |
| 422  | `LAST_PROJECT_ADMIN`       | Deactivating the only Project admin of an active project (MSG-ADMIN-05, BR-ADMIN-11)                    |
| 403  | `ACCOUNT_DEACTIVATED`      | Sign-in with the right password to a deactivated account (MSG-ADMIN-06, BR-ADMIN-10)                    |
| 403  | `PASSWORD_CHANGE_REQUIRED` | Any call but `/auth/me` and `/auth/change-password` before replacing a one-time password (MSG-ADMIN-07) |

## Error codes

| HTTP | `code`                   | When                                                                                                                               |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 400  | `VALIDATION_ERROR`       | Invalid body/params/query, or body is not valid JSON. `errors` lists each field.                                                   |
| 401  | `UNAUTHENTICATED`        | Not logged in (Phase 2)                                                                                                            |
| 403  | `FORBIDDEN`              | Logged in but not allowed                                                                                                          |
| 404  | `NOT_FOUND`              | Unknown route or resource (also used for other users' private data)                                                                |
| 409  | `CONFLICT`               | Version conflict or invalid state transition                                                                                       |
| 415  | `UNSUPPORTED_MEDIA_TYPE` | A POST, PUT or PATCH without `Content-Type: application/json`, or a DELETE whose body isn't JSON. A DELETE without a body is fine. |
| 422  | `UNPROCESSABLE`          | Valid input that breaks a business rule                                                                                            |
| 429  | `RATE_LIMITED`           | Too many requests                                                                                                                  |
| 500  | `INTERNAL_ERROR`         | Bug on our side. Quote the `requestId`.                                                                                            |
| 503  | `SERVICE_UNAVAILABLE`    | A dependency (e.g. AI provider) is unavailable                                                                                     |

### Unknown routes

Any path under `/api` that doesn't exist returns **404**:

```json
{
  "type": "https://qawm.test/problems/not-found",
  "title": "Not found",
  "status": 404,
  "detail": "Route GET /api/does-not-exist does not exist",
  "instance": "/api/does-not-exist",
  "code": "NOT_FOUND",
  "messageId": "MSG-COMMON-08",
  "requestId": "…"
}
```

### Invalid JSON body

A request whose body is not valid JSON returns **400** `VALIDATION_ERROR` with the message
`"Request body is not valid JSON"` (MSG-COMMON-03) and an empty `errors` list, before any endpoint logic runs.
