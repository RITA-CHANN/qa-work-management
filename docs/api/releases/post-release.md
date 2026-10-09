---
id: API-RELEASE-02
title: POST /api/projects/:key/releases
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-08, BR-PROJECT-14, BR-PROJECT-15]
  acceptance: [AC-PROJECT-36, AC-PROJECT-37, AC-PROJECT-38, AC-PROJECT-39, AC-PROJECT-40]
  design: [FLW-PROJECT-04, SCR-PROJECT-04, DD-PROJECT-04]
updated: 2026-10-09
---

# POST /api/projects/:key/releases

Creates a release in status Planned. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| **Auth**        | Project admin (or System admin)                           |
| **Since phase** | 3                                                         |
| **Schema**      | `packages/shared/src/releases.ts` (`releaseCreateSchema`) |

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

| Field        | Type                        | Required | Rules                                        |
| ------------ | --------------------------- | -------- | -------------------------------------------- |
| `name`       | string                      | yes      | Trimmed, 1–50 characters (MSG-PROJECT-13)    |
| `startDate`  | string (YYYY-MM-DD) \| null | no       | Calendar date                                |
| `targetDate` | string (YYYY-MM-DD) \| null | no       | ≥ `startDate` when both set (MSG-PROJECT-15) |

```json
{ "name": "2.6", "startDate": "2026-12-01", "targetDate": "2026-12-31" }
```

## Responses

### 201 Created

```json
{
  "data": {
    "id": "cm…",
    "name": "2.6",
    "status": "PLANNED",
    "startDate": "2026-12-01",
    "targetDate": "2026-12-31",
    "version": 1,
    "milestoneCount": 0,
    "createdAt": "…",
    "updatedAt": "…"
  }
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

`status` is not accepted: a new release is always `PLANNED`.

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
| 409    | `RELEASE_NAME_TAKEN`     | MSG-PROJECT-14 | Same name in this project, ignoring case and spaces (BR-PROJECT-14)                              |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only `name`, `startDate`, `targetDate`                                                                 |
| API4 Unrestricted resource consumption                                           | One insert per call                                                                                    |
| API5 Broken function level authorization                                         | `release:write`                                                                                        |

## Side effects

Not idempotent: the second identical call gets 409. Writes one release and one activity entry `release.created`.

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/projects/MOBI/releases -H 'Content-Type: application/json' -d '{"name":"1.1"}'
```

## Test ideas

| Type       | Case                                                                | Expected     |
| ---------- | ------------------------------------------------------------------- | ------------ |
| Happy path | Project admin creates "2.6"                                         | 201, PLANNED |
| Negative   | " 2.4 " in SHOP; "2.4" in MOBI                                      | 409; 201     |
| Boundary   | Target = start; target = start − 1 day                              | 201; 400     |
| Permission | Member with job title QA lead (Minh Lead in SHOP) creates a release | 403          |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
