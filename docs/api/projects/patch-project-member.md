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
    [US-PROJECT-05, US-PROJECT-13, BR-PROJECT-12, BR-PROJECT-13, BR-PROJECT-23, BR-PROJECT-24]
  acceptance:
    [AC-PROJECT-25, AC-PROJECT-27, AC-PROJECT-48, AC-PROJECT-49, AC-PROJECT-50, AC-PROJECT-51]
  design: [FLW-PROJECT-02, SCR-PROJECT-03, DD-PROJECT-01]
updated: 2026-10-08
---

# PATCH /api/projects/:key/members/:userId

Changes a member's project role. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| **Auth**        | Project role: Owner, Project manager, QA lead (or Admin); Owner rules in BR-PROJECT-23 and BR-PROJECT-24 |
| **Since phase** | 3                                                                                                        |
| **Schema**      | `packages/shared/src/projects.ts` (`memberUpdateSchema`)                                                 |

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

| Field  | Type        | Required | Rules        |
| ------ | ----------- | -------- | ------------ |
| `role` | ProjectRole | yes      | The new role |

```json
{ "role": "QA_ENGINEER" }
```

## Responses

### 200 OK

```json
{
  "data": {
    "userId": "cm…",
    "name": "Linh QA",
    "email": "linh@qawm.test",
    "role": "QA_ENGINEER",
    "addedAt": "2026-09-01T08:00:00.000Z"
  }
}
```

| Field     | Type              | Description                                |
| --------- | ----------------- | ------------------------------------------ |
| `userId`  | string            | User id                                    |
| `name`    | string            | Display name                               |
| `email`   | string            | Email (members can see each other's email) |
| `role`    | ProjectRole       | One of the 8 project roles                 |
| `addedAt` | string (ISO 8601) | When the person joined                     |

No `version`: a role is one value and the last-Owner check runs inside the transaction.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                   | `messageId`    | When                                                                                                     |
| ------ | ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09  | Body is not `application/json`                                                                           |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`                       |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05  | Not logged in                                                                                            |
| 404    | `NOT_FOUND`              | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not an Admin (same body for both, ADR-0008)               |
| 403    | `FORBIDDEN`              | MSG-COMMON-06  | Role does not allow it, or a non-Owner touches an Owner (BR-PROJECT-23)                                  |
| 422    | `PROJECT_ARCHIVED`       | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                                  |
| 404    | `NOT_FOUND`              | MSG-COMMON-07  | `userId` is not a member                                                                                 |
| 422    | `OWN_ROLE`               | MSG-PROJECT-22 | Caller changes their own role, unless an Owner stepping down while another Owner remains (BR-PROJECT-24) |
| 422    | `LAST_OWNER`             | MSG-PROJECT-12 | The change would leave no Owner (BR-PROJECT-12)                                                          |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008); `userId` must be a member of this project |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                                                  |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only `role`                                                                                                                                       |
| API4 Unrestricted resource consumption                                           | One update per call                                                                                                                               |
| API5 Broken function level authorization                                         | `member:manage` / `member:manage-owner`; own-role rule                                                                                            |

## Side effects

Idempotent: the same role again returns 200 with no activity entry. A real change writes the row and one activity entry `member.role_changed`. The member's next request uses the new role (BR-PROJECT-13).

## Example

```bash
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/projects/SHOP/members/<id> -H 'Content-Type: application/json' -d '{"role":"VIEWER"}'
```

## Test ideas

| Type       | Case                                                        | Expected                               |
| ---------- | ----------------------------------------------------------- | -------------------------------------- |
| Happy path | Owner changes Viewer → QA engineer; that user calls the API | 200; their next call uses the new role |
| Negative   | QA lead changes own role                                    | 422 `OWN_ROLE`                         |
| Boundary   | Only Owner demotes self; one of two Owners demotes self     | 422 `LAST_OWNER`; 200                  |
| Permission | PM changes the Owner's role                                 | 403                                    |

## Change log

| Date       | Change                                               | Why      |
| ---------- | ---------------------------------------------------- | -------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR) | Phase 3A |
