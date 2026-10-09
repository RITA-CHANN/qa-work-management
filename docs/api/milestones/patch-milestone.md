---
id: API-MILESTONE-03
title: PATCH /api/projects/:key/milestones/:id
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
      US-PROJECT-11,
      BR-PROJECT-07,
      BR-PROJECT-27,
      BR-PROJECT-28,
      BR-PROJECT-29,
      BR-PROJECT-30,
      BR-PROJECT-31,
      BR-PROJECT-32,
    ]
  acceptance: [AC-PROJECT-61, AC-PROJECT-62, AC-PROJECT-63]
  design: [FLW-PROJECT-04, DD-PROJECT-04, DD-PROJECT-03]
updated: 2026-10-09
---

# PATCH /api/projects/:key/milestones/:id

Edits a milestone, or moves its status one step forward (start, complete). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                               |
| --------------- | ------------------------------------------------------------- |
| **Auth**        | Project admin (or System admin)                               |
| **Since phase** | 3                                                             |
| **Schema**      | `packages/shared/src/milestones.ts` (`milestoneUpdateSchema`) |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |
| `id`  | string | Milestone id                                    |

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field       | Type                | Required | Rules                                                               |
| ----------- | ------------------- | -------- | ------------------------------------------------------------------- |
| `version`   | integer             | yes      | The `version` you read                                              |
| `name`      | string              | no       | Trimmed, 1–50 characters (MSG-PROJECT-23)                           |
| `goal`      | string \| null      | no       | At most 500 characters                                              |
| `startDate` | string (YYYY-MM-DD) | no       | First day                                                           |
| `endDate`   | string (YYYY-MM-DD) | no       | Last day; 1 to `MILESTONE_MAX_DAYS` (28) days long (MSG-PROJECT-24) |
| `status`    | MilestoneStatus     | no       | Only the next status                                                |

```json
{ "version": 1, "status": "ACTIVE" }
```

## Responses

### 200 OK

```json
{
  "data": {
    "id": "cm…",
    "releaseId": "cm…",
    "name": "Sprint 4",
    "goal": "Checkout",
    "startDate": "2026-09-29",
    "endDate": "2026-10-12",
    "days": 14,
    "status": "ACTIVE",
    "version": 2,
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

| Field                 | Type                                 | Description                    |
| --------------------- | ------------------------------------ | ------------------------------ |
| `id`                  | string                               | Milestone id                   |
| `releaseId`           | string                               | Release it belongs to          |
| `name`                | string                               | Name as typed (trimmed)        |
| `goal`                | string \| null                       | Goal                           |
| `startDate / endDate` | string (YYYY-MM-DD)                  | First and last day (inclusive) |
| `days`                | integer                              | `endDate − startDate + 1`      |
| `status`              | "PLANNED" \| "ACTIVE" \| "COMPLETED" | Status (DD-PROJECT-04)         |
| `version`             | integer                              | Send back on `PATCH`           |

`releaseId` can't be changed; delete and recreate a Planned milestone instead.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                      | `messageId`    | When                                                                                             |
| ------ | --------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 415    | `UNSUPPORTED_MEDIA_TYPE`    | MSG-COMMON-09  | Body is not `application/json`                                                                   |
| 400    | `VALIDATION_ERROR`          | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`               |
| 401    | `UNAUTHENTICATED`           | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`                 | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 404    | `NOT_FOUND`                 | MSG-COMMON-07  | `id` is not a milestone of this project                                                          |
| 403    | `FORBIDDEN`                 | MSG-COMMON-06  | The caller's access level does not allow this action (BR-PROJECT-35)                             |
| 422    | `PROJECT_ARCHIVED`          | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                          |
| 409    | `VERSION_CONFLICT`          | MSG-PROJECT-07 | `version` is not the current one (BR-PROJECT-07, DD-PROJECT-03)                                  |
| 409    | `INVALID_TRANSITION`        | MSG-PROJECT-28 | Status backwards or skipping (BR-PROJECT-31)                                                     |
| 422    | `CANNOT_ACTIVATE_MILESTONE` | MSG-PROJECT-29 | Release not `ACTIVE`, or another milestone is `ACTIVE` (BR-PROJECT-32)                           |
| 409    | `MILESTONE_NAME_TAKEN`      | MSG-PROJECT-30 | Name already used in this project (BR-PROJECT-27)                                                |
| 422    | `MILESTONE_OUTSIDE_RELEASE` | MSG-PROJECT-25 | Dates outside the release's dates (BR-PROJECT-29)                                                |
| 422    | `MILESTONE_OVERLAP`         | MSG-PROJECT-26 | Overlaps another milestone of the same release, sharing one day counts (BR-PROJECT-30)           |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only the listed fields                                                                                 |
| API4 Unrestricted resource consumption                                           | One update per call                                                                                    |
| API5 Broken function level authorization                                         | `milestone:write`                                                                                      |

## Side effects

Not idempotent (version). Writes the milestone (`version` + 1) and one activity entry `milestone.updated` or `milestone.status_changed`.

## Example

```bash
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/projects/SHOP/milestones/<id> -H 'Content-Type: application/json' -d '{"version":2,"status":"COMPLETED"}'
```

## Test ideas

| Type       | Case                                                          | Expected               |
| ---------- | ------------------------------------------------------------- | ---------------------- |
| Happy path | Start then complete                                           | 200, 200               |
| Negative   | Start Sprint 5 while Sprint 4 is ACTIVE; while 2.5 is PLANNED | 422 for both           |
| Negative   | COMPLETED → ACTIVE                                            | 409                    |
| Negative   | Stale version                                                 | 409 `VERSION_CONFLICT` |
| Permission | Member with job title Team lead (Tuan TeamLead)               | 403                    |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
