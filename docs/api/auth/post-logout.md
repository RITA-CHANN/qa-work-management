---
id: API-AUTH-02
title: POST /api/auth/logout
type: api
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
traces:
  requirements: [US-AUTH-03, BR-AUTH-06, BR-AUTH-07]
  acceptance: [AC-AUTH-18, AC-AUTH-20, AC-AUTH-21]
  design: [SCR-AUTH-02, FLW-AUTH-02, DD-AUTH-01]
updated: 2026-10-07
---

# POST /api/auth/logout

Ends the current session on the server and clears the cookie. Used by the "Log out" button (SCR-AUTH-02).

|                 |                                      |
| --------------- | ------------------------------------ |
| **Auth**        | None (works logged in or logged out) |
| **Since phase** | 2                                    |
| **Schema**      | none                                 |

## Request

| Header         | Required | Value              |
| -------------- | -------- | ------------------ |
| `Content-Type` | yes      | `application/json` |

Body: `{}` (an empty JSON object). The cookie `qawm_sid` identifies the session.

## Responses

### 204 No Content

Always, whether or not there was a valid session, so the call is safe to repeat.

| Header       | Value                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| `Set-Cookie` | `qawm_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax` (deletes the cookie) |

Only the session in this cookie is deleted. The same user's sessions in other browsers stay (BR-AUTH-07).
After this, the old token returns 401 everywhere, even if someone copied it (BR-AUTH-06).

### Errors

| Status | `code`                   | When                   |
| ------ | ------------------------ | ---------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | Not `application/json` |

## Security

| Risk (OWASP API Security Top 10, 2023)   | How this endpoint handles it                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| API1 Object level authorization          | Deletes only the session in the caller's own cookie (BR-AUTH-07)                               |
| API2 Broken authentication               | The session is deleted on the server, so a copied cookie stops working (BR-AUTH-06)            |
| API3 Object property level authorization | No response body                                                                               |
| API4 Unrestricted resource consumption   | Body limited to 1 MB                                                                           |
| API5 Function level authorization        | Public on purpose: logging out without a session is harmless. CSRF: JSON only + `SameSite=Lax` |

## Side effects

Idempotent: calling it twice gives 204 both times. Deletes at most one row in `sessions` and clears the cookie.

## Example

```bash
curl -i -b cookies.txt http://localhost:3000/api/auth/logout -H 'Content-Type: application/json' -d '{}'
```

## Test ideas

| Type       | Case                                                          | Expected                            |
| ---------- | ------------------------------------------------------------- | ----------------------------------- |
| Happy path | Log in, log out, then `GET /api/auth/me` with the same cookie | 204, then 401                       |
| Security   | Save the cookie value before logout, send it afterwards       | 401                                 |
| Session    | Two logged-in contexts, log out in one                        | The other still gets 200 from `/me` |
| Negative   | Log out without a cookie                                      | 204                                 |

## Change log

| Date       | Change                                             | Why                                         |
| ---------- | -------------------------------------------------- | ------------------------------------------- |
| 2026-10-07 | First version                                      | Phase 2                                     |
| 2026-10-08 | Added Security (OWASP API Top 10) and Side effects | Documentation standards (docs/STANDARDS.md) |
