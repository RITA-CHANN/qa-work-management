---
id: API-SEARCH-01
title: GET /api/search
type: api
feature: shell
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-SHELL-03, BR-SHELL-06, BR-PROJECT-06]
  acceptance: [AC-SHELL-05]
  design: [SCR-SHELL-01]
updated: 2026-10-09
---

# GET /api/search

Finds projects, releases, sprints (milestones) and, for Admins, users by text. Used by the ⌘K / Ctrl+K search of
the app shell (SCR-SHELL-01, BR-SHELL-06). Results follow the same access rules as the list endpoints. Status
codes follow RFC 9110; errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                             |
| --------------- | --------------------------------------------------------------------------- |
| **Auth**        | Logged in                                                                   |
| **Since phase** | 3 (3C)                                                                      |
| **Schema**      | `packages/shared/src/search.ts` (`searchQuerySchema`, `searchResultSchema`) |

## Request

### Query parameters

| Name | Type   | Required | Default | Description                                                          |
| ---- | ------ | -------- | ------- | -------------------------------------------------------------------- |
| `q`  | string | yes      | —       | Trimmed, 1–100 characters. Matched case-insensitively as a substring |

Any other query parameter is rejected (400).

## Responses

### 200 OK

A flat list, grouped in this order: projects, releases, milestones, users. At most 5 results per group
(`SEARCH_GROUP_LIMIT`).

```json
{
  "data": [
    {
      "group": "project",
      "id": "SHOP",
      "title": "ShopEase Web",
      "subtitle": "SHOP",
      "href": "/projects/SHOP"
    },
    {
      "group": "release",
      "id": "cm…",
      "title": "2.4",
      "subtitle": "SHOP · Release · Active",
      "href": "/projects/SHOP/releases"
    },
    {
      "group": "milestone",
      "id": "cm…",
      "title": "Sprint 4",
      "subtitle": "SHOP · 2.4 · Active",
      "href": "/projects/SHOP/releases"
    }
  ]
}
```

| Field      | Type                                              | Description                          |
| ---------- | ------------------------------------------------- | ------------------------------------ |
| `group`    | `"project"`, `"release"`, `"milestone"`, `"user"` | Which group the result belongs to    |
| `id`       | string                                            | Project key, or the row id           |
| `title`    | string                                            | Name to show                         |
| `subtitle` | string                                            | Context: key, release, status, email |
| `href`     | string                                            | Web app page the result opens        |

What each group matches and returns:

| Group       | Matches       | Order                   | Visible to the caller                     | `subtitle`                        | `href`                   |
| ----------- | ------------- | ----------------------- | ----------------------------------------- | --------------------------------- | ------------------------ |
| `project`   | key or name   | Active first, then name | Member projects; every project for Admins | `KEY`, or `KEY · Archived`        | `/projects/KEY`          |
| `release`   | name          | Project key, then name  | Releases of those projects                | `KEY · Release · <Status>`        | `/projects/KEY/releases` |
| `milestone` | name          | Project key, then name  | Milestones of those projects              | `KEY · <release name> · <Status>` | `/projects/KEY/releases` |
| `user`      | name or email | Name                    | **Admins only**; always empty for Users   | email                             | `/admin/users?user=<id>` |

Archived projects and their releases and milestones are included. No match returns `{ "data": [] }`; the web app
then shows MSG-SHELL-01.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                            |
| ------ | -------------------------- | ------------- | ------------------------------------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                   |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                             |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | `q` missing, empty after trimming, over 100 characters, or an unknown parameter |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                   |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Every query is filtered by membership (BR-PROJECT-06); a non-member never sees SECRET, its releases or sprints |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                                         |
| API3 Broken object property level authorization (data exposure, mass assignment) | Only names, keys and statuses; user emails only for Admins                                                     |
| API4 Unrestricted resource consumption                                           | `q` at most 100 characters; at most 5 rows per group, so at most 20 results                                    |
| API5 Broken function level authorization                                         | Any logged-in user; the `user` group is filled only for Admins                                                 |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt 'http://localhost:3000/api/search?q=sprint'
```

## Test ideas

| Type       | Case                                     | Expected                                |
| ---------- | ---------------------------------------- | --------------------------------------- |
| Happy path | Linh, `q=shop`                           | The SHOP project first                  |
| Permission | Linh, `q=Internal` (SECRET's name)       | `[]` (AC-SHELL-05)                      |
| Permission | Ada, `q=Internal`; Ada, `q=linh`         | SECRET listed; a `user` result for Linh |
| Permission | Linh, `q=linh`                           | No `user` group                         |
| Boundary   | `q=` (empty), `q=" "`, 100 and 101 chars | 400, 400, 200, 400                      |
| Boundary   | A text matching 6 releases               | 5 `release` results                     |
| Validation | `q=a&x=1`                                | 400, pointer `/x`                       |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
