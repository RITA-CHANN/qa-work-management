---
id: API-PROJECT-03
title: GET /api/projects/:key
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-03, US-PROJECT-12, BR-PROJECT-06, BR-PROJECT-34, BR-PROJECT-36]
  acceptance: [AC-PROJECT-15, AC-PROJECT-16, AC-PROJECT-64]
  design: [SCR-PROJECT-02, DD-PROJECT-01]
updated: 2026-10-09
---

# GET /api/projects/:key

Returns one project with the caller's access level, for the project page header and Overview (SCR-PROJECT-02). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                     |
| --------------- | --------------------------------------------------- |
| **Auth**        | Any member, or System admin                         |
| **Since phase** | 3                                                   |
| **Schema**      | `packages/shared/src/projects.ts` (`projectSchema`) |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

## Responses

### 200 OK

```json
{
  "data": {
    "key": "SHOP",
    "name": "ShopEase Web",
    "description": "Customer web shop",
    "archivedAt": null,
    "version": 3,
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

Archived projects are returned too (with `archivedAt`), so the page can show the banner.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`            | `messageId`    | When                                                                                             |
| ------ | ----------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 401    | `UNAUTHENTICATED` | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`       | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | Project fields only; creator shown by name                                                             |
| API4 Unrestricted resource consumption                                           | One indexed lookup                                                                                     |
| API5 Broken function level authorization                                         | Any member                                                                                             |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt http://localhost:3000/api/projects/SHOP
```

## Test ideas

| Type       | Case                           | Expected                                                         |
| ---------- | ------------------------------ | ---------------------------------------------------------------- |
| Happy path | Linh QA gets SHOP              | 200, `myAccess` MEMBER                                           |
| Negative   | Linh QA gets SECRET; gets NOPE | Both 404 with identical bodies except `requestId` and `instance` |
| Boundary   | Key in lower case `shop`       | 200 (same project)                                               |
| Permission | Ada Admin gets SHOP            | 200, `myAccess` null                                             |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
