# API

Base URL in development: `http://localhost:3000/api` (or via the web app at `http://localhost:5173/api`).
In Playwright API tests: `http://localhost:3100/api` (the `api` project's `baseURL`).

## Conventions

| Topic      | Rule                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Format     | JSON only                                                                                                        |
| Success    | `{ "data": ... }`; lists: `{ "data": [...], "meta": { "page", "pageSize", "total" } }`                           |
| Errors     | `{ "error": { "code", "message", "details"?, "requestId" } }`                                                    |
| Request id | Every response has an `X-Request-Id` header. Send your own (letters, digits, `-`, `_`, max 64) to tag a request. |
| Dates      | ISO 8601 UTC strings                                                                                             |

Types live in `packages/shared/src/api.ts`.

### Error codes

| HTTP | `code`                | When                                                                              |
| ---- | --------------------- | --------------------------------------------------------------------------------- |
| 400  | `VALIDATION_ERROR`    | Invalid body/params/query, or body is not valid JSON. `details` lists each field. |
| 401  | `UNAUTHENTICATED`     | Not logged in (Phase 2)                                                           |
| 403  | `FORBIDDEN`           | Logged in but not allowed                                                         |
| 404  | `NOT_FOUND`           | Unknown route or resource (also used for other users' private data)               |
| 409  | `CONFLICT`            | Version conflict or invalid state transition                                      |
| 422  | `UNPROCESSABLE`       | Valid input that breaks a business rule                                           |
| 429  | `RATE_LIMITED`        | Too many requests                                                                 |
| 500  | `INTERNAL_ERROR`      | Bug on our side. Quote the `requestId`.                                           |
| 503  | `SERVICE_UNAVAILABLE` | A dependency (e.g. AI provider) is unavailable                                    |

## Endpoints

### `GET /api/health`

Reports whether the API and its database are reachable. No authentication.

**200 OK**

```json
{
  "data": {
    "status": "ok",
    "version": "0.1.0",
    "uptimeSeconds": 42,
    "database": "up",
    "timestamp": "2026-10-07T05:28:23.617Z"
  }
}
```

**503 Service Unavailable**: same shape with `"status": "degraded"` and `"database": "down"`.

Schema: `healthResponseSchema` in `packages/shared/src/health.ts` (usable in tests to validate the body).

### Unknown routes

`GET /api/does-not-exist` → **404**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /api/does-not-exist does not exist",
    "requestId": "…"
  }
}
```

## Planned endpoints

See [phases/phase-0-architecture.md §11](phases/phase-0-architecture.md#11-api-architecture). Each phase moves its
endpoints from "planned" to the list above.
