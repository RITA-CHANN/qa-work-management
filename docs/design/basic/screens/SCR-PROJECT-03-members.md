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
      US-PROJECT-14,
      BR-PROJECT-10,
      BR-PROJECT-11,
      BR-PROJECT-12,
      BR-PROJECT-13,
      BR-PROJECT-23,
      BR-PROJECT-24,
      BR-PROJECT-35,
      BR-PROJECT-37,
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
      AC-PROJECT-50,
      AC-PROJECT-51,
      AC-PROJECT-73,
      AC-PROJECT-75,
    ]
  api: [API-PROJECT-08, API-PROJECT-09, API-PROJECT-10, API-PROJECT-11, API-USER-01]
  design: [FLW-PROJECT-02, DD-PROJECT-01]
updated: 2026-10-09
---

# SCR-PROJECT-03 Members tab

Who is in the project, with which access level and job title. Project admins (and System admins) manage members
here; Members see the list.

## Layout

```
 Members (8)                                                                  [ Add member ]
┌──────────────────┬──────────────────────┬──────────────────┬──────────────────────┬──────────┐
│ Name             │ Email                │ Access           │ Job title            │          │
├──────────────────┼──────────────────────┼──────────────────┼──────────────────────┼──────────┤
│ Mai PM           │ pm@qawm.test         │ [Project admin▾] │ [Project manager (PM)▾]│ [Remove] │
│ Oanh Owner (you) │ owner@qawm.test      │ Project admin    │ [Product owner (PO) ▾] │ [Leave]  │  own access: plain text
│ Linh QA          │ linh@qawm.test       │ [Member       ▾] │ [QA engineer (QAE)  ▾] │ [Remove] │
└──────────────────┴──────────────────────┴──────────────────┴──────────────────────┴──────────┘

As a Member: Access and Job title are text ("Member", "QA engineer · QAE", or "—"), no Add, no Remove.

Dialog "Add member": User [select: name (email), existing members not listed], Access [select, default Member],
                     Job title [select, default "—"], [Cancel] [Add]
Dialog "Remove <name>?": [Cancel] [Remove]        Dialog "Leave project?": [Cancel] [Leave]
```

## Fields

| Field           | Input type | Required | Client validation                | Message         | Notes                                                                      |
| --------------- | ---------- | -------- | -------------------------------- | --------------- | -------------------------------------------------------------------------- |
| User (add)      | select     | yes      | a user from the list             | "Choose a user" | Options from `GET /api/users`, minus current members (AC-PROJECT-24)       |
| Access (add)    | select     | yes      | Project admin or Member          | —               | Default Member; both levels offered to every Project admin (BR-PROJECT-23) |
| Job title (add) | select     | no       | one of the 11 job titles, or "—" | —               | Default "—" (none); options read "QA engineer (QAE)" (BR-PROJECT-37)       |
| Access (row)    | select     | —        | —                                | —               | Saves on change; shown as plain text on your own row (BR-PROJECT-24)       |
| Job title (row) | select     | —        | —                                | —               | Saves on change; editable on every row, your own included; "—" removes it  |

## Actions

| Action                                                                       | Result                                                                                                                             | Criteria                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Add member → Add                                                             | `POST …/members`; row appears; toast                                                                                               | AC-PROJECT-23, AC-PROJECT-48, AC-PROJECT-73                |
| Server 409 `ALREADY_MEMBER`                                                  | Alert MSG-PROJECT-11 in the dialog                                                                                                 | AC-PROJECT-24                                              |
| Change Access or Job title in a row                                          | `PATCH …/members/:userId` with only that field; toast; on error the select returns to the old value and an alert shows the message | AC-PROJECT-25, AC-PROJECT-48, AC-PROJECT-73, AC-PROJECT-75 |
| Remove → confirm                                                             | `DELETE …/members/:userId`; row disappears                                                                                         | AC-PROJECT-26                                              |
| Leave → confirm                                                              | `DELETE …/members/<me>`; go to `/projects`                                                                                         | AC-PROJECT-28                                              |
| Server 422 `LAST_PROJECT_ADMIN`                                              | Alert MSG-PROJECT-12, nothing changes                                                                                              | AC-PROJECT-27                                              |
| Server 422 `OWN_ACCESS` (only via API; the UI shows your own access as text) | Alert MSG-PROJECT-22                                                                                                               | AC-PROJECT-50                                              |
| Server 403                                                                   | Alert MSG-COMMON-06                                                                                                                | AC-PROJECT-29                                              |

## States

| State                  | What the user sees                                                                 | Criteria      |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------- |
| Loading                | Skeleton rows                                                                      |               |
| Empty                  | Not possible: a project always has a Project admin                                 | BR-PROJECT-12 |
| Error                  | MSG-COMMON-01 with "Try again"                                                     |               |
| No permission (Member) | Table without Add; Access and Job title shown as text; no Remove; Leave on own row | AC-PROJECT-29 |
| Archived project       | Read-only for everyone, no Leave                                                   | BR-PROJECT-08 |
| Success                | Toast MSG-PROJECT-19                                                               |               |

## Permissions

Job titles play no part (BR-PROJECT-37).

| Access level                | Can see     | Can do                                                                                                                                                 |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project admin, System admin | All members | Add, change access level and job title, remove anyone (other Project admins included); change own job title; leave while another Project admin remains |
| Member                      | All members | Leave                                                                                                                                                  |

## Accessibility

- Table with caption "Project members"; the current user's row says "(you)" in text.
- Each row's selects have accessible names "Access of <name>" and "Job title of <name>"; each Remove button
  "Remove <name>".
- Your own access is plain text, described with `aria-describedby` by a visually hidden MSG-PROJECT-22 ("You cannot
  change your own access level").
- Errors from a row change appear in `role="alert"` above the table; focus returns to the select.

## Responsive

Below 768 px each member is a card: name and email, then access, job title and actions on the next line.

## Locators for tests

`getByRole('button', { name: 'Add member' })`, `getByRole('dialog', { name: 'Add member' })`,
`getByLabel('User')`, `getByLabel('Access')`, `getByLabel('Job title')`, `getByRole('row', { name: /Linh QA/ })`,
`getByRole('combobox', { name: 'Access of Linh QA' })`, `getByRole('combobox', { name: 'Job title of Linh QA' })`,
`getByRole('button', { name: 'Remove Dev Nguyen' })`, `getByRole('button', { name: 'Leave' })`.

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version                                                                           | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
