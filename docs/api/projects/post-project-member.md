---
id: API-PROJECT-09
title: POST /api/projects/:key/members
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
      BR-PROJECT-10,
      BR-PROJECT-11,
      BR-PROJECT-23,
      BR-PROJECT-37,
      BR-PROJECT-19,
    ]
  acceptance:
    [
      AC-PROJECT-69,
      AC-PROJECT-23,
      AC-PROJECT-24,
      AC-PROJECT-48,
      AC-PROJECT-67,
      AC-PROJECT-73,
      AC-PROJECT-75,
    ]
  design: [FLW-PROJECT-02, SCR-PROJECT-03, DD-PROJECT-01]
updated: 2026-10-09
---

# POST /api/projects/:key/members

Adds an existing user to the project with an access level and an optional job title. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                       |
| --------------- | --------------------------------------------------------------------- |
| **Auth**        | Project admin (or System admin)                                       |
| **Since phase** | 3                                                                     |
| **Schema**      | `packages/shared/src/projects.ts` (`memberAddSchema`, `memberSchema`) |

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

| Field      | Type             | Required | Rules                                                                                                                     |
| ---------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `userId`   | string           | yes      | An existing user (BR-PROJECT-11)                                                                                          |
| `access`   | ProjectAccess    | yes      | `PROJECT_ADMIN` or `MEMBER` (BR-PROJECT-35)                                                                               |
| `jobTitle` | JobTitle \| null | no       | One of `QAE`, `QAL`, `QAA`, `PM`, `PO`, `BA`, `DEV`, `TL`, `DES`, `STK`, `OTH`; left out or `null` = none (BR-PROJECT-37) |

```json
{ "userId": "cm…", "access": "MEMBER", "jobTitle": "STK" }
```

## Responses

### 201 Created

```json
{
  "data": {
    "userId": "cm…",
    "name": "Sam Stakeholder",
    "email": "stakeholder@qawm.test",
    "access": "MEMBER",
    "jobTitle": "STK",
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

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                   | `messageId`    | When                                                                                             |
| ------ | ------------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09  | Body is not `application/json`                                                                   |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`               |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`              | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 403    | `FORBIDDEN`              | MSG-COMMON-06  | The caller is a Member (BR-PROJECT-23)                                                           |
| 422    | `PROJECT_ARCHIVED`       | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                          |
| 404    | `NOT_FOUND`              | MSG-COMMON-07  | `userId` is not a user                                                                           |
| 409    | `ALREADY_MEMBER`         | MSG-PROJECT-11 | The user is already a member (BR-PROJECT-10)                                                     |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only `userId`, `access` and `jobTitle`                                                                 |
| API4 Unrestricted resource consumption                                           | One insert per call                                                                                    |
| API5 Broken function level authorization                                         | `member:manage` (Project admin); a job title gives no rights                                           |

## Side effects

Not idempotent: the second identical call gets 409. Writes one `project_members` row and one activity entry `member.added`, for example "Oanh Owner added Sam Stakeholder as Member (Stakeholder)" (the job title in brackets only when one is set).

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/projects/SHOP/members -H 'Content-Type: application/json' -d '{"userId":"<id>","access":"MEMBER","jobTitle":"QAE"}'
```

## Test ideas

| Type       | Case                                                                        | Expected                                                            |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Happy path | Project admin adds a Member with job title `STK`; another with no job title | 201, activity entries "… as Member (Stakeholder)" and "… as Member" |
| Negative   | Add an existing member                                                      | 409 `ALREADY_MEMBER`                                                |
| Happy path | Project admin adds someone as `PROJECT_ADMIN`                               | 201 (any Project admin may add Project admins, BR-PROJECT-23)       |
| Permission | A Member (job title `QAL` or `DEV`) adds anyone                             | 403                                                                 |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
