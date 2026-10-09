---
id: API-AUTH-01
title: POST /api/auth/login
type: api
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
traces:
  requirements:
    [
      US-AUTH-01,
      US-AUTH-06,
      BR-AUTH-01,
      BR-AUTH-02,
      BR-AUTH-03,
      BR-AUTH-04,
      BR-AUTH-12,
      BR-AUTH-13,
      BR-AUTH-14,
      BR-AUTH-15,
      BR-ADMIN-07,
      BR-ADMIN-10,
      BR-ADMIN-14,
    ]
  acceptance:
    [
      AC-AUTH-01,
      AC-AUTH-02,
      AC-AUTH-03,
      AC-AUTH-05,
      AC-AUTH-06,
      AC-AUTH-10,
      AC-AUTH-11,
      AC-AUTH-12,
      AC-AUTH-13,
      AC-AUTH-29,
      AC-AUTH-30,
      AC-AUTH-32,
      AC-ADMIN-05,
      AC-ADMIN-07,
      AC-ADMIN-10,
    ]
  design: [SCR-AUTH-01, SCR-AUTH-03, DD-AUTH-01, DD-AUTH-02]
updated: 2026-10-09
---

# POST /api/auth/login

Checks an email and password and, if they match, starts a session and sets the session cookie. Used by the
login screen (SCR-AUTH-01) and by API tests that need a logged-in `request` context.

|                 |                                                                        |
| --------------- | ---------------------------------------------------------------------- |
| **Auth**        | None                                                                   |
| **Since phase** | 2                                                                      |
| **Schema**      | `packages/shared/src/auth.ts` (`loginRequestSchema`, `authUserSchema`) |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field      | Type   | Required | Rules                                                                                   |
| ---------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| `email`    | string | yes      | Trimmed and lower-cased before use, then must be a valid email (BR-AUTH-01, BR-AUTH-02) |
| `password` | string | yes      | At least 1 character, at most 200. Never trimmed, never logged (BR-AUTH-12)             |

```json
{ "email": "linh@qawm.test", "password": "Password123!" }
```

## Responses

### 200 OK

Logged in. The body is the user; the session token is only in the cookie (BR-AUTH-15).

```json
{
  "data": {
    "id": "cmg1x2y3z0000abcd1234efgh",
    "email": "linh@qawm.test",
    "name": "Linh QA",
    "globalRole": "USER",
    "mustChangePassword": false
  }
}
```

| Field                | Type                  | Description                                                                                                                                                               |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                 | string (cuid)         | User id                                                                                                                                                                   |
| `email`              | string                | Lower-case email                                                                                                                                                          |
| `name`               | string                | Shown in the account menu                                                                                                                                                 |
| `globalRole`         | `"ADMIN"` \| `"USER"` | Global role (Phase 2)                                                                                                                                                     |
| `mustChangePassword` | boolean               | `true` after signing in with a one-time password (BR-ADMIN-07, BR-ADMIN-12). The web app then opens SCR-AUTH-03; the API answers 403 `PASSWORD_CHANGE_REQUIRED` elsewhere |

### Response headers

