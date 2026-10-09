---
id: API-ADMIN-09
title: POST /api/admin/users/:id/reset-password
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-01, BR-ADMIN-12, BR-ADMIN-14, BR-ADMIN-16]
  acceptance: [AC-ADMIN-16]
  design: [SCR-ADMIN-03]
updated: 2026-10-09
---

# POST /api/admin/users/:id/reset-password

Gives a user a new one-time password, shown once (MSG-ADMIN-02), ends all their sessions and forces a password change at the next sign-in (BR-ADMIN-12). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------- |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404)           |
| **Since phase** | 3 (3C)                                                                                         |
| **Schema**      | `packages/shared/src/admin.ts` (`emptyBodySchema` from `projects.ts`, `oneTimePasswordSchema`) |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Path parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| `id` | string | User id     |

### Body

Empty object `{}`; any field is rejected (400).

## Responses

### 200 OK

Same body as [POST /api/admin/users](post-user.md#201-created): `{ user, oneTimePassword }`, with
`user.mustChangePassword: true`.

There is no self check: an Admin who resets their own password also ends their own session (next request 401).
A deactivated user can be reset; they still can't sign in until reactivated.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09 | Body is not `application/json`                                                |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | The body has a field                                                          |
| 404    | `NOT_FOUND`                | MSG-ADMIN-16  | No user with this id                                                          |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                       |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Admin-only; any user by design                                                                     |
| API2 Broken authentication                                                       | All sessions end; the new password is random, hashed with argon2id and must be replaced at sign-in |
| API3 Broken object property level authorization (data exposure, mass assignment) | Empty strict body; the password appears in this response only, never in the audit or server log    |
| API4 Unrestricted resource consumption                                           | One hash and one update per call                                                                   |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01)         |

## Side effects

Not idempotent: each call issues a different password. In one transaction (BR-ADMIN-16): writes
`users.password_hash`, sets `must_change_password = true`, deletes every `sessions` row of the user and adds an
audit event `user.password_reset` (no password in it).

## Example

```bash
curl -i -b admin-cookies.txt -X POST http://localhost:3000/api/admin/users/cm123/reset-password \
  -H 'Content-Type: application/json' -d '{}'
```

## Test ideas

| Type       | Case                         | Expected                                                                                                     |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Happy path | Signed-in test user          | 200 with a new password; their session gets 401; login with it gives `mustChangePassword` true (AC-ADMIN-16) |
| Negative   | Old password after the reset | 401 MSG-AUTH-01                                                                                              |
| Negative   | Made-up id                   | 404 MSG-ADMIN-16                                                                                             |
| Audit      | Read the audit log           | `user.password_reset`, no password anywhere                                                                  |
| Permission | Linh                         | 404 MSG-COMMON-08                                                                                            |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
