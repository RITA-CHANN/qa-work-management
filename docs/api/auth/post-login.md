---
id: API-AUTH-01
title: POST /api/auth/login
type: api
feature: auth
status: review
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
    ]
  design: [SCR-AUTH-01, DD-AUTH-01, DD-AUTH-02]
updated: 2026-10-07
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
    "globalRole": "USER"
  }
}
```

| Field        | Type                  | Description           |
| ------------ | --------------------- | --------------------- |
| `id`         | string (cuid)         | User id               |
| `email`      | string                | Lower-case email      |
| `name`       | string                | Shown in the header   |
| `globalRole` | `"ADMIN"` \| `"USER"` | Global role (Phase 2) |

### Response headers

| Header         | Value                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Set-Cookie`   | `qawm_sid=<token>; Max-Age=604800; Path=/; Expires=<now + 7 days>; HttpOnly; SameSite=Lax` (+ `Secure` in production) |
| `X-Request-Id` | Request id                                                                                                            |

If the request already carried a valid `qawm_sid`, that old session is deleted and replaced by the new one.

### Errors

Checked in this order: content type, body, rate limit, credentials.

| Status | `code`                   | `message`                                          | When                                                                             |
| ------ | ------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | `Content-Type must be application/json`            | Missing or other content type                                                    |
| 400    | `VALIDATION_ERROR`       | `Request validation failed`                        | Missing field or bad email. `details` lists each field. Not counted as a failure |
| 429    | `RATE_LIMITED`           | `Too many login attempts. Please try again later.` | 5 failures for this email in the window (BR-AUTH-04). Not counted again          |
| 401    | `UNAUTHENTICATED`        | `Invalid email or password`                        | Unknown email **or** wrong password: same status, code and message (BR-AUTH-03)  |

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "email", "message": "Enter a valid email address" }],
    "requestId": "…"
  }
}
```

The web app shows MSG-AUTH-01 for 401 and MSG-AUTH-02 for 429. The 400 `details` messages are the same texts
as the field messages MSG-AUTH-03, MSG-AUTH-04 and MSG-AUTH-05.

## Example

```bash
curl -i -c cookies.txt http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"linh@qawm.test","password":"Password123!"}'
```

## Test ideas

| Type       | Case                                                    | Expected                                          |
| ---------- | ------------------------------------------------------- | ------------------------------------------------- |
| Happy path | Seed user, right password                               | 200, body matches `authUserSchema`, cookie is set |
| Negative   | Wrong password; unknown email                           | Both 401 with identical bodies (except requestId) |
| Validation | Empty body, `email: "abc"`, missing `password`          | 400 with one `details` entry per field            |
| Boundary   | 5th wrong password; 6th attempt with the right password | 401, then 429                                     |
| Security   | Inspect `Set-Cookie`                                    | `HttpOnly`, `SameSite=Lax`, no token in the body  |
| Security   | Send as `text/plain`                                    | 415                                               |
