---
id: API-AUTH-03
title: GET /api/auth/me
type: api
feature: auth
status: review
phase: 2
traces:
  requirements: [US-AUTH-02, US-AUTH-05, BR-AUTH-05, BR-AUTH-06, BR-AUTH-11]
  acceptance: [AC-AUTH-14, AC-AUTH-15, AC-AUTH-16, AC-AUTH-17, AC-AUTH-20, AC-AUTH-25, AC-AUTH-27]
  design: [SCR-AUTH-02, FLW-AUTH-01, DD-AUTH-02, DD-AUTH-03]
updated: 2026-10-07
---

# GET /api/auth/me

Returns the logged-in user. The web app calls it on start to decide whether to show a page or the login
screen, and to show the name in the header.

|                 |                                                  |
| --------------- | ------------------------------------------------ |
| **Auth**        | Logged in                                        |
| **Since phase** | 2                                                |
| **Schema**      | `packages/shared/src/auth.ts` (`authUserSchema`) |

## Request

No parameters and no body. The cookie `qawm_sid` identifies the session.

## Responses

### 200 OK

Same body as [POST /api/auth/login](post-login.md#200-ok). Calling it does **not** extend the session: a session
lasts 7 days from login (BR-AUTH-05).

### Errors

| Status | `code`            | `message`                 | When                                                    |
| ------ | ----------------- | ------------------------- | ------------------------------------------------------- |
| 401    | `UNAUTHENTICATED` | `Authentication required` | No cookie, unknown token, logged-out or expired session |

All four 401 cases look the same, so a caller can't tell them apart.

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/auth/me
```

## Test ideas

| Type       | Case                                       | Expected              |
| ---------- | ------------------------------------------ | --------------------- |
| Happy path | After login in the same `request` context  | 200, `email` matches  |
| Negative   | A fresh `request.newContext()` (no cookie) | 401 `UNAUTHENTICATED` |
| Negative   | Cookie with a made-up token                | 401                   |
| Session    | Expired session (set a short TTL in test)  | 401                   |
