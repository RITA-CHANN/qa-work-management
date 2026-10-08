---
id: SCR-AUTH-02
title: Header user menu
type: screen
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
route: every page except /login
traces:
  requirements: [US-AUTH-03, US-AUTH-05]
  acceptance: [AC-AUTH-18, AC-AUTH-19, AC-AUTH-27, AC-AUTH-28]
  api: [API-AUTH-02, API-AUTH-03]
  design: [FLW-AUTH-01, FLW-AUTH-02, DD-AUTH-03]
updated: 2026-10-07
---

# SCR-AUTH-02 Header user menu

A part of the app header (`AppLayout`), shown on every page once logged in. API: [API-AUTH-03 GET /api/auth/me](../../../api/auth/get-me.md)
for the name, [API-AUTH-02 POST /api/auth/logout](../../../api/auth/post-logout.md) for the button. What happens after
logout: [FLW-AUTH-02](../flows/FLW-AUTH-02-logout-session-end.md).

## Layout

```
┌───────────────────────────────────────────────────────────────┐
│ QA Work Management            [API status]  Linh QA [Log out] │  <header> (banner)
└───────────────────────────────────────────────────────────────┘
```

## Elements

| Element   | Shown when | Behaviour                                        |
| --------- | ---------- | ------------------------------------------------ |
| User name | logged in  | The `name` of the logged-in user                 |
| "Log out" | logged in  | Ends the session on the server, goes to `/login` |

The button is disabled while the logout request is sending. If the request fails (network), the app still clears
its data and goes to `/login`.

## Actions

| Action                 | Result                                                                            | Criteria               |
| ---------------------- | --------------------------------------------------------------------------------- | ---------------------- |
| Click "Log out"        | `POST /api/auth/logout`, cached data cleared, `/login` replaces the history entry | AC-AUTH-18, AC-AUTH-19 |
| Logout fails (network) | Same as success: data cleared, `/login`                                           | AC-AUTH-18             |

## States

| State       | What the user sees                 | Criteria   |
| ----------- | ---------------------------------- | ---------- |
| Guest       | Nothing (the menu is not rendered) | AC-AUTH-28 |
| Logged in   | User name and an enabled "Log out" | AC-AUTH-27 |
| Logging out | "Log out" disabled                 |            |

## Permissions

| Role        | Can see             | Can do  |
| ----------- | ------------------- | ------- |
| Guest       | Nothing             | —       |
| User, Admin | Own name, "Log out" | Log out |

## Accessibility

- Inside the `header` landmark (`banner`), after the API status (`role="status"`).
- "Log out" is a real `<button>` with its visible text as the accessible name; it is reachable with Tab.
- A "Skip to main content" link is the first Tab stop of every page in the layout.

## Responsive

No special layout yet: the header keeps one row. Known gap: on screens below about 400 px the name and button may
wrap; there is no criterion for small screens yet.

## Locators for tests

`getByRole('banner')` for the header, then `getByText(<name>)` and `getByRole('button', { name: 'Log out' })`.

## Change log

| Date       | Change                                                                   | Why                                         |
| ---------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| 2026-10-07 | First version                                                            | Phase 2                                     |
| 2026-10-07 | Added API and flow links, failure behaviour of Log out                   | Full login feature design                   |
| 2026-10-08 | Added Layout, Actions, States, Permissions, Accessibility and Responsive | Documentation standards (docs/STANDARDS.md) |
