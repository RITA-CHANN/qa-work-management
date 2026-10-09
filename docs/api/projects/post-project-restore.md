---
id: API-PROJECT-06
title: POST /api/projects/:key/restore
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-06, BR-PROJECT-08, BR-PROJECT-35]
  acceptance: [AC-PROJECT-32]
  design: [FLW-PROJECT-03, SCR-PROJECT-02]
updated: 2026-10-09
---

# POST /api/projects/:key/restore

Restores a project (Project admins only). An archived project is read-only for everyone until it is restored. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                     |
| --------------- | --------------------------------------------------- |
| **Auth**        | Project admin (or System admin)                     |
| **Since phase** | 3                                                   |
| **Schema**      | `packages/shared/src/projects.ts` (`projectSchema`) |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

An empty object `{}`.

## Responses

### 200 OK

```json
{
  "data": {
    "key": "SHOP",
    "name": "ShopEase Web",
    "description": "Customer web shop",
    "archivedAt": null,
    "version": 4,
    "myAccess": "PROJECT_ADMIN",
    "memberCount": 8,
    "activeRelease": {
      "id": "cm…",
      "name": "2.4"
    },
    "activeMilestone": {
      "id": "cm…",
      "name": "Sprint 4",
      "endDate": "2026-10-12"
    },
    "guestAreas": ["dashboard", "releases"],
    "createdBy": {
      "id": "cm…",
      "name": "Oanh Owner"
    },
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-10-08T13:40:00.000Z"
  }
}
```

| Field                   | Type                          | Description                                                                                               |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `key`                   | string                        | Project key, upper-case (BR-PROJECT-02)                                                                   |
| `name`                  | string                        | Display name                                                                                              |
| `description`           | string \| null                | Description                                                                                               |
| `archivedAt`            | string (ISO 8601) \| null     | When it was archived; `null` = active                                                                     |
| `version`               | integer                       | Send back on `PATCH` (DD-PROJECT-03)                                                                      |
| `myAccess`              | ProjectAccess \| null         | Caller's access level (`PROJECT_ADMIN`, `MEMBER`, `GUEST`); `null` for a System admin who is not a member |
| `memberCount`           | integer                       | Number of members                                                                                         |
| `activeRelease`         | { id, name } \| null          | The `ACTIVE` release                                                                                      |
| `activeMilestone`       | { id, name, endDate } \| null | The `ACTIVE` milestone (header "days left")                                                               |
| `guestAreas`            | string[]                      | Areas a Guest of this project may see (BR-GUEST-02)                                                       |
| `createdBy`             | { id, name }                  | Creator                                                                                                   |
| `createdAt / updatedAt` | string (ISO 8601)             | Timestamps (UTC)                                                                                          |

The body is an empty JSON object `{}` (the CSRF guard still needs `Content-Type: application/json`). No `version` needed; the call bumps it, so open edit forms become stale.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                   | `messageId`    | When                                                                                             |
| ------ | ------------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09  | Body is not `application/json`                                                                   |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`              | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 403    | `FORBIDDEN`              | MSG-COMMON-06  | The caller's access level does not allow this action (BR-PROJECT-35)                             |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | No body fields accepted                                                                                |
| API4 Unrestricted resource consumption                                           | One update per call                                                                                    |
| API5 Broken function level authorization                                         | `assertCan(access, "project:archive")`: Project admin                                                  |

## Side effects

Idempotent: restoring an active project returns 200 and changes nothing (no activity entry). Otherwise clears `archived_at`, `version` + 1, one activity entry `project.restored`.

## Example

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/projects/MOBI/restore -H 'Content-Type: application/json' -d '{}'
```

## Test ideas

| Type       | Case                   | Expected                                    |
| ---------- | ---------------------- | ------------------------------------------- |
| Happy path | Project admin restores | 200; activity entry                         |
| Negative   | Restore twice          | 200, then 200 with no second activity entry |
| Permission | Member (any job title) | 403                                         |
| Security   | No Content-Type        | 415                                         |

## Change log

| Date       | Change                                                                                  | Why                                     |
| ---------- | --------------------------------------------------------------------------------------- | --------------------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                                |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09              |
| 2026-10-09 | Response has `guestAreas`; `myAccess` can be `GUEST`                                    | Guest access (BR-GUEST-01, BR-GUEST-02) |
