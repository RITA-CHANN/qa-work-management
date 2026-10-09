---
id: API-PROJECT-10
title: PATCH /api/projects/:key/members/:userId
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
      US-PROJECT-05,
      US-PROJECT-14,
      BR-PROJECT-12,
      BR-PROJECT-13,
      BR-PROJECT-23,
      BR-PROJECT-24,
      BR-PROJECT-37,
    ]
  acceptance:
    [
      AC-PROJECT-25,
      AC-PROJECT-27,
      AC-PROJECT-48,
      AC-PROJECT-50,
      AC-PROJECT-51,
      AC-PROJECT-73,
      AC-PROJECT-75,
      AC-PROJECT-76,
    ]
  design: [FLW-PROJECT-02, SCR-PROJECT-03, DD-PROJECT-01]
updated: 2026-10-09
---

# PATCH /api/projects/:key/members/:userId

Changes a member's access level, job title, or both. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                          |
| --------------- | ------------------------------------------------------------------------ |
| **Auth**        | Project admin (or System admin); own access level rules in BR-PROJECT-24 |
| **Since phase** | 3                                                                        |
| **Schema**      | `packages/shared/src/projects.ts` (`memberUpdateSchema`)                 |

## Request

### Path parameters

| Name     | Type   | Description                                     |
| -------- | ------ | ----------------------------------------------- |
| `key`    | string | Project key, case-insensitive (`shop` = `SHOP`) |
| `userId` | string | The member to change                            |

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

Both fields are optional; a field left out stays as it is.

| Field      | Type             | Required | Rules                                                                                                             |
| ---------- | ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `access`   | ProjectAccess    | no       | `PROJECT_ADMIN` or `MEMBER` (BR-PROJECT-35)                                                                       |
| `jobTitle` | JobTitle \| null | no       | One of `QAE`, `QAL`, `QAA`, `PM`, `PO`, `BA`, `DEV`, `TL`, `DES`, `STK`, `OTH`; `null` removes it (BR-PROJECT-37) |

```json
{ "access": "PROJECT_ADMIN", "jobTitle": "QAL" }
```

## Responses

### 200 OK

```json
{
  "data": {
    "userId": "cm…",
    "name": "Linh QA",
    "email": "linh@qawm.test",
    "access": "PROJECT_ADMIN",
    "jobTitle": "QAL",
    "addedAt": "2026-09-01T08:00:00.000Z"
  }
}
```

| Field      | Type              | Description                                |
| ---------- | ----------------- | ------------------------------------------ |
| `userId`   | string            | User id                                    |
| `name`     | string            | Display name                               |
| `email`    | string            | Email (members can see each other's email) |
| `access`   | ProjectAccess     | `PROJECT_ADMIN` or `MEMBER`                |
| `jobTitle` | JobTitle \| null  | Job title key, or `null` for none          |
| `addedAt`  | string (ISO 8601) | When the person joined                     |

No `version`: each field is one value and the last-Project-admin check runs inside the transaction.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                   | `messageId`    | When                                                                                                  |
| ------ | ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09  | Body is not `application/json`                                                                        |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`                    |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05  | Not logged in                                                                                         |
| 404    | `NOT_FOUND`              | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008)      |
| 403    | `FORBIDDEN`              | MSG-COMMON-06  | The caller is a Member (BR-PROJECT-23)                                                                |
| 422    | `PROJECT_ARCHIVED`       | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                               |
| 404    | `NOT_FOUND`              | MSG-COMMON-07  | `userId` is not a member                                                                              |
| 422    | `OWN_ACCESS`             | MSG-PROJECT-22 | Caller changes their own access level, unless a Project admin stepping down to Member (BR-PROJECT-24) |
| 422    | `LAST_PROJECT_ADMIN`     | MSG-PROJECT-12 | The change would leave no Project admin (BR-PROJECT-12)                                               |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008); `userId` must be a member of this project |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                                                  |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only `access` and `jobTitle`                                                                                                                      |
| API4 Unrestricted resource consumption                                           | One update per call                                                                                                                               |
| API5 Broken function level authorization                                         | `member:manage` (Project admin); own access level rule (BR-PROJECT-24); a job title gives no rights                                               |

## Side effects

Idempotent: a body that changes nothing (same values, or `{}`) returns 200 with the current member and no activity
entry. A real change writes the row and one activity entry `member.updated`, whose `changes` hold only the changed
fields (`access`, `jobTitle`, each `{ from, to }`) and whose summary has one clause per changed field, for example
"Oanh Owner changed Linh QA's access from Member to Project admin and job title from QA engineer to QA lead" (no job
title reads "none"). The member's next request uses the new access level (BR-PROJECT-13).

## Example

```bash
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/projects/SHOP/members/<id> -H 'Content-Type: application/json' -d '{"jobTitle":"QAL"}'
```

## Test ideas

| Type       | Case                                                                             | Expected                                                                |
| ---------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Happy path | Project admin changes a Member to Project admin; that user calls the API         | 200; their next call uses the new access level                          |
| Happy path | Change only `jobTitle`, then set it to `null`                                    | 200; `access` unchanged; summaries "job title from … to …", "… to none" |
| Negative   | System admin who is a Member of the project sets own `access` to `PROJECT_ADMIN` | 422 `OWN_ACCESS`                                                        |
| Boundary   | Only Project admin steps down to Member; one of two Project admins steps down    | 422 `LAST_PROJECT_ADMIN`; 200                                           |
| Boundary   | Body `{}` or the same values                                                     | 200, no activity entry                                                  |
| Permission | A Member (any job title) changes someone                                         | 403                                                                     |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
