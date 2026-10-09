---
id: API-ADMIN-03
title: GET /api/admin/users
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-01, BR-ADMIN-06]
  acceptance: [AC-ADMIN-01, AC-ADMIN-14]
  design: [SCR-ADMIN-03]
updated: 2026-10-09
---

# GET /api/admin/users

Every user account, with filters, for Admin console › Users (SCR-ADMIN-03, BR-ADMIN-06). Status codes follow RFC
9110; errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`adminUserListQuerySchema`, `adminUserSchema`)       |

## Request

### Query parameters

| Name     | Type                        | Required | Default | Description                                                        |
| -------- | --------------------------- | -------- | ------- | ------------------------------------------------------------------ |
| `search` | string                      | no       | —       | Trimmed, 1–100 characters; matches name or email, case-insensitive |
| `role`   | `"ADMIN"`, `"USER"`         | no       | —       | Global role                                                        |
| `status` | `"ACTIVE"`, `"DEACTIVATED"` | no       | —       | Account status                                                     |

Filters combine with AND. Any other query parameter is rejected (400).

## Responses

### 200 OK

Sorted by name, then email. Not paginated.

```json
{
  "data": [
    {
      "id": "cm…",
      "name": "Hoa Inactive",
      "email": "inactive@qawm.test",
      "globalRole": "USER",
      "status": "DEACTIVATED",
      "mustChangePassword": false,
      "projectCount": 0,
      "lastSignInAt": null,
      "createdAt": "2026-10-09T08:00:00.000Z"
    }
  ]
}
```

| Field                | Type                          | Description                                               |
| -------------------- | ----------------------------- | --------------------------------------------------------- |
| `id`                 | string                        | User id                                                   |
| `name`               | string                        | Display name                                              |
| `email`              | string                        | Lower-case email                                          |
| `globalRole`         | `"ADMIN"` \| `"USER"`         | Global role                                               |
| `status`             | `"ACTIVE"` \| `"DEACTIVATED"` | Account status (BR-ADMIN-10)                              |
| `mustChangePassword` | boolean                       | Still has a one-time password (BR-ADMIN-07, BR-ADMIN-12)  |
| `projectCount`       | integer                       | Number of projects the user is a member of (archived too) |
| `lastSignInAt`       | string (ISO 8601) \| null     | Last successful sign-in; `null` = never                   |
| `createdAt`          | string (ISO 8601)             | When the account was created                              |

This `AdminUser` shape is also returned by the user write endpoints.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | Bad `role` or `status`, `search` empty or too long, or an unknown parameter   |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Admin-only list of every account, by design                                                |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                     |
| API3 Broken object property level authorization (data exposure, mass assignment) | Never `password_hash` or session data; emails are shown to Admins only                     |
| API4 Unrestricted resource consumption                                           | `search` at most 100 characters; one query                                                 |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01) |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b admin-cookies.txt 'http://localhost:3000/api/admin/users?status=DEACTIVATED'
```

## Test ideas

| Type       | Case                 | Expected                                |
| ---------- | -------------------- | --------------------------------------- |
| Happy path | Ada, no query        | Every seed user, sorted by name         |
| Filter     | `status=DEACTIVATED` | Only Hoa Inactive (AC-ADMIN-14)         |
| Filter     | `role=ADMIN`         | Only Ada Admin                          |
| Filter     | `search=QAWM.TEST`   | Every seed user (case-insensitive)      |
| Validation | `role=admin`; `x=1`  | 400                                     |
| Permission | Linh                 | 404 like an unknown route (AC-ADMIN-01) |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
