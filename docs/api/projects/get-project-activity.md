---
id: API-PROJECT-12
title: GET /api/projects/:key/activity
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-09, BR-PROJECT-19, BR-PROJECT-20, BR-PROJECT-21, BR-PROJECT-22]
  acceptance: [AC-PROJECT-08, AC-PROJECT-44, AC-PROJECT-45, AC-PROJECT-46, AC-PROJECT-47]
  design: [SCR-PROJECT-05, DD-PROJECT-02]
updated: 2026-10-09
---

# GET /api/projects/:key/activity

Pages through the project's activity log, newest first (SCR-PROJECT-05). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                  |
| --------------- | -------------------------------------------------------------------------------- |
| **Auth**        | Any member, or System admin                                                      |
| **Since phase** | 3                                                                                |
| **Schema**      | `packages/shared/src/activity.ts` (`activityQuerySchema`, `activityEntrySchema`) |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

### Query parameters

| Name     | Type    | Required | Default | Description                            |
| -------- | ------- | -------- | ------- | -------------------------------------- |
| `limit`  | integer | no       | 20      | 1–100 entries per page                 |
| `cursor` | string  | no       | —       | `meta.nextCursor` of the previous page |

## Responses

### 200 OK

```json
{
  "data": [
    {
      "id": "cm…",
      "action": "member.updated",
      "entityType": "member",
      "entityId": "cm…",
      "summary": "Oanh Owner changed Linh QA's access from Member to Project admin and job title from QA engineer to QA lead",
      "changes": {
        "access": {
          "from": "MEMBER",
          "to": "PROJECT_ADMIN"
        },
        "jobTitle": {
          "from": "QAE",
          "to": "QAL"
        }
      },
      "actor": {
        "id": "cm…",
        "name": "Oanh Owner"
      },
      "createdAt": "2026-10-08T14:02:00.000Z"
    }
  ],
  "meta": {
    "nextCursor": "cm…"
  }
}
```

| Field             | Type              | Description                                            |
| ----------------- | ----------------- | ------------------------------------------------------ |
| `id`              | string            | Entry id; also a cursor                                |
| `action`          | string            | `<entity>.<verb>` (DD-PROJECT-02)                      |
| `summary`         | string            | Sentence to show                                       |
| `changes`         | object \| null    | `{ field: { from, to } }`                              |
| `actor`           | { id, name }      | Who did it                                             |
| `createdAt`       | string (ISO 8601) | When                                                   |
| `meta.nextCursor` | string \| null    | Pass as `cursor` for the next page; `null` = last page |

There is no POST, PATCH or DELETE for activity (BR-PROJECT-21).

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`             | `messageId`    | When                                                                                             |
| ------ | ------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| 400    | `VALIDATION_ERROR` | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`               |
| 401    | `UNAUTHENTICATED`  | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`        | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | Names only, no emails                                                                                  |
| API4 Unrestricted resource consumption                                           | `limit` at most 100 (NFR-PROJECT-05); cursor must belong to this project                               |
| API5 Broken function level authorization                                         | Any member                                                                                             |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt 'http://localhost:3000/api/projects/SHOP/activity?limit=20'
```

## Test ideas

| Type       | Case                                     | Expected                     |
| ---------- | ---------------------------------------- | ---------------------------- |
| Happy path | After an edit, `limit=1`                 | The edit's entry first       |
| Boundary   | 25 entries: page 1 then page 2           | 20 then 5, `nextCursor` null |
| Negative   | `limit=101`; cursor from another project | 400; 400                     |
| Security   | PATCH or DELETE on the path              | 404 route not found          |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
