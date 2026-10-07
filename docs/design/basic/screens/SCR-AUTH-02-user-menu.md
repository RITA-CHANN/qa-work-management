---
id: SCR-AUTH-02
title: Header user menu
type: screen
feature: auth
status: review
phase: 2
route: every page except /login
traces:
  requirements: [US-AUTH-03, US-AUTH-05]
  acceptance: [AC-AUTH-18, AC-AUTH-19, AC-AUTH-27, AC-AUTH-28]
  design: [FLW-AUTH-01]
updated: 2026-10-07
---

# SCR-AUTH-02 Header user menu

A part of the app header (`AppLayout`), shown on every page once logged in. API: `GET /api/auth/me` for the
name, `POST /api/auth/logout` for the button.

## Elements

| Element   | Shown when | Behaviour                                        |
| --------- | ---------- | ------------------------------------------------ |
| User name | logged in  | The `name` of the logged-in user                 |
| "Log out" | logged in  | Ends the session on the server, goes to `/login` |

## Locators for tests

`getByRole('banner')` for the header, then `getByText(<name>)` and `getByRole('button', { name: 'Log out' })`.

## Change log

| Date       | Change        | Why     |
| ---------- | ------------- | ------- |
| 2026-10-07 | First version | Phase 2 |
