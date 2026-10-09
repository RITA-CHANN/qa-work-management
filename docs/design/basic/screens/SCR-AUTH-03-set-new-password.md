---
id: SCR-AUTH-03
title: Set a new password
type: screen
feature: auth
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /change-password
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-07, BR-ADMIN-12, BR-AUTH-12]
  acceptance: [AC-ADMIN-05, AC-ADMIN-16]
  api: [API-AUTH-04, API-AUTH-03, API-AUTH-01]
  design: [SCR-AUTH-01, SCR-ADMIN-03]
updated: 2026-10-09
---

# SCR-AUTH-03 Set a new password

Shown after signing in with a one-time password that an Admin created or reset (BR-ADMIN-07, BR-ADMIN-12). The
user must choose their own password before any other page opens; the API refuses everything else with 403
`PASSWORD_CHANGE_REQUIRED` meanwhile. No app shell: like the login page, it is a single centred card. Follows ISO
9241-110 and WCAG 2.2 level AA.

## Layout

```
                ┌────────────────────────────────────┐
                │ Set a new password                 │  <h1>
                │ Set a new password to continue     │  MSG-ADMIN-07
                │ (form error)                       │  role="alert"
                │ New password                       │
                │ [______________________]           │
                │ field message                      │
                │ Confirm new password               │
                │ [______________________]           │
                │ field message                      │
                │ [        Save password        ]    │
                └────────────────────────────────────┘
```

## Fields

| Field                | Input type | Required | Client validation     | Message                    | Notes                                                             |
| -------------------- | ---------- | -------- | --------------------- | -------------------------- | ----------------------------------------------------------------- |
| New password         | `password` | yes      | 8–200 characters      | MSG-ADMIN-12, MSG-ADMIN-14 | `autocomplete="new-password"`; MSG-ADMIN-14 comes from the server |
| Confirm new password | `password` | yes      | Equal to New password | MSG-ADMIN-13               | `autocomplete="new-password"`                                     |

## Actions

| Action                                              | Result                                                                              | Criteria    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------- |
| Sign in with a one-time password                    | Login succeeds with `mustChangePassword: true`; any page redirects here (`replace`) | AC-ADMIN-05 |
| Open any other URL meanwhile                        | Redirected here                                                                     | AC-ADMIN-05 |
| "Save password" with client errors                  | Messages under the fields, no request                                               |             |
| "Save password", server 200                         | Toast MSG-ADMIN-15 "Password changed", then `/` (the dashboard)                     |             |
| Server 400 with `/newPassword`                      | MSG-ADMIN-14 (same as the one-time password) under New password                     |             |
| Other error                                         | Error text in an alert above the fields                                             |             |
| Open `/change-password` without a one-time password | Redirected to `/`                                                                   |             |

## States

| State         | What the user sees                                    | Criteria |
| ------------- | ----------------------------------------------------- | -------- |
| Loading       | "Loading…" while the session is checked (RequireAuth) |          |
| Ready         | The form, MSG-ADMIN-07 under the heading              |          |
| Saving        | "Save password" disabled while the request runs       |          |
| Field error   | Message under the field, field `aria-invalid="true"`  |          |
| Error         | `role="alert"` with the error text                    |          |
| No permission | Not logged in: sent to `/login` (BR-AUTH-08)          |          |

## Permissions

| Role                               | Can see                | Can do             |
| ---------------------------------- | ---------------------- | ------------------ |
| Signed in with a one-time password | This page only         | Set a new password |
| Signed in with their own password  | Redirected to `/`      | —                  |
| Not logged in                      | Redirected to `/login` | —                  |

## Accessibility

- Page title "Set a new password · QA Work Management"; one `<h1>` "Set a new password".
- Landmark: `main` only (no header or nav, the user can't go anywhere else yet).
- Tab order: New password → Confirm new password → Save password.
- Each field has a `<label>`; errors are linked with `aria-describedby` and set `aria-invalid="true"`.
- Form errors are announced with `role="alert"`; the success toast with `role="status"`.
- Colour contrast at least 4.5:1.

## Responsive

The card is at most 384 px wide and takes the full width with 32 px padding on narrow screens.

## Locators for tests

`getByRole('heading', { name: 'Set a new password' })`, `getByText(msg('MSG-ADMIN-07'))`,
`getByLabel('New password', { exact: true })`, `getByLabel('Confirm new password')`,
`getByRole('button', { name: 'Save password' })`, `expect(page).toHaveURL('/change-password')`. Use
`exact: true` on "New password" because "Confirm new password" contains it.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
