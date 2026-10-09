---
id: SCR-ADMIN-03
title: Admin users
type: screen
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /admin/users
traces:
  requirements:
    [
      US-ADMIN-04,
      BR-ADMIN-01,
      BR-ADMIN-06,
      BR-ADMIN-07,
      BR-ADMIN-08,
      BR-ADMIN-09,
      BR-ADMIN-10,
      BR-ADMIN-11,
      BR-ADMIN-12,
      BR-ADMIN-13,
    ]
  acceptance:
    [
      AC-ADMIN-05,
      AC-ADMIN-06,
      AC-ADMIN-07,
      AC-ADMIN-08,
      AC-ADMIN-14,
      AC-ADMIN-15,
      AC-ADMIN-16,
      AC-ADMIN-17,
      AC-ADMIN-20,
    ]
  api:
    [
      API-ADMIN-03,
      API-ADMIN-04,
      API-ADMIN-05,
      API-ADMIN-06,
      API-ADMIN-07,
      API-ADMIN-08,
      API-ADMIN-09,
      API-ADMIN-10,
    ]
  design: [SCR-ADMIN-01, SCR-AUTH-03]
updated: 2026-10-09
---

# SCR-ADMIN-03 Admin users

Every account with search and filters on the left, the selected user's details and actions on the right (mockup
A3): create a user with a one-time password, change the global role, deactivate / reactivate, reset the password
and sign out everywhere (BR-ADMIN-06 to BR-ADMIN-13). Layout of the Admin console:
[SCR-ADMIN-01](SCR-ADMIN-01-all-projects-dashboard.md). Follows ISO 9241-110 and WCAG 2.2 level AA.

## Layout

```
Users                                                                     [ New user ]   <h1>
Accounts, global roles and access
┌─────────────────────────────────────────────────────────┐┌─ Linh QA ──────────────────────┐
│ Search users [Name or email] Global role [All▾] Status [All▾]││ linh@qawm.test                │ <h2>
│ Name               | Global role | Status | Projects | Last sign-in ││ Global role [User ▾]       │
│ Ada Admin          | Admin       | Active | 1        | 9 Oct 2026, …││ Status     Active          │
│ admin@qawm.test    |             |        |          |             ││ Signed in on 1 device      │
│ Hoa Inactive       | User        | Deactivated | 0   | Never       ││ Last sign-in 9 Oct 2026, … │
│ inactive@qawm.test |             |        |          |             ││ Projects (h3)              │
│ …                                                       ││  ShopEase Web SHOP  QA engineer│
└─────────────────────────────────────────────────────────┘│ [Reset password] [Sign out everywhere] [Deactivate] │
                                                           └────────────────────────────────┘
Dialog "New user": Name, Email, Global role (User / Admin), [Cancel] [Create user]
Dialog "One-time password": MSG-ADMIN-02, Email, Password (output), [Copy] [Done]
Alertdialog "Deactivate Linh QA?" / "Reset Linh QA's password?": [Cancel] [Deactivate] / [Reset password]
```

## Fields

| Field                  | Input type | Required | Client validation           | Message                                | Notes                                                |
| ---------------------- | ---------- | -------- | --------------------------- | -------------------------------------- | ---------------------------------------------------- |
| Search users           | `search`   | no       | —                           | —                                      | Name or email                                        |
| Global role (filter)   | select     | no       | —                           | —                                      | All, Admin, User                                     |
| Status (filter)        | select     | no       | —                           | —                                      | All, Active, Deactivated                             |
| Name (New user)        | `text`     | yes      | 2–100 characters after trim | MSG-ADMIN-11                           |                                                      |
| Email (New user)       | `email`    | yes      | Valid email                 | MSG-AUTH-03, MSG-AUTH-04, MSG-ADMIN-01 | MSG-ADMIN-01 comes from the server (409)             |
| Global role (New user) | select     | yes      | —                           | —                                      | Default User                                         |
| Global role (detail)   | select     | —        | —                           | MSG-ADMIN-04 as hint                   | Disabled on the Admin's own account; saves on change |

## Actions

