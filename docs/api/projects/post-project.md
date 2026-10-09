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
      BR-ADMIN-18,
      BR-GUEST-02,
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
      AC-PROJECT-71,
      AC-PROJECT-72,
      AC-ADMIN-12,
    ]
  design: [FLW-PROJECT-01, SCR-ADMIN-02]
updated: 2026-10-09
---

# POST /api/projects

Creates a project with its first Project admin; only a System admin may call it (BR-PROJECT-01, FLW-PROJECT-01). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                            |
| --------------- | -------------------------------------------------------------------------- |
| **Auth**        | System admin (global role `ADMIN`) only; anyone else gets 403              |
| **Since phase** | 3                                                                          |
| **Schema**      | `packages/shared/src/projects.ts` (`projectCreateSchema`, `projectSchema`) |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field          | Type           | Required | Rules                                                                                                   |
| -------------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `key`          | string         | yes      | Trimmed and upper-cased, then `^[A-Z][A-Z0-9]{1,9}$` (MSG-PROJECT-01, MSG-PROJECT-02)                   |
| `firstAdminId` | string         | yes      | Id of an existing user, who becomes the first Project admin; missing, empty or unknown → MSG-PROJECT-33 |
| `name`         | string         | yes      | Trimmed, 3–100 characters (MSG-PROJECT-03)                                                              |
| `description`  | string \| null | no       | At most 2000 characters (MSG-PROJECT-05)                                                                |

```json
{ "key": "demo", "firstAdminId": "cm…", "name": "Demo project", "description": "Practice project" }
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
    "myAccess": null,
    "memberCount": 1,
    "activeRelease": null,
    "activeMilestone": null,
    "guestAreas": ["dashboard", "releases"],
    "createdBy": {
      "id": "cm…",
      "name": "Ada Admin"
    },
    "createdAt": "2026-09-01T08:00:00.000Z",
    "updatedAt": "2026-10-08T13:40:00.000Z"
  }
}
```

| Field                   | Type                          | Description                                                                                               |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `key`                   | string                        | Project key, upper-case (BR-PROJECT-02)                                                                   |
| `name`                  | string                        | Display name                                                                                              |
| `description`           | string \| null                | Description                                                                                               |
| `archivedAt`            | string (ISO 8601) \| null     | When it was archived; `null` = active                                                                     |
| `version`               | integer                       | Send back on `PATCH` (DD-PROJECT-03)                                                                      |
| `myAccess`              | ProjectAccess \| null         | Caller's access level (`PROJECT_ADMIN`, `MEMBER`, `GUEST`); `null` for a System admin who is not a member |
| `memberCount`           | integer                       | Number of members                                                                                         |
| `activeRelease`         | { id, name } \| null          | The `ACTIVE` release                                                                                      |
| `activeMilestone`       | { id, name, endDate } \| null | The `ACTIVE` milestone (header "days left")                                                               |
| `guestAreas`            | string[]                      | Areas a Guest of this project may see (BR-GUEST-02)                                                       |
| `createdBy`             | { id, name }                  | Creator                                                                                                   |
| `createdAt / updatedAt` | string (ISO 8601)             | Timestamps (UTC)                                                                                          |

Header `Location: /api/projects/DEMO`. Unknown body fields are rejected (400), so a client can't set `version`, `archivedAt` or `createdBy`.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                   | `messageId`    | When                                                                                                                                         |
| ------ | ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09  | Body is not `application/json`                                                                                                               |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04  | Body or query fails the schema; `errors` lists each field with its own `messageId`                                                           |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05  | Not logged in                                                                                                                                |
| 403    | `FORBIDDEN`              | MSG-ADMIN-09   | The caller is not a System admin (BR-PROJECT-01)                                                                                             |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04  | `firstAdminId` is not an existing, active user (unknown or deactivated, BR-ADMIN-18): one field error at `/firstAdminId` with MSG-PROJECT-33 |
| 409    | `KEY_TAKEN`              | MSG-PROJECT-04 | Key used by any project, archived or not, visible to the caller or not (BR-PROJECT-03)                                                       |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                      |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Not applicable: no existing object in the request                                                                 |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                  |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict schema: only `key`, `firstAdminId`, `name`, `description`; `firstAdminId` must be an existing, active user |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; one insert per call                                                                         |
| API5 Broken function level authorization                                         | System admins only; 403 for everyone else (BR-PROJECT-01)                                                         |

## Side effects

Not idempotent: a second identical call gets 409 `KEY_TAKEN`. Writes `projects`, one `project_members` row for the first Project admin (`access` `PROJECT_ADMIN`, no job title) and two activity entries, `project.created` and `member.added` ("Ada Admin added Oanh Owner as Project admin"), in one transaction. `guest_areas` is copied from `workspace_settings.default_guest_areas` (BR-GUEST-02, set with
[PUT /api/admin/settings](../admin/put-settings.md)). The System admin is not added as a member unless they pick themselves.

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/projects -H 'Content-Type: application/json' -d '{"key":"demo","firstAdminId":"<user id>","name":"Demo project"}'
```

## Test ideas

| Type       | Case                                                | Expected                                                                          |
| ---------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Happy path | Ada Admin, new key, Oanh Owner as first admin       | 201, `key` upper-case, `myAccess` null, Oanh is Project admin, 2 activity entries |
| Negative   | Existing key `SHOP`; `SECRET` as Ada Admin          | 409 for both (no hiding on create)                                                |
| Negative   | `firstAdminId` missing, empty or unknown            | 400, MSG-PROJECT-33 at `/firstAdminId`                                            |
| Negative   | `firstAdminId` of the deactivated Hoa Inactive      | 400, MSG-PROJECT-33 at `/firstAdminId`, nothing created                           |
| Happy path | Workspace default Guest areas set to `members` only | 201, `guestAreas` `["members"]`                                                   |
| Permission | Linh QA (global `USER`) with a valid body           | 403, nothing created                                                              |
| Boundary   | Key 2/10/11 characters; name 3/100/101              | 201, 201, 400; 201, 201, 400                                                      |
| Security   | Body with `version: 99` or `createdById`            | 400                                                                               |

## Change log

| Date       | Change                                                                                                                                    | Why                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                                                                      | Phase 3A                                |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                                                   | Linh's decision 2026-10-09              |
| 2026-10-09 | Response has `guestAreas`; `myAccess` can be `GUEST`                                                                                      | Guest access (BR-GUEST-01, BR-GUEST-02) |
| 2026-10-09 | A deactivated `firstAdminId` is refused; the new project copies the workspace's default Guest areas; called from Admin console › Projects | BR-ADMIN-18, BR-GUEST-02                |
