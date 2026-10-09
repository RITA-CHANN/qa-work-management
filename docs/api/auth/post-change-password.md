---
id: API-AUTH-04
title: POST /api/auth/change-password
type: api
feature: auth
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-07, BR-ADMIN-12, BR-ADMIN-14, BR-AUTH-12]
  acceptance: [AC-ADMIN-05, AC-ADMIN-16]
  design: [SCR-AUTH-03]
updated: 2026-10-09
---

# POST /api/auth/change-password

Replaces a one-time password with one the user chooses. Used by the "Set a new password" screen (SCR-AUTH-03)
after signing in with a password an Admin created or reset (BR-ADMIN-07, BR-ADMIN-12). Status codes follow RFC
9110; errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                          |
| --------------- | ------------------------------------------------------------------------ |
| **Auth**        | Logged in (also allowed while `mustChangePassword` is `true`)            |
| **Since phase** | 3 (3C)                                                                   |
| **Schema**      | `packages/shared/src/auth.ts` (`changePasswordSchema`, `authUserSchema`) |

While `mustChangePassword` is `true`, this endpoint and [GET /api/auth/me](get-me.md) are the only ones that
answer; every other endpoint that needs a session returns 403 `PASSWORD_CHANGE_REQUIRED` (MSG-ADMIN-07). A user
whose `mustChangePassword` is already `false` may still call it to change their password.

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field             | Type   | Required | Rules                                                                                                |
| ----------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `newPassword`     | string | yes      | 8–200 characters, never trimmed (MSG-ADMIN-12); must differ from the current password (MSG-ADMIN-14) |
| `confirmPassword` | string | yes      | Must equal `newPassword` (MSG-ADMIN-13, pointer `/confirmPassword`)                                  |

Unknown fields are rejected (400). The current password is not asked for: the session proves who the user is.

```json
{ "newPassword": "MyOwnPassword1", "confirmPassword": "MyOwnPassword1" }
```

## Responses

### 200 OK

The user, now with `mustChangePassword: false` (same shape as [POST /api/auth/login](post-login.md#200-ok)).

```json
{
  "data": {
    "id": "cm…",
    "email": "hoa@qawm.test",
    "name": "Hoa",
    "globalRole": "USER",
    "mustChangePassword": false
  }
}
```

The session that made the call stays valid; every **other** session of the user ends.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                   | `messageId`   | When                                                                                                 |
| ------ | ------------------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | MSG-COMMON-09 | Body is not `application/json`                                                                       |
| 401    | `UNAUTHENTICATED`        | MSG-COMMON-05 | Not logged in                                                                                        |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04 | Length, mismatch or unknown field; `errors` lists each field (MSG-ADMIN-12, MSG-ADMIN-13)            |
| 400    | `VALIDATION_ERROR`       | MSG-COMMON-04 | The new password equals the current one: one entry, pointer `/newPassword`, `messageId` MSG-ADMIN-14 |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Changes only the caller's own password, taken from the session; no user id in the request             |
| API2 Broken authentication                                                       | argon2id hash; other sessions end, so a session opened with the one-time password elsewhere is closed |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict body; the response never contains a password or hash (BR-AUTH-12)                              |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; password at most 200 characters (argon2 cost bounded)                           |
| API5 Broken function level authorization                                         | Any logged-in user, for their own account only                                                        |

## Side effects

Not idempotent: a second call with the same password gets 400 (MSG-ADMIN-14). In one transaction: writes
`users.password_hash`, sets `users.must_change_password = false`, deletes the user's other `sessions` and adds an
audit event `auth.password_changed` (target the user, the IP; never the password, BR-ADMIN-14).

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/auth/change-password \
  -H 'Content-Type: application/json' \
  -d '{"newPassword":"MyOwnPassword1","confirmPassword":"MyOwnPassword1"}'
```

## Test ideas

| Type       | Case                                                                  | Expected                                                         |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Happy path | Admin creates a user, user signs in with the one-time password, calls | 200, `mustChangePassword` false; `GET /api/projects` now 200     |
| Negative   | Before changing: `GET /api/projects`                                  | 403 `PASSWORD_CHANGE_REQUIRED`, MSG-ADMIN-07                     |
| Negative   | New password equals the one-time password                             | 400, pointer `/newPassword`, MSG-ADMIN-14                        |
| Boundary   | 7, 8, 200, 201 characters                                             | 400, 200, 200, 400                                               |
| Validation | `confirmPassword` differs                                             | 400, pointer `/confirmPassword`, MSG-ADMIN-13                    |
| Session    | Signed in on two contexts, change in one                              | The other context gets 401; this one keeps working               |
| Audit      | Admin opens the audit log                                             | `auth.password_changed` entry with the user's email, no password |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
