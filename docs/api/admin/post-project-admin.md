---
id: API-ADMIN-12
title: POST /api/admin/projects/:key/project-admin
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements:
    [
      US-ADMIN-03,
      BR-ADMIN-01,
      BR-ADMIN-04,
      BR-ADMIN-10,
      BR-ADMIN-14,
      BR-ADMIN-16,
      BR-PROJECT-08,
      BR-PROJECT-12,
    ]
  acceptance: [AC-ADMIN-09]
  design: [SCR-ADMIN-02, DD-PROJECT-02]
updated: 2026-10-09
---

# POST /api/admin/projects/:key/project-admin

Makes a chosen user Project admin of a project, adding them as a member if needed, and optionally turns the current
Project admins into Members in the same step (BR-ADMIN-04). Used by "Change project admin" in Admin console ›
Projects (SCR-ADMIN-02), for example when a project's only Project admin has left. Status codes follow RFC 9110;
errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`changeProjectAdminSchema`), `memberSchema`          |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

### Body

| Field           | Type    | Required | Rules                                                                                   |
| --------------- | ------- | -------- | --------------------------------------------------------------------------------------- |
| `userId`        | string  | yes      | Id of an active user (BR-ADMIN-10); a member of the project or not                      |
| `demoteCurrent` | boolean | no       | Default `false`. `true` turns every other Project admin into a Member (job titles stay) |

Unknown fields are rejected (400).

```json
{ "userId": "cm…", "demoteCurrent": true }
```

## Responses

### 200 OK

The project's members after the change, as in [GET /api/projects/:key/members](../projects/get-project-members.md#200-ok)
(Project admins first, then by name).

```json
{
  "data": [
    {
      "userId": "cm…",
      "name": "Linh QA",
      "email": "linh@qawm.test",
      "access": "PROJECT_ADMIN",
      "jobTitle": "QAE",
      "addedAt": "2026-09-01T08:00:00.000Z"
    }
  ]
}
```

The chosen user keeps their job title; a user added by this call has none. If they are already Project admin and
`demoteCurrent` is `false`, nothing changes and the call still returns 200. The project always keeps at least one
Project admin, the chosen user (BR-ADMIN-04, BR-PROJECT-12).

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`    | When                                                                               |
| ------ | -------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09  | Body is not `application/json`                                                     |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05  | Not logged in                                                                      |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07   | Signed in with a one-time password not yet replaced                                |
| 404    | `NOT_FOUND`                | MSG-COMMON-08  | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01)      |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04  | `userId` missing or empty, `demoteCurrent` not a boolean, or an unknown field      |
| 404    | `NOT_FOUND`                | MSG-PROJECT-06 | No project with this key                                                           |
| 422    | `PROJECT_ARCHIVED`         | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                            |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04  | `userId` is unknown or deactivated: one field error at `/userId` with MSG-ADMIN-17 |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                       |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Admin-only; a System admin may manage every project (BR-PROJECT-36)                                |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                             |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict body with `userId` and `demoteCurrent` only; the access level set is always `PROJECT_ADMIN` |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; one transaction per call, bounded by the number of Project admins            |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01)         |

## Side effects

Idempotent: a repeat finds nothing left to change. In one transaction that locks the project row (BR-ADMIN-16):

| Situation                                     | Writes                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| The user is not a member                      | `project_members` row with `access` `PROJECT_ADMIN`; activity entry `member.added`             |
| The user is a Member or Guest                 | `project_members.access` → `PROJECT_ADMIN`; activity entry `member.updated` (`changes.access`) |
| `demoteCurrent`, for each other Project admin | `project_members.access` → `MEMBER`; activity entry `member.updated` (`changes.access`)        |

Each activity entry is also an audit event with the same action (`recordActivity` with `audit: true`,
DD-PROJECT-02), marked `actedAs = ADMIN` when the System admin is not a member of the project (BR-ADMIN-14).
Sessions are not touched; the new access level applies on each user's next request.

## Example

```bash
curl -i -b admin-cookies.txt http://localhost:3000/api/admin/projects/TEST1/project-admin \
  -H 'Content-Type: application/json' -d '{"userId":"cm123","demoteCurrent":true}'
```

## Test ideas

| Type       | Case                                                                              | Expected                                                                                           |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Happy path | Test project with Project admins Oanh and Mai, Member Linh; Linh, `demoteCurrent` | 200; Linh the only Project admin, Oanh and Mai Members; 3 activity and audit entries (AC-ADMIN-09) |
| Happy path | User not in the project, `demoteCurrent` false                                    | 200; added as Project admin; the old Project admins stay                                           |
| Negative   | Same call twice                                                                   | 200 twice; the second writes nothing                                                               |
| Negative   | `userId` of the deactivated Hoa Inactive; a made-up id                            | 400, MSG-ADMIN-17 at `/userId`                                                                     |
| Negative   | Archived project OLD; unknown key                                                 | 422 `PROJECT_ARCHIVED`; 404 MSG-PROJECT-06                                                         |
| Permission | Linh (global role User), even as Project admin of the project                     | 404 MSG-COMMON-08                                                                                  |
| Validation | `{}`; `{"userId":"x","access":"MEMBER"}`                                          | 400                                                                                                |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
