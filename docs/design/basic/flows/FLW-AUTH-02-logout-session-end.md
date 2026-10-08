---
id: FLW-AUTH-02
title: Logout and session end
type: flow
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
traces:
  requirements: [US-AUTH-03, BR-AUTH-05, BR-AUTH-06, BR-AUTH-07, BR-AUTH-11]
  acceptance: [AC-AUTH-17, AC-AUTH-18, AC-AUTH-19, AC-AUTH-20, AC-AUTH-21, AC-AUTH-26]
  api: [API-AUTH-02, API-AUTH-03]
  design: [SCR-AUTH-02, FLW-AUTH-01, DD-AUTH-03]
updated: 2026-10-07
---

# FLW-AUTH-02 Logout and session end

The two ways a session ends: the user clicks "Log out", or the server no longer accepts the session (it expired
after 7 days, or it was logged out from a copy of the cookie).

## Actors

User (logged in).

## Preconditions

The user is logged in and on any page of the app.

## Postconditions

This browser's session row is deleted, the cookie is cleared, cached page data is gone, and the user is on `/login`.
Sessions in other browsers still work (BR-AUTH-07).

## Diagram

```mermaid
flowchart TD
    P[Logged in, on any page] -- clicks Log out in SCR-AUTH-02 --> LO[POST /api/auth/logout]
    LO --> CL[Clear cached user and page data]
    CL --> L["SCR-AUTH-01 /login (history replaced)"]
    P -- any API call --> Q{Response}
    Q -- 2xx --> P
    Q -- 401 --> CL2[Clear cached user and page data]
    CL2 --> R["/login?returnTo=&lt;current page&gt;"]
    L -- Back button --> G{Logged in?}
    G -- no --> L
```

## Main flow

1. The user clicks "Log out" in [SCR-AUTH-02](../screens/SCR-AUTH-02-user-menu.md).
2. The app calls `POST /api/auth/logout`; the API deletes the session and clears the cookie.
3. The app clears cached user and page data.
4. The app shows `/login`, replacing the history entry (AC-AUTH-18).

## Alternative flows

| ID  | At step | Condition                                  | What happens                                    | Criteria               |
| --- | ------- | ------------------------------------------ | ----------------------------------------------- | ---------------------- |
| A1  | 4       | The user presses Back                      | Stays on `/login`; no old page data is shown    | AC-AUTH-19             |
| A2  | 1       | The session expired or was ended elsewhere | The next API call gets 401; `/login?returnTo=…` | AC-AUTH-17, AC-AUTH-26 |

## Exception flows

| ID  | At step | Error                         | What happens                                                          | Criteria   |
| --- | ------- | ----------------------------- | --------------------------------------------------------------------- | ---------- |
| E1  | 2       | Network error on logout       | Steps 3 and 4 still run; the server session may stay until it expires | AC-AUTH-18 |
| E2  | 2       | Someone reuses the old cookie | The API answers 401: the session no longer exists                     | AC-AUTH-20 |

## Notes

- Logout replaces the history entry, and the cached data is cleared, so Back cannot show the old page's data
  (AC-AUTH-19). If the browser restores a page from its cache, the next API call returns 401 and the user lands on
  `/login`.
- After a 401 the user is sent to `/login` with `returnTo`, so they come back to the same page after logging in.
  After a deliberate logout there is no `returnTo`.
- Logging out ends only this browser's session (BR-AUTH-07). Another browser keeps working.

## Change log

| Date       | Change                                                                       | Why                                         |
| ---------- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| 2026-10-07 | First version                                                                | Phase 2                                     |
| 2026-10-08 | Use case sections: actors, conditions, main, alternative and exception flows | Documentation standards (docs/STANDARDS.md) |
