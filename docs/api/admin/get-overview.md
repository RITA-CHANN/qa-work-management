---
id: API-ADMIN-01
title: GET /api/admin/overview
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-01, US-ADMIN-02, BR-ADMIN-01, BR-ADMIN-02]
  acceptance: [AC-ADMIN-01, AC-ADMIN-02]
  design: [SCR-ADMIN-01]
updated: 2026-10-09
---

# GET /api/admin/overview

The KPIs and the project table of the all-projects dashboard (SCR-ADMIN-01, BR-ADMIN-02), in one call. Status
codes follow RFC 9110; errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`adminOverviewSchema`, `adminProjectSchema`)         |

## Request

No parameters and no body.

## Responses

### 200 OK

```json
{
  "data": {
    "activeProjects": 3,
    "archivedProjects": 1,
    "activeUsers": 10,
    "totalUsers": 11,
    "admins": 1,
    "failedSignIns7d": 2,
    "adminActions7d": 1,
    "projects": [
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
}
```

| Field              | Type           | Description                                                                                               |
| ------------------ | -------------- | --------------------------------------------------------------------------------------------------------- |
| `activeProjects`   | integer        | Projects not archived                                                                                     |
| `archivedProjects` | integer        | Archived projects                                                                                         |
| `activeUsers`      | integer        | Users with status `ACTIVE`                                                                                |
| `totalUsers`       | integer        | All users, deactivated included                                                                           |
| `admins`           | integer        | Active users with global role `ADMIN`                                                                     |
| `failedSignIns7d`  | integer        | Audit events `auth.sign_in_failed` in the last 7 × 24 hours                                               |
| `adminActions7d`   | integer        | Audit events with `actedAs = ADMIN` in the last 7 × 24 hours                                              |
| `projects`         | AdminProject[] | Every project, same rows and order as [GET /api/admin/projects](get-projects.md#200-ok) with `status=all` |

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Admin-only data about every project, by design                                             |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                     |
| API3 Broken object property level authorization (data exposure, mass assignment) | Names and counts only; no emails, no cost data                                             |
| API4 Unrestricted resource consumption                                           | A fixed set of counts plus one row per project (the workspace has tens of projects)        |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01) |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b admin-cookies.txt http://localhost:3000/api/admin/overview
```

## Test ideas

| Type       | Case                          | Expected                                                                          |
| ---------- | ----------------------------- | --------------------------------------------------------------------------------- |
| Happy path | Ada after a fresh seed        | `admins` 1, `failedSignIns7d` 2, `adminActions7d` 1, SECRET and OLD in `projects` |
| Permission | Linh                          | 404, body equal to `GET /api/does-not-exist` except the path                      |
| Negative   | No cookie                     | 401                                                                               |
| Audit      | A wrong password, then reload | `failedSignIns7d` + 1                                                             |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
