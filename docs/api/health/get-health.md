---
id: API-HEALTH-01
title: GET /api/health
type: api
feature: health
status: approved
owner: Claude
reviewers: [Linh]
approved: 2026-10-07
phase: 1
updated: 2026-10-07
---

# GET /api/health

Reports whether the API and its database are reachable. Used by the web app's "API status"
indicator and by Playwright to know when the test server is ready.

|                 |                                                          |
| --------------- | -------------------------------------------------------- |
| **Auth**        | None                                                     |
| **Since phase** | 1                                                        |
| **Schema**      | `packages/shared/src/health.ts` (`healthResponseSchema`) |

## Request

No parameters and no body.

## Responses

### 200 OK

Everything is reachable.

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

| Field           | Type                   | Description                               |
| --------------- | ---------------------- | ----------------------------------------- |
| `status`        | `"ok"` \| `"degraded"` | `"degraded"` when a dependency is down    |
| `version`       | string                 | API version from `apps/api/package.json`  |
| `uptimeSeconds` | number ≥ 0             | Seconds since the API process started     |
| `database`      | `"up"` \| `"down"`     | Result of a `SELECT 1` against PostgreSQL |
| `timestamp`     | ISO 8601 string        | Server time of the response               |

### 503 Service Unavailable

The database is unreachable. Same shape as 200, with `"status": "degraded"` and `"database": "down"`.
This is a health report, not an error, so it does **not** use the `{ "error": ... }` envelope.

### Response headers

| Header         | Description                                       |
| -------------- | ------------------------------------------------- |
| `X-Request-Id` | Request id (echoes yours if you sent a valid one) |

## Security

| Risk (OWASP API Security Top 10, 2023)   | How this endpoint handles it                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| API1 Object level authorization          | Not applicable                                                                     |
| API2 Broken authentication               | Public by design; returns no user data                                             |
| API3 Object property level authorization | Only status, version, uptime and time; no host names, connection strings or errors |
| API4 Unrestricted resource consumption   | One `SELECT 1`. Known gap: not rate limited                                        |
| API5 Function level authorization        | Public by design                                                                   |

## Side effects

Read only and idempotent.

## Example

```bash
curl -i http://localhost:3000/api/health
curl -i http://localhost:3000/api/health -H 'X-Request-Id: my-test-1'
```

## Test ideas

| Type       | Case                                                | Expected                                                                         |
| ---------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Happy path | `GET /api/health`                                   | 200, `status` = `"ok"`, `database` = `"up"`, body matches `healthResponseSchema` |
| Header     | Send `X-Request-Id: my-test-1`                      | Response header `x-request-id` = `my-test-1`                                     |
| Header     | Send an invalid id (e.g. 100 characters)            | A new generated id is returned instead                                           |
| Data       | Call twice a few seconds apart                      | `uptimeSeconds` does not decrease                                                |
| Failure    | Stop Postgres (`docker compose stop db`), then call | 503, `status` = `"degraded"`, `database` = `"down"` (manual test)                |

## Change log

| Date       | Change                                             | Why                                         |
| ---------- | -------------------------------------------------- | ------------------------------------------- |
| 2026-10-07 | First version                                      | Phase 1                                     |
| 2026-10-08 | Added Security (OWASP API Top 10) and Side effects | Documentation standards (docs/STANDARDS.md) |
