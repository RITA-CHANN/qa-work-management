---
id: API-RELEASE-01
title: GET /api/projects/:key/releases
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-08, US-PROJECT-12]
  acceptance: [AC-PROJECT-36]
  design: [SCR-PROJECT-04]
updated: 2026-10-09
---

# GET /api/projects/:key/releases

Lists the releases of a project with their milestone counts (SCR-PROJECT-04). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                     |
| --------------- | --------------------------------------------------- |
| **Auth**        | Any member, or System admin                         |
| **Since phase** | 3                                                   |
| **Schema**      | `packages/shared/src/releases.ts` (`releaseSchema`) |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

## Responses

### 200 OK

```json
{
  "data": [
    {
      "id": "cm…",
      "name": "2.4",
      "status": "ACTIVE",
      "startDate": "2026-09-15",
      "targetDate": "2026-10-31",
      "version": 2,
      "milestoneCount": 2,
      "createdAt": "…",
      "updatedAt": "…"
    }
  ]
}
```

| Field                    | Type                                | Description                |
| ------------------------ | ----------------------------------- | -------------------------- |
| `id`                     | string                              | Release id                 |
| `name`                   | string                              | Name as typed (trimmed)    |
| `status`                 | "PLANNED" \| "ACTIVE" \| "RELEASED" | Status (DD-PROJECT-04)     |
| `startDate / targetDate` | string (YYYY-MM-DD) \| null         | Calendar dates             |
| `version`                | integer                             | Send back on `PATCH`       |
| `milestoneCount`         | integer                             | Milestones in this release |

Ordered Active, Planned (by start date), Released (newest first).

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
| API3 Broken object property level authorization (data exposure, mass assignment) | Release fields only                                                                                    |
| API4 Unrestricted resource consumption                                           | Bounded by project size                                                                                |
| API5 Broken function level authorization                                         | Any member                                                                                             |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt http://localhost:3000/api/projects/SHOP/releases
```

## Test ideas

| Type       | Case              | Expected                    |
| ---------- | ----------------- | --------------------------- |
| Happy path | SHOP              | 2.4, 2.5, 2.3 in that order |
| Negative   | SECRET as Linh QA | 404                         |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
