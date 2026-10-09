---
id: API-MILESTONE-02
title: POST /api/projects/:key/milestones
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements:
    [US-PROJECT-11, BR-PROJECT-26, BR-PROJECT-27, BR-PROJECT-28, BR-PROJECT-29, BR-PROJECT-30]
  acceptance:
    [
      AC-PROJECT-70,
      AC-PROJECT-54,
      AC-PROJECT-55,
      AC-PROJECT-56,
      AC-PROJECT-57,
      AC-PROJECT-58,
      AC-PROJECT-59,
      AC-PROJECT-60,
    ]
  design: [FLW-PROJECT-04, SCR-PROJECT-04, DD-PROJECT-04]
updated: 2026-10-09
---

# POST /api/projects/:key/milestones

Creates a milestone (sprint) in a release, in status Planned. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                               |
| --------------- | ------------------------------------------------------------- |
| **Auth**        | Project admin (or System admin)                               |
| **Since phase** | 3                                                             |
| **Schema**      | `packages/shared/src/milestones.ts` (`milestoneCreateSchema`) |

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

| Field       | Type                | Required     | Rules                                                                   |
| ----------- | ------------------- | ------------ | ----------------------------------------------------------------------- |
| `releaseId` | string              | yes (create) | A release of this project that is `PLANNED` or `ACTIVE` (BR-PROJECT-26) |
| `name`      | string              | yes (create) | Trimmed, 1–50 characters (MSG-PROJECT-23)                               |
| `goal`      | string \| null      | no           | At most 500 characters                                                  |
| `startDate` | string (YYYY-MM-DD) | yes (create) | First day                                                               |
| `endDate`   | string (YYYY-MM-DD) | yes (create) | Last day; 1 to `MILESTONE_MAX_DAYS` (28) days long (MSG-PROJECT-24)     |

```json
{
  "releaseId": "cm…",
  "name": "Sprint 6",
  "goal": "Payments",
  "startDate": "2026-11-15",
  "endDate": "2026-11-28"
}
```

## Responses

### 201 Created

```json
{
  "data": {
    "id": "cm…",
    "releaseId": "cm…",
    "name": "Sprint 6",
    "goal": "Payments",
    "startDate": "2026-11-15",
    "endDate": "2026-11-28",
    "days": 14,
    "status": "PLANNED",
    "version": 1,
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

`status` and `projectId` are not accepted; the project comes from the release.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                      | `messageId`    | When                                                                                             |
| ------ | --------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 415    | `UNSUPPORTED_MEDIA_TYPE`    | MSG-COMMON-09  | Body is not `application/json`                                                                   |
| 400    | `VALIDATION_ERROR`          | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`               |
| 401    | `UNAUTHENTICATED`           | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`                 | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 404    | `NOT_FOUND`                 | MSG-COMMON-07  | `releaseId` is not a release of this project                                                     |
| 403    | `FORBIDDEN`                 | MSG-COMMON-06  | The caller's access level does not allow this action (BR-PROJECT-35)                             |
| 422    | `PROJECT_ARCHIVED`          | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                          |
| 409    | `MILESTONE_NAME_TAKEN`      | MSG-PROJECT-30 | Name already used in this project (BR-PROJECT-27)                                                |
| 422    | `MILESTONE_OUTSIDE_RELEASE` | MSG-PROJECT-25 | Dates outside the release's dates (BR-PROJECT-29)                                                |
| 422    | `MILESTONE_OVERLAP`         | MSG-PROJECT-26 | Overlaps another milestone of the same release, sharing one day counts (BR-PROJECT-30)           |
| 422    | `RELEASE_CLOSED`            | MSG-PROJECT-32 | The release is already released, so it takes no new milestones                                   |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008); `releaseId` must belong to this project |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                                                |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only the listed fields                                                                                                                          |
| API4 Unrestricted resource consumption                                           | One insert per call; overlap query bounded to one release                                                                                       |
| API5 Broken function level authorization                                         | `milestone:write`                                                                                                                               |

## Side effects

Not idempotent: the second identical call gets 409. Writes one milestone and one activity entry `milestone.created`.

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/projects/SHOP/milestones -H 'Content-Type: application/json' -d '{"releaseId":"<id>","name":"Sprint 6","startDate":"2026-11-15","endDate":"2026-11-28"}'
```

## Test ideas

| Type       | Case                                                                                                  | Expected                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Happy path | Project admin adds a 14-day sprint                                                                    | 201, PLANNED                                             |
| Boundary   | 1, 28 and 29 days                                                                                     | 201, 201, 400                                            |
| Boundary   | Start one day before the release; sharing one day with Sprint 5                                       | 422 `MILESTONE_OUTSIDE_RELEASE`; 422 `MILESTONE_OVERLAP` |
| Permission | Members with job title Team lead, Developer, Stakeholder (Tuan TeamLead, Dev Nguyen, Sam Stakeholder) | 403                                                      |

## Change log

| Date       | Change                                                                                  | Why                              |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                         |
| 2026-10-09 | Added 422 `RELEASE_CLOSED` (MSG-PROJECT-32) for a released release                      | Gap found while building the API |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09       |
