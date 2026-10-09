---
id: API-PROJECT-04
title: PATCH /api/projects/:key
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements:
    [
      US-PROJECT-04,
      BR-PROJECT-03,
      BR-PROJECT-04,
      BR-PROJECT-05,
      BR-PROJECT-07,
      BR-PROJECT-20,
      BR-PROJECT-35,
    ]
  acceptance:
    [
      AC-PROJECT-68,
      AC-PROJECT-18,
      AC-PROJECT-19,
      AC-PROJECT-20,
      AC-PROJECT-21,
      AC-PROJECT-22,
      AC-PROJECT-67,
    ]
  design: [SCR-PROJECT-02, DD-PROJECT-03, FLW-PROJECT-05]
updated: 2026-10-09
---

# PATCH /api/projects/:key

Edits a project's name and description, with optimistic locking. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| **Auth**        | Project admin (or System admin)                           |
| **Since phase** | 3                                                         |
| **Schema**      | `packages/shared/src/projects.ts` (`projectUpdateSchema`) |

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

| Field         | Type           | Required | Rules                                     |
| ------------- | -------------- | -------- | ----------------------------------------- |
| `version`     | integer        | yes      | The `version` you read                    |
| `name`        | string         | no       | Trimmed, 3–100 characters                 |
| `description` | string \| null | no       | At most 2000 characters; `null` clears it |

```json
{ "version": 3, "name": "ShopEase Web", "description": "Customer web shop" }
```

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
    "myAccess": "MEMBER",
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
    "createdBy": {
      "id": "cm…",
      "name": "Oanh Owner"
    },
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-10-08T13:40:00.000Z"
  }
}
```

| Field                   | Type                          | Description                                                                                      |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `key`                   | string                        | Project key, upper-case (BR-PROJECT-02)                                                          |
| `name`                  | string                        | Display name                                                                                     |
| `description`           | string \| null                | Description                                                                                      |
| `archivedAt`            | string (ISO 8601) \| null     | When it was archived; `null` = active                                                            |
| `version`               | integer                       | Send back on `PATCH` (DD-PROJECT-03)                                                             |
| `myAccess`              | ProjectAccess \| null         | Caller's access level (`PROJECT_ADMIN`, `MEMBER`); `null` for a System admin who is not a member |
| `memberCount`           | integer                       | Number of members                                                                                |
| `activeRelease`         | { id, name } \| null          | The `ACTIVE` release                                                                             |
| `activeMilestone`       | { id, name, endDate } \| null | The `ACTIVE` milestone (header "days left")                                                      |
| `createdBy`             | { id, name }                  | Creator                                                                                          |
| `createdAt / updatedAt` | string (ISO 8601)             | Timestamps (UTC)                                                                                 |

`key` is not accepted (400): it can never change (BR-PROJECT-03). A body that changes nothing returns 200 with the same `version`.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                   | `messageId`    | When                                                                                             |
| ------ | ------------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09  | Body is not `application/json`                                                                   |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`               |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`              | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 403    | `FORBIDDEN`              | MSG-COMMON-06  | The caller's access level does not allow this action (BR-PROJECT-35)                             |
| 422    | `PROJECT_ARCHIVED`       | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                          |
| 409    | `VERSION_CONFLICT`       | MSG-PROJECT-07 | `version` is not the current one (BR-PROJECT-07, DD-PROJECT-03)                                  |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only `name`, `description`, `version`; `key`, `archivedAt` and unknown fields → 400                    |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB                                                                                   |
| API5 Broken function level authorization                                         | `assertCan(access, "project:edit")`                                                                    |

## Side effects

Not idempotent: repeating the same call sends a stale `version` and gets 409. Writes `projects` (`version` + 1) and one activity entry `project.updated` with old and new values.

## Example

```bash
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/projects/SHOP -H 'Content-Type: application/json' -d '{"version":3,"name":"ShopEase Web"}'
```

## Test ideas

| Type       | Case                                            | Expected                                        |
| ---------- | ----------------------------------------------- | ----------------------------------------------- |
| Happy path | Project admin renames                           | 200, `version` + 1, activity entry with from/to |
| Negative   | Same body twice with the same version           | 200, then 409                                   |
| Boundary   | Name 3 and 101 characters                       | 200, 400                                        |
| Permission | System admin, Project admin, Member, non-member | 200, 200, 403, 404                              |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
