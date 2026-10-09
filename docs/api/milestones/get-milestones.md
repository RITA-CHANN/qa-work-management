---
id: API-MILESTONE-01
title: GET /api/projects/:key/milestones
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-12, BR-PROJECT-26, BR-GUEST-03]
  acceptance: [AC-PROJECT-54, AC-PROJECT-64, AC-GUEST-01]
  design: [SCR-PROJECT-04]
updated: 2026-10-09
---

# GET /api/projects/:key/milestones

Lists the milestones (sprints) of a project, optionally of one release. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                           |
| --------------- | ------------------------------------------------------------------------- |
| **Auth**        | Any member, or System admin; a Guest only while the `releases` area is on |
| **Since phase** | 3                                                                         |
| **Schema**      | `packages/shared/src/milestones.ts` (`milestoneSchema`)                   |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

### Query parameters

| Name        | Type   | Required | Default | Description                    |
| ----------- | ------ | -------- | ------- | ------------------------------ |
| `releaseId` | string | no       | —       | Only this release's milestones |

## Responses

### 200 OK

```json
{
  "data": [
    {
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
  ]
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

Sorted by start date.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`             | `messageId`    | When                                                                                             |
| ------ | ------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| 400    | `VALIDATION_ERROR` | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`               |
| 401    | `UNAUTHENTICATED`  | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`        | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 404    | `NOT_FOUND`        | MSG-COMMON-07  | The caller is a Guest and the `releases` area is off for Guests (BR-GUEST-03)                    |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                                                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008); `releaseId` of another project gives an empty list, not its data |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                                                                         |
| API3 Broken object property level authorization (data exposure, mass assignment) | Milestone fields only                                                                                                                                                    |
| API4 Unrestricted resource consumption                                           | Bounded by project size                                                                                                                                                  |
| API5 Broken function level authorization                                         | Any member; `assertArea(ctx, "releases")` for a Guest: sprints belong to the `releases` area (BR-GUEST-03)                                                               |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt 'http://localhost:3000/api/projects/SHOP/milestones?releaseId=<id>'
```

## Test ideas

| Type       | Case                                            | Expected                           |
| ---------- | ----------------------------------------------- | ---------------------------------- |
| Happy path | SHOP                                            | Sprint 1 to Sprint 5 by start date |
| Negative   | SECRET as Linh QA                               | 404                                |
| Permission | SHOP as Sam Stakeholder (Guest), `releases` off | 404 MSG-COMMON-07                  |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
| 2026-10-09 | Guest: 404 while the `releases` area is off                                             | BR-GUEST-03                |
