---
id: SCR-PROJECT-03
title: Members tab
type: screen
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /projects/:key/members
traces:
  requirements:
    [
      US-PROJECT-05,
      US-PROJECT-13,
      BR-PROJECT-10,
      BR-PROJECT-11,
      BR-PROJECT-12,
      BR-PROJECT-13,
      BR-PROJECT-23,
      BR-PROJECT-24,
      BR-PROJECT-35,
    ]
  acceptance:
    [
      AC-PROJECT-23,
      AC-PROJECT-24,
      AC-PROJECT-25,
      AC-PROJECT-26,
      AC-PROJECT-27,
      AC-PROJECT-28,
      AC-PROJECT-29,
      AC-PROJECT-48,
      AC-PROJECT-49,
      AC-PROJECT-50,
      AC-PROJECT-51,
    ]
  api: [API-PROJECT-08, API-PROJECT-09, API-PROJECT-10, API-PROJECT-11, API-USER-01]
  design: [FLW-PROJECT-02, DD-PROJECT-01]
updated: 2026-10-08
---

# SCR-PROJECT-03 Members tab

Who is in the project and with which role. Owner, Project manager and QA lead manage members here; everyone else
sees the list.

## Layout

```
 Members (8)                                                    [ Add member ]
┌──────────────────┬──────────────────────┬──────────────────┬───────────────┐
│ Name             │ Email                │ Role             │               │
├──────────────────┼──────────────────────┼──────────────────┼───────────────┤
│ Oanh Owner       │ owner@qawm.test      │ [Owner        ▾] │ [Remove]      │  select disabled for PM/QA lead
│ Minh Lead (you)  │ lead@qawm.test       │ QA lead (fixed)  │ [Leave]       │  own row: no role select
│ Linh QA          │ linh@qawm.test       │ [QA engineer  ▾] │ [Remove]      │
└──────────────────┴──────────────────────┴──────────────────┴───────────────┘

Dialog "Add member": User [combobox: search name/email, existing members not listed], Role [select], [Cancel] [Add]
Dialog "Remove <name>?": [Cancel] [Remove]        Dialog "Leave project?": [Cancel] [Leave]
```

## Fields

| Field      | Input type | Required | Client validation        | Message | Notes                                                                               |
| ---------- | ---------- | -------- | ------------------------ | ------- | ----------------------------------------------------------------------------------- |
| User (add) | combobox   | yes      | a user from the list     | —       | Options from `GET /api/users`, minus current members (AC-PROJECT-24)                |
| Role (add) | select     | yes      | one of the roles offered | —       | "Owner" offered only to Owners and Admins (AC-PROJECT-49)                           |
| Role (row) | select     | —        | —                        | —       | Changes save on select; disabled on your own row and, for PM/QA lead, on Owner rows |

## Actions

| Action                                                   | Result                                                                                                        | Criteria                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Add member → Add                                         | `POST …/members`; row appears; toast                                                                          | AC-PROJECT-23, AC-PROJECT-48 |
| Server 409 `ALREADY_MEMBER`                              | Alert MSG-PROJECT-11 in the dialog                                                                            | AC-PROJECT-24                |
| Change a role in a row                                   | `PATCH …/members/:userId`; toast; on error the select returns to the old value and an alert shows the message | AC-PROJECT-25, AC-PROJECT-48 |
| Remove → confirm                                         | `DELETE …/members/:userId`; row disappears                                                                    | AC-PROJECT-26                |
| Leave → confirm                                          | `DELETE …/members/<me>`; go to `/projects`                                                                    | AC-PROJECT-28                |
| Server 422 `LAST_OWNER`                                  | Alert MSG-PROJECT-12, nothing changes                                                                         | AC-PROJECT-27                |
| Server 422 `OWN_ROLE` (only via API; the UI disables it) | Alert MSG-PROJECT-22                                                                                          | AC-PROJECT-50                |
| Server 403                                               | Alert MSG-COMMON-06                                                                                           | AC-PROJECT-49                |

## States

| State                           | What the user sees                                                         | Criteria      |
| ------------------------------- | -------------------------------------------------------------------------- | ------------- |
| Loading                         | Skeleton rows                                                              |               |
| Empty                           | Not possible: a project always has an Owner                                | BR-PROJECT-12 |
| Error                           | MSG-COMMON-01 with "Try again"                                             |               |
| No permission (read-only roles) | Table without Add, role selects shown as text, no Remove; Leave on own row | AC-PROJECT-29 |
| Archived project                | Read-only for everyone, no Leave                                           | BR-PROJECT-08 |
| Success                         | Toast MSG-PROJECT-19                                                       |               |

## Permissions

| Role                                                   | Can see     | Can do                                                                         |
| ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| Owner, Admin                                           | All members | Add, change role, remove anyone (incl. Owners), leave if another Owner remains |
| Project manager, QA lead                               | All members | Add, change role, remove members who are not Owners; leave                     |
| QA engineer, Team lead, Developer, Stakeholder, Viewer | All members | Leave                                                                          |

## Accessibility

- Table with caption "Project members"; the current user's row says "(you)" in text.
- Each row's select has an accessible name "Role of <name>"; each Remove button "Remove <name>".
- Disabled controls explain why with `aria-describedby` ("Only an Owner can change an Owner's role", "You can't
  change your own role").
- Errors from a row change appear in `role="alert"` above the table; focus returns to the select.
- Combobox follows the ARIA combobox pattern (type to filter, arrow keys, Enter).

## Responsive

Below 768 px each member is a card: name and email, then role and actions on the next line.

## Locators for tests

`getByRole('button', { name: 'Add member' })`, `getByRole('dialog', { name: 'Add member' })`,
`getByRole('combobox', { name: 'User' })`, `getByRole('combobox', { name: 'Role' })`,
`getByRole('row', { name: /Linh QA/ })`, `getByRole('combobox', { name: 'Role of Linh QA' })`,
`getByRole('button', { name: 'Remove Dev Nguyen' })`, `getByRole('button', { name: 'Leave' })`.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-08 | First version | Phase 3A |
