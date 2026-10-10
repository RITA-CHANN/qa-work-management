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
      BR-PROJECT-40,
      BR-PROJECT-41,
      BR-GUEST-01,
      BR-GUEST-03,
      BR-GUEST-05,
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
      AC-PROJECT-91,
      AC-PROJECT-92,
      AC-PROJECT-93,
      AC-PROJECT-94,
      AC-PROJECT-95,
      AC-PROJECT-96,
      AC-PROJECT-97,
      AC-PROJECT-98,
      AC-PROJECT-99,
      AC-GUEST-01,
      AC-GUEST-04,
      AC-GUEST-06,
    ]
  api: [API-PROJECT-08, API-PROJECT-09, API-PROJECT-10, API-PROJECT-11, API-USER-01]
  design: [FLW-PROJECT-02, DD-PROJECT-01]
updated: 2026-10-10
---

# SCR-PROJECT-03 Members tab

Who is in the project, with which access level and job title. Project admins (and System admins) manage members
here; Members see the list. A Guest sees this tab only while the Members list area is switched on for Guests, and
then by name only, without other Guests (BR-GUEST-03, BR-GUEST-05).

## Layout

```
 Members (8)                                                                                  [ Add member ]
 Filter members [ Name, email or job title  ]   (All 8) (Project admin 2) (Member 5) (Guest 1)
 Showing 2 of 8                                                     ← only while a filter is set
┌──────────────────┬─────────────────┬──────────────────┬────────────────────────┬─────────────┬─────────────────────────────┐
│ Name             │ Email           │ Access           │ Job title              │ Added       │                             │
├──────────────────┼─────────────────┼──────────────────┼────────────────────────┼─────────────┼─────────────────────────────┤
│ Mai PM           │ pm@qawm.test    │ [Project admin▾] │ [Project manager (PM)▾]│ 12 Jul 2026 │                    [Remove] │
│ Oanh Owner (you) │ owner@qawm.test │ Project admin    │ [Product owner (PO) ▾] │ 12 Jul 2026 │ [Step down to Member][Leave]│
│ Linh QA          │ linh@qawm.test  │ [Member       ▾] │ [QA engineer (QAE)  ▾] │ 12 Jul 2026 │                    [Remove] │
└──────────────────┴─────────────────┴──────────────────┴────────────────────────┴─────────────┴─────────────────────────────┘

As a Member: Access and Job title are text ("Member", "QA engineer · QAE", or "—"), no Add, no Remove, no Step down.
As a Guest: as a Member, without the Email column; other Guests are not listed (the API leaves them out).

Dialog "Add member": User [search box: type a name or email → up to 20 suggestions "Name (email)";
                     members show "Already a member" and can't be picked], Access [select, default Member],
                     Job title [select, default "—"], [Cancel] [Add]
Dialog "Remove <name>?" / "Leave project?" / "Step down to Member?": message, [Cancel] [Remove | Leave | Step down]
```

## Fields

| Field           | Input type            | Required | Client validation                | Message        | Notes                                                                                                                       |
| --------------- | --------------------- | -------- | -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Filter members  | search                | no       | —                                | —              | Matches name, email (when shown) and job title name or key, ignoring case; `?q=` in the address (BR-PROJECT-40)             |
| Access chips    | toggle buttons        | no       | one at a time                    | —              | All, Project admin, Member, Guest, each with its count; `?access=` in the address (BR-PROJECT-40)                           |
| User (add)      | combobox with listbox | yes      | a user picked from the list      | MSG-PROJECT-40 | `GET /api/users?search=…&limit=20` as you type (200 ms pause); no match shows MSG-PROJECT-44 (BR-PROJECT-41, AC-PROJECT-24) |
| Access (add)    | select                | yes      | Project admin, Member or Guest   | —              | Default Member; all three levels offered to every Project admin (BR-PROJECT-23, BR-GUEST-01)                                |
| Job title (add) | select                | no       | one of the 11 job titles, or "—" | —              | Default "—" (none); options read "QA engineer (QAE)" (BR-PROJECT-37)                                                        |
| Access (row)    | select                | —        | —                                | —              | Saves on change; shown as plain text on your own row (BR-PROJECT-24)                                                        |
| Job title (row) | select                | —        | —                                | —              | Saves on change; editable on every row, your own included; "—" removes it                                                   |

## Actions

