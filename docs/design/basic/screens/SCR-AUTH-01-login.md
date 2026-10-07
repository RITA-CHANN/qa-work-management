---
id: SCR-AUTH-01
title: Login screen
type: screen
feature: auth
status: review
phase: 2
route: /login
traces:
  requirements:
    [
      US-AUTH-01,
      US-AUTH-06,
      BR-AUTH-01,
      BR-AUTH-02,
      BR-AUTH-03,
      BR-AUTH-04,
      BR-AUTH-09,
      BR-AUTH-10,
      BR-AUTH-12,
    ]
  acceptance:
    [
      AC-AUTH-01,
      AC-AUTH-02,
      AC-AUTH-03,
      AC-AUTH-04,
      AC-AUTH-05,
      AC-AUTH-06,
      AC-AUTH-07,
      AC-AUTH-08,
      AC-AUTH-09,
      AC-AUTH-11,
      AC-AUTH-24,
      AC-AUTH-25,
    ]
  api: [API-AUTH-01]
  design: [FLW-AUTH-01, DD-AUTH-01, DD-AUTH-03]
updated: 2026-10-07
---

# SCR-AUTH-01 Login screen

The only page a guest can see. API: [API-AUTH-01 POST /api/auth/login](../../../api/auth/post-login.md).
How the form works inside: [DD-AUTH-03](../../detail/logic/DD-AUTH-03-web-auth-state.md).

## Layout

```
┌──────────────────────────────────────┐
│  QA Work Management                  │   header: no user name, no "Log out" (AC-AUTH-28)
├──────────────────────────────────────┤
│            Log in                    │   <h1>
│  [alert: server message]             │   role="alert", only when the server rejects
│  Email     [________________]        │   <label> + input type="email"
│            field message             │
│  Password  [________________]        │   <label> + input type="password"
│            field message             │
│            [ Log in ]                │   <button type="submit">
└──────────────────────────────────────┘
```

## Fields

| Field    | Input type | Required | Client validation   | Message                  | Notes                              |
| -------- | ---------- | -------- | ------------------- | ------------------------ | ---------------------------------- |
| Email    | `email`    | yes      | looks like an email | MSG-AUTH-03, MSG-AUTH-04 | trimmed, case-insensitive (server) |
| Password | `password` | yes      | not empty           | MSG-AUTH-05              | characters hidden                  |

## Actions

| Action                                   | Result                                                                                 | Criteria               |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------- |
| Click "Log in" or press Enter in a field | Client validation; if it passes, `POST /api/auth/login`                                | AC-AUTH-04, AC-AUTH-07 |
| Server returns 200                       | Go to `returnTo` if it is a path inside the app, else the dashboard (history replaced) | AC-AUTH-01, AC-AUTH-24 |
| Server returns 401                       | Alert MSG-AUTH-01, password field cleared, focus on password                           | AC-AUTH-02, AC-AUTH-03 |
| Server returns 429                       | Alert MSG-AUTH-02, password field cleared                                              | AC-AUTH-11             |
| Open `/login` while logged in            | Redirect to the dashboard                                                              | AC-AUTH-25             |

## States

| State      | What the user sees                                         | Criteria               |
| ---------- | ---------------------------------------------------------- | ---------------------- |
| Empty      | Both fields empty, button enabled                          |                        |
| Invalid    | Message under each bad field, no request sent              | AC-AUTH-04, AC-AUTH-05 |
| Submitting | Button disabled                                            | AC-AUTH-08             |
| Rejected   | MSG-AUTH-01 in the alert, email kept, password cleared     | AC-AUTH-02, AC-AUTH-03 |
| Blocked    | MSG-AUTH-02 in the alert                                   | AC-AUTH-11             |
| Success    | Navigates to `returnTo` (inside the app only) or dashboard | AC-AUTH-01, AC-AUTH-24 |

## Locators for tests

Use roles and labels, no `data-testid`: `getByLabel('Email')`, `getByLabel('Password')`,
`getByRole('button', { name: 'Log in' })`, `getByRole('alert')`.

## Change log

| Date       | Change                                                                                 | Why                       |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------- |
| 2026-10-07 | First version                                                                          | Phase 2                   |
| 2026-10-07 | Added Actions, API and detail design links; password is cleared after a rejected login | Full login feature design |
