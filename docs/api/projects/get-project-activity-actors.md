---
id: API-PROJECT-14
title: GET /api/projects/:key/activity/actors
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [BR-PROJECT-38, BR-GUEST-03]
  acceptance: [AC-PROJECT-82]
  design: [SCR-PROJECT-05, DD-PROJECT-02]
updated: 2026-10-09
---

# GET /api/projects/:key/activity/actors

Everyone who has at least one entry in the project's activity log, by name: the options of the Person filter on
SCR-PROJECT-05. It includes System admins who acted without being members and people who have left the project.
Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                           |
| --------------- | ------------------------------------------------------------------------- |
| **Auth**        | Any member, or System admin; a Guest only while the `activity` area is on |
| **Since phase** | 3                                                                         |
| **Schema**      | `packages/shared/src/activity.ts` (`activityActorSchema`)                 |

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
  "data": [
    {
      "id": "cm…",
      "name": "Ada Admin"
    },
    {
      "id": "cm…",
      "name": "Oanh Owner"
    }
  ]
}
```

| Field  | Type   | Description                                  |
| ------ | ------ | -------------------------------------------- |
| `id`   | string | User id; pass as `actorId` to API-PROJECT-12 |
| `name` | string | Current display name                         |

Sorted by name, then id. Names only, no emails.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`            | `messageId`    | When                                                                                             |
| ------ | ----------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 401    | `UNAUTHENTICATED` | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`       | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 404    | `NOT_FOUND`       | MSG-COMMON-07  | The caller is a Guest and the `activity` area is off for Guests (BR-GUEST-03)                    |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | Id and name only; only people who already appear in this project's log                                 |
| API4 Unrestricted resource consumption                                           | One row per distinct actor of one project                                                              |
| API5 Broken function level authorization                                         | Same rule as API-PROJECT-12, checked on the server with `assertArea(ctx, "activity")`                  |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt 'http://localhost:3000/api/projects/SHOP/activity/actors'
```

## Test ideas

| Type       | Case                                         | Expected                              |
| ---------- | -------------------------------------------- | ------------------------------------- |
| Happy path | SHOP from the seed                           | Contains Ada Admin, sorted by name    |
| Boundary   | A member who has left, after making a change | Still listed                          |
| Permission | Not a member; Guest with `activity` off      | 404 MSG-PROJECT-06; 404 MSG-COMMON-07 |

## Change log

| Date       | Change        | Why                                          |
| ---------- | ------------- | -------------------------------------------- |
| 2026-10-09 | First version | BR-PROJECT-38 (screen review SCR-PROJECT-05) |