| Action                                 | Result                                                                                                                         | Criteria                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Open the page                          | `GET /api/admin/users`; right side says "Select a user to see their details."                                                  | AC-ADMIN-14              |
| Search / filter                        | List reloads with `search`, `role`, `status`                                                                                   | AC-ADMIN-14              |
| Click a name                           | URL `?user=<id>`; `GET /api/admin/users/<id>`; the detail panel shows                                                          |                          |
| "New user" → fill → "Create user"      | `POST /api/admin/users`; the "One-time password" dialog shows the password once with MSG-ADMIN-02; "Done" selects the new user | AC-ADMIN-05              |
| Create with a used email               | MSG-ADMIN-01 under Email (409 `EMAIL_TAKEN`)                                                                                   | AC-ADMIN-20              |
| Change "Global role" in the panel      | `PATCH /api/admin/users/<id>`; toast "Changes saved" (MSG-PROJECT-19); errors (MSG-ADMIN-03) in an alert in the panel          | AC-ADMIN-15              |
| "Deactivate" → confirm                 | `POST …/deactivate`; status Deactivated; refusals MSG-ADMIN-03 / MSG-ADMIN-05 in the panel alert                               | AC-ADMIN-07, AC-ADMIN-08 |
| "Reactivate"                           | `POST …/reactivate` (no confirmation)                                                                                          | AC-ADMIN-07              |
| "Reset password" → confirm             | `POST …/reset-password`; the "One-time password" dialog shows the new password once                                            | AC-ADMIN-16              |
| "Sign out everywhere"                  | `POST …/sign-out` (no confirmation); toast "Changes saved"                                                                     | AC-ADMIN-17              |
| "Copy" in the one-time password dialog | Copies the password to the clipboard                                                                                           |                          |

## States

| State                     | What the user sees                                                                       | Criteria    |
| ------------------------- | ---------------------------------------------------------------------------------------- | ----------- |
| No user selected          | "Select a user to see their details."                                                    |             |
| Panel loading             | "Loading…" (`role="status"`)                                                             |             |
| No match                  | Empty state heading "No users match your search"                                         |             |
| Own account               | Global role select disabled with MSG-ADMIN-04 as hint; no Deactivate / Reactivate button | AC-ADMIN-06 |
| One-time password pending | Badge "Must set a password" next to the status                                           |             |
| Deactivated user          | Status badge "Deactivated"; "Reactivate" instead of "Deactivate"                         | AC-ADMIN-14 |
| Error                     | API error text in an alert (list, panel or dialog)                                       |             |
| No permission             | "Page not found" (as SCR-ADMIN-01)                                                       | AC-ADMIN-01 |

## Permissions

| Role  | Can see               | Can do                                                         |
| ----- | --------------------- | -------------------------------------------------------------- |
| Admin | Every account         | All actions; not change their own role or status (BR-ADMIN-09) |
| User  | "Page not found" only | —                                                              |

## Accessibility

- Page title "Users · QA Work Management"; one `<h1>` "Users". The detail panel is a region named after the user
  (its `<h2>`); "Projects" inside it is an `<h3>`.
- The users table has a visually hidden caption "Users". Each name is a button (name + email); the selected one has
  `aria-current="true"`.
- Dialogs: "New user" and "One-time password" are `role="dialog"`; confirmations are `role="alertdialog"` with a
  description. Focus is trapped and returns to the opener.
- The one-time password is an `<output>` named "One-time password"; MSG-ADMIN-02 is the dialog's description.
- Role and status are text badges.

## Responsive

From 1280 px the list and the 380 px panel sit side by side; below, the panel goes under the list. The table
scrolls horizontally inside its card.

## Locators for tests

`getByRole('heading', { level: 1, name: 'Users' })`, `getByRole('button', { name: 'New user' })`,
`getByRole('searchbox', { name: 'Search users' })`, `getByRole('combobox', { name: 'Global role' })` and
`getByRole('combobox', { name: 'Status' })` (filters; the panel has another "Global role" select, so scope with
`getByRole('region', { name: 'Linh QA' })`), `getByRole('table', { name: 'Users' })`,
`getByRole('button', { name: /Hoa Inactive/ })` (select a user),
`getByRole('region', { name: 'Hoa Inactive' })`, `getByRole('button', { name: 'Reactivate' })`,
`getByRole('button', { name: 'Deactivate' })`, `getByRole('alertdialog', { name: 'Deactivate Linh QA?' })`,
`getByRole('button', { name: 'Reset password' })`, `getByRole('button', { name: 'Sign out everywhere' })`.
New user dialog: `getByRole('dialog', { name: 'New user' })`, `getByLabel('Name')`, `getByLabel('Email')`,
`getByRole('button', { name: 'Create user' })`; then `getByRole('dialog', { name: 'One-time password' })`,
`getByRole('status', { name: 'One-time password' })` (an `<output>`; read it with `textContent()`),
`getByRole('button', { name: 'Done' })`.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
