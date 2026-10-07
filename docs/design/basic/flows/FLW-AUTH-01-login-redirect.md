---
id: FLW-AUTH-01
title: Login, protected pages and redirect
type: flow
feature: auth
status: review
phase: 2
traces:
  requirements: [US-AUTH-04, BR-AUTH-08, BR-AUTH-09, BR-AUTH-10, BR-AUTH-11]
  acceptance: [AC-AUTH-22, AC-AUTH-23, AC-AUTH-24, AC-AUTH-25, AC-AUTH-26]
  design: [SCR-AUTH-01, SCR-AUTH-02]
updated: 2026-10-07
---

# FLW-AUTH-01 Login, protected pages and redirect

```mermaid
flowchart TD
    A[User opens a page] --> B{Logged in?}
    B -- yes, page is /login --> D[Dashboard]
    B -- yes, other page --> P[Show the page]
    B -- no, page is /login --> L[SCR-AUTH-01 Login]
    B -- no, other page --> R["/login?returnTo=&lt;page&gt;"]
    R --> L
    L -- success --> C{returnTo is a path inside the app?}
    C -- yes --> T[Go to returnTo]
    C -- no or missing --> D
    P -- an API call returns 401 --> L
    P -- "Log out" in SCR-AUTH-02 --> L
```

## Notes

- `returnTo` accepts only paths that start with a single `/` (not `//` and not a full URL). Anything else is ignored (BR-AUTH-09).
- A 401 from any API call means the session ended on the server, so the app goes to `/login` (BR-AUTH-11).

## Change log

| Date       | Change        | Why     |
| ---------- | ------------- | ------- |
| 2026-10-07 | First version | Phase 2 |
