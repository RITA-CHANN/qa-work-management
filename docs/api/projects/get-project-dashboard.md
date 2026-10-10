---
id: API-DASH-01
title: GET /api/projects/:key/dashboard
type: api
feature: dash
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements:
    [
      US-DASH-01,
      BR-DASH-03,
      BR-DASH-04,
      BR-DASH-05,
      BR-DASH-06,
      BR-DASH-07,
      BR-DASH-08,
      BR-GUEST-03,
      BR-GUEST-05,
    ]
  acceptance: [AC-DASH-01, AC-DASH-02, AC-DASH-05, AC-DASH-06, AC-DASH-07, AC-DASH-08, AC-DASH-09]
  design: [SCR-DASH-01, DD-PROJECT-04]
updated: 2026-10-09
---

# GET /api/projects/:key/dashboard

Everything the project dashboard shows, in one request (SCR-DASH-01): the release in focus, the current sprint,
deadlines, team counts and the 10 newest activity entries. Read-only; it computes nothing that other endpoints can't
show. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| **Auth**        | Any member, or System admin; a Guest only while the `dashboard` area is on, and only its areas' data |
| **Since phase** | 3 (3C)                                                                                               |
| **Schema**      | `packages/shared/src/dashboard.ts` (`projectDashboardSchema`)                                        |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

No query parameters and no body.

## Responses

### 200 OK

```json
{
  "data": {
    "asOf": "2026-10-09",
    "areas": ["releases", "members", "activity"],
    "release": {
      "id": "cm…",
      "name": "2.4",
      "status": "ACTIVE",
      "startDate": "2026-09-15",
      "targetDate": "2026-10-29",
      "daysToTarget": 20,
      "sprints": [
        { "id": "cm…", "name": "Sprint 3", "status": "COMPLETED" },
        { "id": "cm…", "name": "Sprint 4", "status": "ACTIVE" }
      ]
    },
    "sprint": {
      "id": "cm…",
      "name": "Sprint 4",
      "goal": "Checkout",
      "startDate": "2026-09-29",
      "endDate": "2026-10-12",
      "daysLeft": 3
    },
    "deadlines": [
      { "kind": "SPRINT_END", "id": "cm…", "name": "Sprint 4", "date": "2026-10-12", "days": 3 }
    ],
    "team": {
      "total": 8,
      "byAccess": { "PROJECT_ADMIN": 2, "MEMBER": 5, "GUEST": 1 },
      "byJobTitle": [
        { "jobTitle": "DEV", "count": 1 },
        { "jobTitle": "QAE", "count": 1 }
      ]
    },
    "activity": [
      {
        "id": "cm…",
        "action": "member.added",
        "entityType": "member",
        "entityId": "cm…",
        "summary": "Ada Admin added Pat Viewer as Member (Other)",
        "changes": null,
        "actor": { "id": "cm…", "name": "Ada Admin" },
        "createdAt": "2026-10-09T11:40:00.000Z"
      }
    ]
  }
}
```

| Field                  | Type            | Description                                                                                                                                                                                                                             |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `asOf`                 | string (date)   | Today's calendar date in UTC; every day count below is counted from it (DD-PROJECT-04)                                                                                                                                                  |
| `areas`                | string[]        | The areas the caller sees: always all three for members and System admins, the ones switched on for a Guest (BR-GUEST-03)                                                                                                               |
| `release`              | object \| null  | The Active release, else the Planned one with the earliest start date (no start date last), else `null` (BR-DASH-03). Left out when `releases` is not in `areas`                                                                        |
| `release.daysToTarget` | integer \| null | Days from `asOf` to `targetDate`; negative = overdue; `null` without a target date                                                                                                                                                      |
| `release.sprints`      | object[]        | The release's sprints by start date                                                                                                                                                                                                     |
| `sprint`               | object \| null  | The Active sprint, else `null` (BR-DASH-04). `daysLeft` negative = overdue (BR-PROJECT-34). Left out with `release`                                                                                                                     |
| `deadlines`            | object[]        | `RELEASE_TARGET` of releases not Released and `SPRINT_END` of sprints not Completed whose date is before `asOf + 14`; overdue first (oldest first), then soonest first (BR-DASH-05). `days` negative = overdue. Left out with `release` |
| `team`                 | object          | Counts of the members the caller may see (a Guest does not count other Guests, BR-GUEST-05); `byJobTitle` sorted by job title key, `null` = no job title, zero counts left out. Left out when `members` is not in `areas`               |
| `activity`             | object[]        | The 10 newest entries, newest first, as in [API-PROJECT-12](get-project-activity.md) (BR-DASH-07). Left out when `activity` is not in `areas`                                                                                           |

A field that is left out means "you may not see this"; `null` or `[]` means "there is nothing". No cost, budget, rate
or security data, for any caller (BR-DASH-08).

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`            | `messageId`    | When                                                                                             |
| ------ | ----------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 401    | `UNAUTHENTICATED` | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`       | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 404    | `NOT_FOUND`       | MSG-COMMON-07  | The caller is a Guest and the `dashboard` area is off for Guests (BR-GUEST-03)                   |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008)              |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                    |
| API3 Broken object property level authorization (data exposure, mass assignment) | Counts and names only, no emails; a Guest gets only the fields of areas switched on, decided on the server          |
| API4 Unrestricted resource consumption                                           | Fixed size: one release with its sprints, deadlines within 14 days plus overdue ones, 10 activity entries           |
| API5 Broken function level authorization                                         | Any member; `assertArea(ctx, "dashboard")` for a Guest, then each part only if `canSeeArea` allows it (BR-GUEST-03) |

## Side effects

Read-only, safe and idempotent. It does not change the caller's current project (only `PUT /api/me/current-project`
does).

## Example

```bash
curl -b cookies.txt 'http://localhost:3000/api/projects/SHOP/dashboard'
```

## Test ideas

| Type       | Case                                                                                    | Expected                                                                  |
| ---------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Happy path | Linh on SHOP after a fresh seed                                                         | `release.name` "2.4", `sprint.name` "Sprint 4", `sprint.daysLeft` 3       |
| Boundary   | A sprint ending today, one ending in 14 days, one in 15 days                            | `days` 0 and 14 are listed, 15 is not                                     |
| Boundary   | A Planned sprint whose end date has passed                                              | Listed first with a negative `days`                                       |
| Negative   | Project with no releases                                                                | `release` null, `sprint` null, `deadlines` []                             |
| Permission | Linh on SECRET (not a member); unknown key `NOPE`                                       | 404 MSG-PROJECT-06 for both                                               |
| Permission | Sam Stakeholder (Guest of SHOP) with `members` and `activity` off, then `dashboard` off | No `team` or `activity` key, `areas` ["releases"]; then 404 MSG-COMMON-07 |
| Security   | POST, PATCH or DELETE on the path                                                       | 404 route not found                                                       |

## Change log

| Date       | Change                 | Why                       |
| ---------- | ---------------------- | ------------------------- |
| 2026-10-09 | First version (design) | SCR-DASH-01 screen review |
