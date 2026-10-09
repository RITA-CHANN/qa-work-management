---
id: API-ADMIN-05
title: GET /api/admin/users/:id
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-01, BR-ADMIN-06]
  acceptance: [AC-ADMIN-14]
  design: [SCR-ADMIN-03]
updated: 2026-10-09
---

# GET /api/admin/users/:id

One user with their projects and the number of active sessions: the detail panel of Admin console › Users
(SCR-ADMIN-03). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`adminUserDetailSchema`)                             |

## Request

### Path parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| `id` | string | User id     |

## Responses

### 200 OK

An [AdminUser](get-users.md#200-ok) plus `projects` and `activeSessions`.

```json
{
  "data": {
    "id": "cm…",
    "name": "Linh QA",
    "email": "linh@qawm.test",
    "globalRole": "USER",
    "status": "ACTIVE",
    "mustChangePassword": false,
    "projectCount": 3,
    "lastSignInAt": "2026-10-09T07:00:00.000Z",
    "createdAt": "2026-10-07T08:00:00.000Z",
    "projects": [
      { "key": "SHOP", "name": "ShopEase Web", "role": "QA_ENGINEER", "archived": false }
    ],
    "activeSessions": 2
  }
}
```

| Field            | Type                            | Description                                                    |
| ---------------- | ------------------------------- | -------------------------------------------------------------- |
| `projects`       | { key, name, role, archived }[] | Every membership, archived projects included, sorted by name   |
| `activeSessions` | integer                         | Sessions of the user that have not expired (signed-in devices) |

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |
| 404    | `NOT_FOUND`                | MSG-ADMIN-16  | No user with this id                                                          |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Admin-only; any user id is allowed by design                                               |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                     |
| API3 Broken object property level authorization (data exposure, mass assignment) | A session count only; never session tokens, IPs or the password hash                       |
| API4 Unrestricted resource consumption                                           | One query by primary key                                                                   |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01) |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b admin-cookies.txt http://localhost:3000/api/admin/users/cm123
```

## Test ideas

| Type       | Case                        | Expected                                      |
| ---------- | --------------------------- | --------------------------------------------- |
| Happy path | Linh's id                   | Her projects with roles; `activeSessions` ≥ 1 |
| Negative   | Made-up id                  | 404 MSG-ADMIN-16                              |
| Session    | After "Sign out everywhere" | `activeSessions` 0                            |
| Permission | Linh asks for her own id    | 404 MSG-COMMON-08                             |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
