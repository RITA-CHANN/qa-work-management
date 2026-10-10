---
id: API-RELEASE-03
title: PATCH /api/projects/:key/releases/:id
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
      US-PROJECT-08,
      BR-PROJECT-07,
      BR-PROJECT-14,
      BR-PROJECT-15,
      BR-PROJECT-16,
      BR-PROJECT-17,
      BR-PROJECT-25,
      BR-PROJECT-29,
      BR-PROJECT-45,
    ]
  acceptance: [AC-PROJECT-41, AC-PROJECT-42, AC-PROJECT-52, AC-PROJECT-102]
  design: [FLW-PROJECT-04, DD-PROJECT-04, DD-PROJECT-03]
updated: 2026-10-10
---

# PATCH /api/projects/:key/releases/:id

Edits a release's name and dates, or moves its status one step forward. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| **Auth**        | Project admin (or System admin)                           |
| **Since phase** | 3                                                         |
| **Schema**      | `packages/shared/src/releases.ts` (`releaseUpdateSchema`) |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |
| `id`  | string | Release id                                      |

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field                    | Type           | Required | Rules                                                            |
| ------------------------ | -------------- | -------- | ---------------------------------------------------------------- |
| `version`                | integer        | yes      | The `version` you read                                           |
| `name`                   | string         | no       | As on create                                                     |
| `startDate / targetDate` | string \| null | no       | As on create; existing milestones must still fit (BR-PROJECT-29) |
| `status`                 | ReleaseStatus  | no       | Only the next status (DD-PROJECT-04)                             |

```json
{ "version": 2, "status": "RELEASED" }
```

## Responses

### 200 OK

```json
{
  "data": {
    "id": "cm…",
    "name": "2.4",
    "status": "RELEASED",
    "startDate": "2026-09-15",
    "targetDate": "2026-10-31",
    "version": 3,
    "milestoneCount": 2,
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

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                      | `messageId`    | When                                                                                                                                     |
| ------ | --------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`    | MSG-COMMON-09  | Body is not `application/json`                                                                                                           |
| 400    | `VALIDATION_ERROR`          | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`                                                       |
| 401    | `UNAUTHENTICATED`           | MSG-COMMON-05  | Not logged in                                                                                                                            |
| 404    | `NOT_FOUND`                 | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008)                                         |
| 404    | `NOT_FOUND`                 | MSG-COMMON-07  | `id` is not a release of this project                                                                                                    |
| 403    | `FORBIDDEN`                 | MSG-COMMON-06  | The caller's access level does not allow this action (BR-PROJECT-35)                                                                     |
| 422    | `PROJECT_ARCHIVED`          | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                                                                  |
| 409    | `VERSION_CONFLICT`          | MSG-PROJECT-07 | `version` is not the current one (BR-PROJECT-07, DD-PROJECT-03)                                                                          |
| 422    | `RELEASE_CLOSED`            | MSG-PROJECT-45 | The release is `RELEASED` and the body changes its name or dates (BR-PROJECT-45). A status-only body still gets 409 `INVALID_TRANSITION` |
| 409    | `RELEASE_NAME_TAKEN`        | MSG-PROJECT-14 | New name already used                                                                                                                    |
| 409    | `INVALID_TRANSITION`        | MSG-PROJECT-16 | Status backwards or skipping a step (BR-PROJECT-16)                                                                                      |
| 422    | `ACTIVE_RELEASE_EXISTS`     | MSG-PROJECT-17 | Another release is `ACTIVE` (BR-PROJECT-17)                                                                                              |
| 422    | `OPEN_MILESTONES`           | MSG-PROJECT-27 | `RELEASED` while a milestone is not `COMPLETED` (BR-PROJECT-25)                                                                          |
| 422    | `MILESTONE_OUTSIDE_RELEASE` | MSG-PROJECT-25 | New dates would leave a milestone outside (BR-PROJECT-29)                                                                                |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008); the release must belong to this project |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                                                |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only the listed fields                                                                                                                          |
| API4 Unrestricted resource consumption                                           | One update per call                                                                                                                             |
| API5 Broken function level authorization                                         | `release:write`                                                                                                                                 |

## Side effects

Not idempotent (version). Writes the release (`version` + 1) and one activity entry `release.updated` or `release.status_changed`.

## Example

```bash
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/projects/SHOP/releases/<id> -H 'Content-Type: application/json' -d '{"version":2,"status":"ACTIVE"}'
```

## Test ideas

| Type       | Case                                 | Expected                    |
| ---------- | ------------------------------------ | --------------------------- |
| Happy path | PLANNED → ACTIVE → RELEASED          | 200 each                    |
| Negative   | ACTIVE → PLANNED; PLANNED → RELEASED | 409; 409                    |
| Negative   | Activate 2.5 while 2.4 is ACTIVE     | 422 `ACTIVE_RELEASE_EXISTS` |
| Negative   | Release 2.4 while Sprint 4 is ACTIVE | 422 `OPEN_MILESTONES`       |

## Change log

| Date       | Change                                                                                  | Why                                       |
| ---------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                                  |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09                |
| 2026-10-10 | Added 422 `RELEASE_CLOSED` (MSG-PROJECT-45): a released release is read-only            | BR-PROJECT-45, Linh's decision 2026-10-10 |