| Header         | Value                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Set-Cookie`   | `qawm_sid=<token>; Max-Age=604800; Path=/; Expires=<now + 7 days>; HttpOnly; SameSite=Lax` (+ `Secure` in production) |
| `X-Request-Id` | Request id                                                                                                            |

If the request already carried a valid `qawm_sid`, that old session is deleted and replaced by the new one.

### Errors

Checked in this order: content type, body, rate limit, credentials.

| Status | `code`                   | `detail`                                                 | When                                                                                                                                           |
| ------ | ------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | `Content-Type must be application/json`                  | Missing or other content type                                                                                                                  |
| 400    | `VALIDATION_ERROR`       | `Request validation failed`                              | Missing field or bad email. `errors` lists each field. Not counted as a failure                                                                |
| 429    | `RATE_LIMITED`           | `Too many login attempts. Please try again later.`       | 5 failures for this email in the window (BR-AUTH-04). Not counted again                                                                        |
| 401    | `UNAUTHENTICATED`        | `Invalid email or password`                              | Unknown email **or** wrong password: same status, code and message (BR-AUTH-03)                                                                |
| 403    | `ACCOUNT_DEACTIVATED`    | `This account is deactivated. Contact an administrator.` | Right password, but the account is deactivated (MSG-ADMIN-06, BR-ADMIN-10). Checked after the password, so it never reveals which emails exist |

Errors are RFC 9457 problem details (see the [API README](../README.md#error-format)):

```json
{
  "type": "https://qawm.test/problems/validation-error",
  "title": "Validation error",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/auth/login",
  "code": "VALIDATION_ERROR",
  "messageId": "MSG-COMMON-04",
  "errors": [
    { "pointer": "/email", "detail": "Enter a valid email address", "messageId": "MSG-AUTH-04" }
  ],
  "requestId": "…"
}
```

The web app shows MSG-AUTH-01 for 401 and MSG-AUTH-02 for 429. The 400 `errors[].detail` texts are the same texts
as the field messages MSG-AUTH-03, MSG-AUTH-04 and MSG-AUTH-05.

## Security

| Risk (OWASP API Security Top 10, 2023)   | How this endpoint handles it                                                                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API1 Object level authorization          | Not applicable: no object id in the request                                                                                                               |
| API2 Broken authentication               | argon2id; same 401 for unknown email and wrong password, with equal timing (BR-AUTH-03); per-email rate limit (BR-AUTH-04); new session id at every login |
| API3 Object property level authorization | The response has only `id`, `email`, `name`, `globalRole`; never `password_hash` or the token (BR-AUTH-12, BR-AUTH-15). Unknown body fields are ignored   |
| API4 Unrestricted resource consumption   | Body limited to 1 MB; rate limit per email. Known gap: no limit per IP address                                                                            |
| API5 Function level authorization        | Public by design                                                                                                                                          |

## Side effects

Not idempotent: each success creates a session row and a new cookie, and deletes the session the request came with.
Each 401 adds one failure for the email; a success clears them.

Since Phase 3C every attempt also writes `audit_events` (BR-ADMIN-14), with the email tried and the IP, never the
password:

| Outcome                   | Audit `action`        | Actor                            | Also                                 |
| ------------------------- | --------------------- | -------------------------------- | ------------------------------------ |
| 200                       | `auth.sign_in`        | The user                         | Sets `users.last_sign_in_at`         |
| 401 (unknown email)       | `auth.sign_in_failed` | none (`actor_id` null)           |                                      |
| 401 (wrong password)      | `auth.sign_in_failed` | The account the email belongs to |                                      |
| 403 `ACCOUNT_DEACTIVATED` | `auth.sign_in_failed` | The account                      | `after: { "reason": "deactivated" }` |
| 400, 415, 429             | none                  |                                  |                                      |

A 200 with `mustChangePassword: true` starts a normal session, but that session can only call
[GET /api/auth/me](get-me.md) and [POST /api/auth/change-password](post-change-password.md) until the password is
changed.

## Example

```bash
curl -i -c cookies.txt http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"linh@qawm.test","password":"Password123!"}'
```

## Test ideas

| Type       | Case                                                                                                    | Expected                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Happy path | Seed user, right password                                                                               | 200, body matches `authUserSchema`, cookie is set                   |
| Negative   | Wrong password; unknown email                                                                           | Both 401 with identical bodies (except requestId)                   |
| Validation | Empty body, `email: "abc"`, missing `password`                                                          | 400 with one `errors` entry per field                               |
| Boundary   | 5th wrong password; 6th attempt with the right password                                                 | 401, then 429                                                       |
| Security   | Inspect `Set-Cookie`                                                                                    | `HttpOnly`, `SameSite=Lax`, no token in the body                    |
| Security   | Send as `text/plain`                                                                                    | 415                                                                 |
| Negative   | `inactive@qawm.test` (Hoa Inactive), right password                                                     | 403 `ACCOUNT_DEACTIVATED`, MSG-ADMIN-06, no cookie                  |
| Audit      | Wrong password for `linh@qawm.test`, then as Ada read `GET /api/admin/audit?action=auth.sign_in_failed` | Newest entry has `targetName` `linh@qawm.test`, the IP, no password |

## Change log

| Date       | Change                                                                    | Why                                              |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| 2026-10-07 | First version                                                             | Phase 2                                          |
| 2026-10-08 | Added Security (OWASP API Top 10) and Side effects                        | Documentation standards (docs/STANDARDS.md)      |
| 2026-10-09 | Errors use the RFC 9457 error body (`detail`, `errors`, `messageId`)      | ADR-0010, Phase 3 code PR                        |
| 2026-10-09 | `mustChangePassword` in the body; 403 `ACCOUNT_DEACTIVATED`; audit events | Phase 3C (BR-ADMIN-07, BR-ADMIN-10, BR-ADMIN-14) |
