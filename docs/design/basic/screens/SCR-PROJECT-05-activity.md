---
id: SCR-PROJECT-05
title: Activity tab
type: screen
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /projects/:key/activity
traces:
  requirements: [US-PROJECT-09, BR-PROJECT-19, BR-PROJECT-20, BR-PROJECT-21]
  acceptance: [AC-PROJECT-08, AC-PROJECT-44, AC-PROJECT-45, AC-PROJECT-46]
  api: [API-PROJECT-12]
  design: [DD-PROJECT-02]
updated: 2026-10-08
---

# SCR-PROJECT-05 Activity tab

Who changed what and when in this project, newest first.

## Layout

```
 Activity
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ Minh Lead changed Linh QA's role from Viewer to QA Engineer              │
 │ 2026-10-08 14:02                                         ▸ Show changes  │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ Mai PM edited the project                                                │
 │ 2026-10-08 13:40                                         ▾ Hide changes  │
 │   Name: "ShopEase" → "ShopEase Web"                                      │
 └──────────────────────────────────────────────────────────────────────────┘
                              [ Load more ]
```

## Fields

None: the tab is read-only.

## Actions

| Action       | Result                                                                                         | Criteria      |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------- |
| Open the tab | `GET …/activity?limit=20`                                                                      | AC-PROJECT-44 |
| Show changes | Expands the old → new values of the entry                                                      | AC-PROJECT-19 |
| Load more    | `GET …/activity?limit=20&cursor=<last id>`; appends; button hidden when `nextCursor` is `null` | AC-PROJECT-45 |

## States

| State         | What the user sees                                         | Criteria      |
| ------------- | ---------------------------------------------------------- | ------------- |
| Loading       | Skeleton entries                                           |               |
| Empty         | Not possible: creating a project writes the first entry    | AC-PROJECT-08 |
| Error         | MSG-COMMON-01 with "Try again"                             |               |
| No permission | Every member can read; non-members get "Project not found" | BR-PROJECT-06 |
| Success       | List; no edit or delete controls anywhere                  | AC-PROJECT-46 |
| Loading more  | "Load more" disabled, `aria-busy` on the list              |               |

## Permissions

| Role                      | Can see             | Can do          |
| ------------------------- | ------------------- | --------------- |
| Every project role, Admin | All entries         | Read, load more |
| Not a member              | "Project not found" | —               |

## Accessibility

- The list is an `<ol>` with each entry an `<li>`; times are `<time datetime="…">`, shown in the browser's time
  zone with the full date in the `title`.
- "Show changes" is a button with `aria-expanded`.
- After "Load more", focus moves to the first new entry and a `role="status"` message says "5 more entries loaded".

## Responsive

Same layout; long summaries wrap.

## Locators for tests

`getByRole('list', { name: 'Activity' })`, `getByRole('listitem').first()`,
`getByRole('button', { name: 'Load more' })`, `getByRole('button', { name: 'Show changes' })`.

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-08 | First version | Phase 3A |
