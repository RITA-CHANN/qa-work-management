---
id: API-PROJECT-02
title: POST /api/projects
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
      US-PROJECT-01,
      BR-PROJECT-01,
      BR-PROJECT-02,
      BR-PROJECT-03,
      BR-PROJECT-04,
      BR-PROJECT-05,
      BR-PROJECT-19,
    ]
  acceptance:
    [
      AC-PROJECT-68,
      AC-PROJECT-01,
      AC-PROJECT-02,
      AC-PROJECT-03,
      AC-PROJECT-04,
      AC-PROJECT-05,
      AC-PROJECT-06,
      AC-PROJECT-07,
      AC-PROJECT-08,
    ]
  design: [FLW-PROJECT-01, SCR-PROJECT-01]
updated: 2026-10-08
---

# POST /api/projects

Creates a project; the caller becomes its Owner (FLW-PROJECT-01). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                            |
| --------------- | -------------------------------------------------------------------------- |
| **Auth**        | Logged in                                                                  |
| **Since phase** | 3                                                                          |
| **Schema**      | `packages/shared/src/projects.ts` (`projectCreateSchema`, `projectSchema`) |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field         | Type           | Required | Rules                                                                                 |
| ------------- | -------------- | -------- | ------------------------------------------------------------------------------------- |
| `key`         | string         | yes      | Trimmed and upper-cased, then `^[A-Z][A-Z0-9]{1,9}$` (MSG-PROJECT-01, MSG-PROJECT-02) |
| `name`        | string         | yes      | Trimmed, 3–100 characters (MSG-PROJECT-03)                                            |
| `description` | string \| null | no       | At most 2000 characters (MSG-PROJECT-05)                                              |

```json
{ "key": "demo", "name": "Demo project", "description": "Practice project" }
```

## Responses

### 201 Created

```json
{
  "data": {
    "key": "DEMO",
    "name": "Demo project",
    "description": "Practice project",
    "archivedAt": null,
    "version": 1,
    "myRole": "OWNER",
    "memberCount": 1,
    "activeRelease": null,
    "activeMilestone": null,
    "createdBy": {
      "id": "cm…",
      "name": "Oanh Owner"
    },
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-10-08T13:40:00.000Z"
  }
}
```

| Field                   | Type                          | Description                                            |
| ----------------------- | ----------------------------- | ------------------------------------------------------ |
| `key`                   | string                        | Project key, upper-case (BR-PROJECT-02)                |
| `name`                  | string                        | Display name                                           |
| `description`           | string \| null                | Description                                            |
| `archivedAt`            | string (ISO 8601) \| null     | When it was archived; `null` = active                  |
| `version`               | integer                       | Send back on `PATCH` (DD-PROJECT-03)                   |
| `myRole`                | ProjectRole \| null           | Caller's role; `null` for an Admin who is not a member |
| `memberCount`           | integer                       | Number of members                                      |
| `activeRelease`         | { id, name } \| null          | The `ACTIVE` release                                   |
| `activeMilestone`       | { id, name, endDate } \| null | The `ACTIVE` milestone (header "days left")            |
| `createdBy`             | { id, name }                  | Creator                                                |
| `createdAt / updatedAt` | string (ISO 8601)             | Timestamps (UTC)                                       |

Header `Location: /api/projects/DEMO`. Unknown body fields are rejected (400), so a client can't set `version`, `archivedAt` or `createdBy`.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                   | `messageId`    | When                                                                                   |
| ------ | ------------------------ | -------------- | -------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09  | Body is not `application/json`                                                         |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`     |
| 409    | `KEY_TAKEN`              | MSG-PROJECT-04 | Key used by any project, archived or not, visible to the caller or not (BR-PROJECT-03) |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05  | Not logged in                                                                          |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                     |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Not applicable: no existing object in the request                                |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                 |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict schema: only `key`, `name`, `description`; the Owner is always the caller |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; one insert per call                                        |
| API5 Broken function level authorization                                         | Any logged-in user (BR-PROJECT-01)                                               |

## Side effects

Not idempotent: a second identical call gets 409 `KEY_TAKEN`. Writes `projects`, one `project_members` row (`OWNER`) and one activity entry `project.created`, in one transaction.

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/projects -H 'Content-Type: application/json' -d '{"key":"demo","name":"Demo project"}'
```

## Test ideas

| Type       | Case                                     | Expected                                              |
| ---------- | ---------------------------------------- | ----------------------------------------------------- |
| Happy path | New key                                  | 201, `key` upper-case, `myRole` OWNER, activity entry |
| Negative   | Existing key `SHOP`; `SECRET` as Linh    | 409 for both (no hiding on create)                    |
| Boundary   | Key 2/10/11 characters; name 3/100/101   | 201, 201, 400; 201, 201, 400                          |
| Security   | Body with `version: 99` or `createdById` | 400                                                   |

## Change log

| Date       | Change                                               | Why      |
| ---------- | ---------------------------------------------------- | -------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR) | Phase 3A |