| Action                                                                       | Result                                                                                                                                                     | Criteria                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Add member → Add                                                             | `POST …/members`; row appears; toast                                                                                                                       | AC-PROJECT-23, AC-PROJECT-48, AC-PROJECT-73, AC-PROJECT-91 |
| Add without a user                                                           | MSG-PROJECT-40 under User, nothing sent                                                                                                                    | AC-PROJECT-93                                              |
| Server 409 `ALREADY_MEMBER`                                                  | Alert MSG-PROJECT-11 in the dialog                                                                                                                         | AC-PROJECT-24                                              |
| Change Access or Job title in a row                                          | `PATCH …/members/:userId` with only that field; toast; on error the select returns to the old value, an alert shows the message, focus stays on the select | AC-PROJECT-25, AC-PROJECT-48, AC-PROJECT-73, AC-PROJECT-75 |
| Step down to Member → confirm (own row, Project admin only)                  | `PATCH …/members/<me>` `{ access: MEMBER }`; dialog text MSG-PROJECT-42; the screen switches to the Member view                                            | AC-PROJECT-51                                              |
| Remove → confirm                                                             | `DELETE …/members/:userId`; dialog text MSG-PROJECT-41; row disappears                                                                                     | AC-PROJECT-26                                              |
| Leave → confirm                                                              | `DELETE …/members/<me>`; dialog text MSG-PROJECT-41 with "You"; go to `/projects`                                                                          | AC-PROJECT-28                                              |
| Step down, Leave or Remove of the only Project admin                         | The dialog shows MSG-PROJECT-12 instead and its button is disabled                                                                                         | AC-PROJECT-27, AC-PROJECT-94                               |
| Server 422 `LAST_PROJECT_ADMIN`                                              | Alert MSG-PROJECT-12, nothing changes                                                                                                                      | AC-PROJECT-27                                              |
| Server 422 `OWN_ACCESS` (only via API; the UI shows your own access as text) | Alert MSG-PROJECT-22                                                                                                                                       | AC-PROJECT-50                                              |
| Server 403                                                                   | Alert MSG-COMMON-06                                                                                                                                        | AC-PROJECT-29                                              |
| Type in Filter members, click a chip                                         | The list narrows at once; "Showing N of M"; reload keeps the filters                                                                                       | AC-PROJECT-95, AC-PROJECT-96                               |
| Clear filters                                                                | All members again, address without `q` and `access`                                                                                                        | AC-PROJECT-97                                              |

## States

| State                  | What the user sees                                                                              | Criteria      |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ------------- |
| Loading                | Heading "Members" without a count, four skeleton rows                                           |               |
| Empty                  | Not possible: a project always has a Project admin                                              | BR-PROJECT-12 |
| No match               | MSG-PROJECT-43 with "Clear filters"                                                             | AC-PROJECT-97 |
| Error                  | MSG-COMMON-01 with "Try again"                                                                  |               |
| No permission (Member) | Table without Add; Access and Job title shown as text; no Remove or Step down; Leave on own row | AC-PROJECT-29 |
| Guest                  | As a Member, without the Email column and without other Guests                                  | AC-GUEST-04   |
| Guest, area off        | No Members tab or nav item; the URL shows "Page not found" (MSG-COMMON-13)                      | AC-GUEST-01   |
| Archived project       | Read-only for everyone, no Leave, no Step down                                                  | BR-PROJECT-08 |
| Success                | Toast MSG-PROJECT-19                                                                            |               |

## Permissions

Job titles play no part (BR-PROJECT-37).

| Access level                | Can see                                                                                    | Can do                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project admin, System admin | All members                                                                                | Add, change access level and job title, remove anyone (other Project admins included); change own job title; step down to Member or leave while another Project admin remains; filter |
| Member                      | All members                                                                                | Filter, leave                                                                                                                                                                         |
| Guest                       | Names, access and job titles of everyone but other Guests, while the area is on; no emails | Filter (by name and job title), leave                                                                                                                                                 |

## Accessibility

- Table with caption "Project members" (cards: list "Project members"); the current user's row says "(you)" in text.
- Each row's selects have accessible names "Access of <name>" and "Job title of <name>"; each Remove button
  "Remove <name>".
- Your own access is plain text, described with `aria-describedby` by a visually hidden MSG-PROJECT-22 ("You cannot
  change your own access level").
- Errors from a row change appear in `role="alert"` above the table; focus stays on (or returns to) the select. The
  selects are never disabled while saving, so focus is not lost.
- Access chips are a group "Access level" of toggle buttons (`aria-pressed`); "Showing N of M" and MSG-PROJECT-43 are a
  `role="status"` region.
- User picker: WAI-ARIA combobox pattern (`aria-expanded`, `aria-activedescendant`); ↑ ↓ move, Enter picks, Esc
  closes the list without closing the dialog; members are options with `aria-disabled="true"`.

## Responsive

Below 768 px each member is a card: name and email, then Access, Job title and Added as labelled lines (selects full
width), then the actions. The filter box takes the full width and the chips wrap.

## Locators for tests

`getByRole('button', { name: 'Add member' })`, `getByRole('dialog', { name: 'Add member' })`,
`getByRole('combobox', { name: 'User' })`, `getByRole('option', { name: /Ada Admin/ })`, `getByLabel('Access')`,
`getByLabel('Job title')`, `getByRole('row', { name: /Linh QA/ })`,
`getByRole('combobox', { name: 'Access of Linh QA' })`, `getByRole('combobox', { name: 'Job title of Linh QA' })`,
`getByRole('button', { name: 'Remove Dev Nguyen' })`, `getByRole('button', { name: 'Leave' })`,
`getByRole('button', { name: 'Step down to Member' })`, `getByRole('alertdialog', { name: 'Step down to Member?' })`,
`getByLabel('Filter members')`, `getByRole('button', { name: /^Project admin/ })` (chip, `aria-pressed`).

## Change log

| Date       | Change                                                                                                                                                                                                                | Why                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-10-08 | First version                                                                                                                                                                                                         | Phase 3A                                                               |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                                                                                                                               | Linh's decision 2026-10-09                                             |
| 2026-10-09 | Guest access level in the Access selects; for a Guest no Email column, no other Guests, tab only while the area is on                                                                                                 | Guest access (BR-GUEST-01, BR-GUEST-03, BR-GUEST-05)                   |
| 2026-10-10 | User picker searches every active user; Step down to Member; last Project admin warned up front; filter box and access chips; Added column; cards below 768 px; skeleton; texts in the catalog (MSG-PROJECT-40 to 44) | Screen review SCR-PROJECT-03, Linh approved A1–A7, B1, B2 (2026-10-10) |
