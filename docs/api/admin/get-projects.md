---
id: API-ADMIN-02
title: GET /api/admin/projects
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-03, BR-ADMIN-01, BR-ADMIN-02, BR-ADMIN-03]
  acceptance: [AC-ADMIN-01, AC-ADMIN-02]
  design: [SCR-ADMIN-02]
updated: 2026-10-09
---

# GET /api/admin/projects

Every project in the workspace, archived included, for Admin console › Projects (SCR-ADMIN-02, BR-ADMIN-03). The
row actions (archive, restore, delete) use the normal project endpoints, where an Admin acts as Owner
(BR-PROJECT-36). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`adminProjectListQuerySchema`, `adminProjectSchema`) |

## Request

### Query parameters

| Name     | Type                              | Required | Default | Description                                                      |
| -------- | --------------------------------- | -------- | ------- | ---------------------------------------------------------------- |
| `search` | string                            | no       | —       | Trimmed, 1–100 characters; matches key or name, case-insensitive |
| `status` | `"active"`, `"archived"`, `"all"` | no       | `all`   | Which projects to list                                           |

Any other query parameter is rejected (400).

## Responses

### 200 OK

Active projects first, then archived; by name inside each.

```json
{
  "data": [
    {
      "key": "SHOP",
      "name": "ShopEase Web",
      "archived": false,
      "memberCount": 8,
      "projectAdmins": [{ "id": "cm…", "name": "Oanh Owner" }],
      "activeRelease": { "name": "2.4", "targetDate": "2026-11-30" },
      "activeMilestone": { "name": "Sprint 4", "endDate": "2026-10-17" },
      "lastActivityAt": "2026-10-09T07:12:00.000Z",
      "createdAt": "2026-09-01T08:00:00.000Z"
    }
  ]
}
```

| Field             | Type                                 | Description                                                                                  |
| ----------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `key`             | string                               | Project key                                                                                  |
| `name`            | string                               | Project name                                                                                 |
| `archived`        | boolean                              | `true` when archived                                                                         |
| `memberCount`     | integer                              | Number of members                                                                            |
| `projectAdmins`   | { id, name }[]                       | Members who count as Project admin. Until role model v2 (PR #13) lands, that is role `OWNER` |
| `activeRelease`   | { name, targetDate \| null } \| null | The `ACTIVE` release; `targetDate` is a calendar date `YYYY-MM-DD`                           |
| `activeMilestone` | { name, endDate } \| null            | The `ACTIVE` milestone                                                                       |
| `lastActivityAt`  | string (ISO 8601) \| null            | Newest activity log entry of the project                                                     |
| `createdAt`       | string (ISO 8601)                    | When the project was created                                                                 |

Not paginated: the list holds every matching project.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | Bad `status`, `search` too long or empty, or an unknown parameter             |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Admin-only list of every project, by design                                                |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                     |
| API3 Broken object property level authorization (data exposure, mass assignment) | Names only for Project admins; no emails                                                   |
| API4 Unrestricted resource consumption                                           | `search` at most 100 characters; one query with counts                                     |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01) |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b admin-cookies.txt 'http://localhost:3000/api/admin/projects?status=archived'
```

## Test ideas

| Type       | Case                   | Expected                                  |
| ---------- | ---------------------- | ----------------------------------------- |
| Happy path | Ada, no query          | SHOP, MOBI, SECRET, then the archived OLD |
| Filter     | `status=archived`      | Only OLD                                  |
| Filter     | `search=shop`          | Only SHOP                                 |
| Validation | `status=closed`; `x=1` | 400                                       |
| Permission | Linh                   | 404 (AC-ADMIN-01)                         |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
