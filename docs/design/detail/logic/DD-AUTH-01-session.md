---
id: DD-AUTH-01
title: Sessions and login rate limit
type: detail-design
feature: auth
status: review
phase: 2
traces:
  requirements:
    [BR-AUTH-01, BR-AUTH-03, BR-AUTH-04, BR-AUTH-05, BR-AUTH-06, BR-AUTH-07, BR-AUTH-12, BR-AUTH-13]
  acceptance:
    [AC-AUTH-06, AC-AUTH-10, AC-AUTH-11, AC-AUTH-12, AC-AUTH-13, AC-AUTH-17, AC-AUTH-20, AC-AUTH-21]
  design: [SCR-AUTH-01]
updated: 2026-10-07
---

# DD-AUTH-01 Sessions and login rate limit

How login, the session cookie and the rate limit work inside the API. Decisions and reasons are in the
[Phase 2 plan §4](../../../phases/phase-2-plan.md#4-architecture-decisions-for-this-phase).

## Login sequence

```mermaid
sequenceDiagram
    participant W as Web (SCR-AUTH-01)
    participant A as API /api/auth/login
    participant RL as Rate limiter (memory)
    participant DB as Postgres
    W->>A: POST { email, password }
    A->>A: validate (Zod), trim + lower-case email
    A->>RL: blocked(email)?
    alt 5 failures in the window
        A-->>W: 429 RATE_LIMITED (MSG-AUTH-02)
    else not blocked
        A->>DB: find user by email
        A->>A: argon2 verify(password, password_hash)
        alt unknown email or wrong password
            A->>RL: record failure(email)
            A-->>W: 401 (MSG-AUTH-01, same for both)
        else ok
            A->>DB: insert session (sha256(id), user_id, expires_at = now + 7 days)
            A-->>W: 200 user + Set-Cookie qawm_sid (HttpOnly, SameSite=Lax)
        end
    end
```

## Rules in code

| Topic      | Behaviour                                                                                       | Rule                   |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------- |
| Session id | Random id in the cookie; only its SHA-256 hash is stored                                        | BR-AUTH-06             |
| Expiry     | `expires_at` checked on every request; expired → 401. TTL from `SESSION_TTL_HOURS`              | BR-AUTH-05, BR-AUTH-13 |
| Logout     | Deletes only this session row and clears the cookie; other sessions stay                        | BR-AUTH-06, BR-AUTH-07 |
| Rate limit | Per lower-cased email, `LOGIN_RATE_LIMIT_MAX` failures in `LOGIN_RATE_LIMIT_WINDOW_MIN` minutes | BR-AUTH-04, BR-AUTH-13 |
| Password   | Stored as an argon2 hash; never logged or returned                                              | BR-AUTH-12             |

## Change log

| Date       | Change                               | Why     |
| ---------- | ------------------------------------ | ------- |
| 2026-10-07 | First version, from the Phase 2 plan | Phase 2 |
