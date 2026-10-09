---
id: API-ADMIN-04
title: POST /api/admin/users
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-01, BR-ADMIN-07, BR-ADMIN-14, BR-ADMIN-16, BR-AUTH-01]
  acceptance: [AC-ADMIN-05, AC-ADMIN-20]
  design: [SCR-ADMIN-03, SCR-AUTH-03]
updated: 2026-10-09
---

# POST /api/admin/users

Creates a user account with a one-time password, which the response shows **once** (BR-ADMIN-07, MSG-ADMIN-02).
The Admin passes it on; the user must replace it at first sign-in ([API-AUTH-04](../auth/post-change-password.md)).
Status codes follow RFC 9110; errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`adminUserCreateSchema`, `oneTimePasswordSchema`)    |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field        | Type                | Required | Rules                                                                          |
| ------------ | ------------------- | -------- | ------------------------------------------------------------------------------ |
| `name`       | string              | yes      | Trimmed, 2–100 characters (MSG-ADMIN-11)                                       |
| `email`      | string              | yes      | Trimmed and lower-cased, then a valid email (MSG-AUTH-03, MSG-AUTH-04); unique |
| `globalRole` | `"ADMIN"`, `"USER"` | no       | Default `USER`                                                                 |

Unknown fields are rejected (400), so a client can't set `status`, `passwordHash` or `mustChangePassword`.

```json
{ "name": "Hoa Tran", "email": "Hoa@QAWM.test", "globalRole": "USER" }
```

## Responses

### 201 Created

```json
{
  "data": {
    "user": {
      "id": "cm…",
      "name": "Hoa Tran",
      "email": "hoa@qawm.test",
      "globalRole": "USER",
      "status": "ACTIVE",
      "mustChangePassword": true,
      "projectCount": 0,
      "lastSignInAt": null,
      "createdAt": "2026-10-09T09:00:00.000Z"
    },
    "oneTimePassword": "q7RkT2mZpX4wNcHd"
  }
}
```

| Field             | Type      | Description                                                                                                                  |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `user`            | AdminUser | The new account, see [GET /api/admin/users](get-users.md#200-ok); `mustChangePassword` is always `true`                      |
| `oneTimePassword` | string    | 16 random characters without look-alikes (no `0`, `O`, `o`, `1`, `I`, `i`, `l`). Not stored in plain text, never shown again |

No `Location` header.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09 | Body is not `application/json`                                                |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | Name, email or role invalid, or an unknown field; `errors` lists each field   |
| 409    | `EMAIL_TAKEN`              | MSG-ADMIN-01  | An account with this email exists, compared after lower-casing (AC-ADMIN-20)  |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Not applicable: no existing object in the request                                                         |
| API2 Broken authentication                                                       | One-time password from `crypto.randomBytes`, stored as an argon2id hash, must be changed at first sign-in |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict body; the password is in this response only; never in the audit log or server log                  |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; one insert per call                                                                 |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01)                |

## Side effects

Not idempotent: a second identical call gets 409 `EMAIL_TAKEN`. In one transaction (BR-ADMIN-16): inserts `users`
(`status` `ACTIVE`, `must_change_password` true) and an audit event `user.created` with `after` = name, email and
global role.

## Example

```bash
curl -i -b admin-cookies.txt http://localhost:3000/api/admin/users \
  -H 'Content-Type: application/json' -d '{"name":"Hoa Tran","email":"hoa@qawm.test"}'
```

## Test ideas

| Type       | Case                                                    | Expected                                                                                    |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Happy path | New email                                               | 201, `mustChangePassword` true, 16-character password                                       |
| Flow       | Sign in with the one-time password, `GET /api/projects` | 200 login with `mustChangePassword` true, then 403 `PASSWORD_CHANGE_REQUIRED` (AC-ADMIN-05) |
| Negative   | `Linh@QAWM.test`                                        | 409 `EMAIL_TAKEN`, MSG-ADMIN-01, no account (AC-ADMIN-20)                                   |
| Boundary   | Name of 1, 2, 100, 101 characters                       | 400, 201, 201, 400                                                                          |
| Security   | Body with `status` or `mustChangePassword`              | 400                                                                                         |
| Permission | Linh                                                    | 404                                                                                         |
| Audit      | `GET /api/admin/audit?action=user.created`              | Entry with the email, no password                                                           |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
