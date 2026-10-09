---
id: API-AUTH-03
title: GET /api/auth/me
type: api
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
traces:
  requirements: [US-AUTH-02, US-AUTH-05, BR-AUTH-05, BR-AUTH-06, BR-AUTH-11, BR-ADMIN-07]
  acceptance: [AC-AUTH-14, AC-AUTH-15, AC-AUTH-16, AC-AUTH-17, AC-AUTH-20, AC-AUTH-25, AC-AUTH-27]
  design: [SCR-AUTH-02, SCR-AUTH-03, SCR-SHELL-01, FLW-AUTH-01, DD-AUTH-02, DD-AUTH-03]
updated: 2026-10-09
---

# GET /api/auth/me

Returns the logged-in user. The web app calls it on start to decide whether to show a page or the login
screen, to show the name in the account menu (SCR-SHELL-01), and to send a user with `mustChangePassword: true`
to "Set a new password" (SCR-AUTH-03).

|                 |                                                  |
| --------------- | ------------------------------------------------ |
| **Auth**        | Logged in                                        |
| **Since phase** | 2                                                |
| **Schema**      | `packages/shared/src/auth.ts` (`authUserSchema`) |

## Request

No parameters and no body. The cookie `qawm_sid` identifies the session.

## Responses

### 200 OK

Same body as [POST /api/auth/login](post-login.md#200-ok), including `mustChangePassword` (Phase 3C). Calling it
does **not** extend the session: a session lasts 7 days from login (BR-AUTH-05).

This endpoint still answers 200 while `mustChangePassword` is `true` (BR-ADMIN-07); with
[POST /api/auth/change-password](post-change-password.md) it is the only one that does.

### Errors

| Status | `code`            | `detail`                  | When                                                    |
| ------ | ----------------- | ------------------------- | ------------------------------------------------------- |
| 401    | `UNAUTHENTICATED` | `Authentication required` | No cookie, unknown token, logged-out or expired session |

All four 401 cases look the same, so a caller can't tell them apart.

## Security

| Risk (OWASP API Security Top 10, 2023)   | How this endpoint handles it                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| API1 Object level authorization          | Returns only the caller's own user, taken from the session, never from a parameter |
| API2 Broken authentication               | Every 401 case looks the same; expired sessions are deleted                        |
| API3 Object property level authorization | Same safe fields as login; never `password_hash`                                   |
| API4 Unrestricted resource consumption   | One indexed lookup per call                                                        |
| API5 Function level authorization        | Any logged-in user                                                                 |

## Side effects

Read only and idempotent, except that an expired session row is deleted when it is found. Does not extend the
session.

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/auth/me
```

## Test ideas

| Type       | Case                                       | Expected                       |
| ---------- | ------------------------------------------ | ------------------------------ |
| Happy path | After login in the same `request` context  | 200, `email` matches           |
| Negative   | A fresh `request.newContext()` (no cookie) | 401 `UNAUTHENTICATED`          |
| Negative   | Cookie with a made-up token                | 401                            |
| Session    | Expired session (set a short TTL in test)  | 401                            |
| Happy path | Signed in with a one-time password         | 200, `mustChangePassword` true |

## Change log

| Date       | Change                                                               | Why                                         |
| ---------- | -------------------------------------------------------------------- | ------------------------------------------- |
| 2026-10-07 | First version                                                        | Phase 2                                     |
| 2026-10-08 | Added Security (OWASP API Top 10) and Side effects                   | Documentation standards (docs/STANDARDS.md) |
| 2026-10-09 | Errors use the RFC 9457 error body (`detail`, `errors`, `messageId`) | ADR-0010, Phase 3 code PR                   |
| 2026-10-09 | `mustChangePassword` in the body; answers while it is `true`         | Phase 3C (BR-ADMIN-07)                      |
