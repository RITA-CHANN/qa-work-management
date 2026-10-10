---
id: SCR-PROJECT-05
title: Activity
type: screen
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /projects/:key/activity
traces:
  requirements:
    [US-PROJECT-09, BR-PROJECT-19, BR-PROJECT-20, BR-PROJECT-21, BR-PROJECT-38, BR-GUEST-03]
  acceptance:
    [
      AC-PROJECT-08,
      AC-PROJECT-44,
      AC-PROJECT-45,
      AC-PROJECT-46,
      AC-PROJECT-81,
      AC-PROJECT-82,
      AC-PROJECT-83,
      AC-PROJECT-84,
      AC-PROJECT-85,
      AC-PROJECT-86,
      AC-GUEST-02,
    ]
  api: [API-PROJECT-12, API-PROJECT-14]
  design: [DD-PROJECT-02]
updated: 2026-10-09
---

# SCR-PROJECT-05 Activity

Who changed what and when in this project, newest first, with filters to find one change in a long log.

## Layout

```
 Activity
 [Type: All ▾] [Person: Anyone ▾] [From date: yyyy-mm-dd] [To date: yyyy-mm-dd]   Clear filters
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ TODAY                                                                    │
 │ (OO) Oanh Owner edited release 2.4                                       │
 │      13:54 · Show changes                                                │
 │ (OO) Oanh Owner changed Linh QA's access from Member to Project admin    │
 │      13:54 · Hide changes                                                │
 │        Access: Member → Project admin                                    │
 │        Job title: QA engineer → QA lead                                  │
 │ SAT, 11 JUL 2026                                                         │
 │ (AA) Ada Admin added Pat Viewer as Member (Other)                        │
 │      00:00                                                               │
 └──────────────────────────────────────────────────────────────────────────┘
                              [ Load more ]
```

- Entries sit in one card (style v2.1), grouped by the viewer's local day: "Today", "Yesterday", then
  "Thu, 8 Oct 2026". A group that continues on the next page keeps one heading.
- Each entry: the actor's initials in a round avatar, the summary, then the time `HH:mm` and "Show changes" when the
  entry has changes.
- The Dashboard's "Recent activity" card (SCR-DASH-01) uses the same entry, without day groups and with the full date.

## Fields

| Field     | Type   | Values                                                                    | Default | Validation                           | Criteria      |
| --------- | ------ | ------------------------------------------------------------------------- | ------- | ------------------------------------ | ------------- |
| Type      | Select | All · Project · Members · Releases · Milestones (`entityType`)            | All     | —                                    | AC-PROJECT-81 |
| Person    | Select | Anyone, then everyone with an entry in this log, by name (API-PROJECT-14) | Anyone  | —                                    | AC-PROJECT-82 |
| From date | Date   | A day, inclusive                                                          | empty   | —                                    | AC-PROJECT-83 |
| To date   | Date   | A day, inclusive                                                          | empty   | Not before From date: MSG-PROJECT-34 | AC-PROJECT-83 |

Filters are in the address: `?type=member&actor=<userId>&from=2026-10-01&to=2026-10-09`. Unknown values in the
address are ignored (the field shows its default). From and To are local days; the page sends the API the start of
From and the start of the day after To as ISO date-times.

## Actions

| Action          | Result                                                                                                        | Criteria      |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ------------- |
| Open the page   | `GET …/activity?limit=20` plus the filters in the address; `GET …/activity/actors` for Person                 | AC-PROJECT-44 |
| Change a filter | Address updated (replaces the history entry), list reloads from the first page                                | AC-PROJECT-86 |
| Clear filters   | Shown only while a filter is set; removes all filters                                                         | AC-PROJECT-84 |
| Show changes    | Expands the old → new value of each changed field, in display names                                           | AC-PROJECT-85 |
| Load more       | `GET …/activity?limit=20&cursor=<last id>` with the same filters; appends; hidden when `nextCursor` is `null` | AC-PROJECT-45 |

### How changes are shown (BR-PROJECT-20)

| Field                                | Shown as                                             |
| ------------------------------------ | ---------------------------------------------------- |
| `access`                             | Access level name: "Member → Project admin"          |
| `jobTitle`                           | Job title name: "QA engineer → QA lead"; none is "—" |
| `status` (release, milestone)        | Status name: "Active → Released"                     |
| `guestAreas`                         | "Guest can see": area names joined by ", "; none "—" |
| Dates (`startDate`, `targetDate`, …) | `2026-10-29` as stored                               |
| Free text (`name`, `description`, …) | In quotes: `"ShopEase" → "ShopEase Web"`; empty "—"  |

The label is the field name in sentence case ("Target date"). Stored data does not change.

## States

| State         | What the user sees                                                        | Criteria      |
| ------------- | ------------------------------------------------------------------------- | ------------- |
| Loading       | Filters and skeleton entries                                              |               |
| Empty         | Not possible without filters: creating a project writes the first entry   | AC-PROJECT-08 |
| No match      | MSG-PROJECT-35 inside the card; "Clear filters" stays next to the filters | AC-PROJECT-84 |
| Invalid range | MSG-PROJECT-34 under To date; the list keeps the last valid result        | AC-PROJECT-83 |
| Error         | MSG-COMMON-01 with "Try again"                                            |               |
| No permission | Every member can read; non-members get "Project not found"                | BR-PROJECT-06 |
| Success       | Grouped list; no edit or delete controls anywhere                         | AC-PROJECT-46 |
| Loading more  | "Load more" disabled, `aria-busy` on the list                             |               |

## Permissions

| Access level                        | Can see                                                                                          | Can do                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------- |
| Project admin, Member, System admin | All entries                                                                                      | Read, filter, load more |
| Guest                               | All entries while the `activity` area is on; otherwise no tab and "Page not found" (BR-GUEST-03) | Read, filter, load more |
| Not a member                        | "Project not found"                                                                              | —                       |

## Accessibility

- The card is a region named "Activity". Each day is an `<h3>` followed by an `<ol>` named after the day
  ("Today"); each entry is an `<li>`. Times are `<time datetime="…">` with the full date and time in the `title`.
- The avatar is decorative (`aria-hidden`); the name is in the summary.
- Every filter has a visible label; the To error is linked with `aria-describedby` and the field gets
  `aria-invalid`.
- "Show changes" is a button with `aria-expanded`.
- After "Load more", focus moves to the first new entry and a `role="status"` message says "5 more entries loaded".
  The no-match message is `role="status"`.

## Responsive

Filters wrap onto more lines; long summaries wrap.

## Locators for tests

`getByRole('region', { name: 'Activity' })`, then `.getByRole('listitem')`;
`getByRole('list', { name: 'Today' })`; `getByLabel('Type')`, `getByLabel('Person')`, `getByLabel('From date')`,
`getByLabel('To date')`; `getByRole('button', { name: 'Clear filters' })`, `getByRole('button', { name: 'Load more' })`,
`getByRole('button', { name: 'Show changes' })`.

## Change log

| Date       | Change                                                                                                     | Why                          |
| ---------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 2026-10-08 | First version                                                                                              | Phase 3A                     |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                    | Linh's decision 2026-10-09   |
| 2026-10-09 | Guest row                                                                                                  | Phase 3C (BR-GUEST-03)       |
| 2026-10-09 | Filters (type, person, date range) in the address; display names in changes; day groups and avatars (v2.1) | Screen review SCR-PROJECT-05 |
