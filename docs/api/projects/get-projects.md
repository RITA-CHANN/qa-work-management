---
id: API-PROJECT-01
title: GET /api/projects
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements:
    [US-PROJECT-02, US-PROJECT-10, BR-PROJECT-06, BR-PROJECT-08, BR-PROJECT-36, BR-GUEST-03]
  acceptance:
    [
      AC-PROJECT-09,
      AC-PROJECT-10,
      AC-PROJECT-11,
      AC-PROJECT-12,
      AC-PROJECT-13,
      AC-PROJECT-77,
      AC-PROJECT-79,
    ]
  design: [SCR-PROJECT-01]
updated: 2026-10-09
---

# GET /api/projects

Lists the projects the caller is a member of (every project for a System admin), for the project list (SCR-PROJECT-01). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | Logged in                                                                            |
| **Since phase** | 3                                                                                    |
| **Schema**      | `packages/shared/src/projects.ts` (`projectListQuerySchema`, `projectSummarySchema`) |

## Request

### Query parameters

| Name       | Type    | Required | Default | Description                                               |
| ---------- | ------- | -------- | ------- | --------------------------------------------------------- |
| `search`   | string  | no       | —       | Part of a key or name, case-insensitive, 1–100 characters |
| `archived` | boolean | no       | `false` | `true` also returns archived projects                     |

## Responses

### 200 OK

```json
{
  "data": [
    {
      "key": "SHOP",
      "name": "ShopEase Web",
      "archivedAt": null,
      "myAccess": "MEMBER",
      "memberCount": 8,
      "activeRelease": {
        "id": "cm…",
        "name": "2.4"
      },
      "updatedAt": "2026-10-08T13:40:00.000Z"
    }
  ]
}
```

| Field           | Type                      | Description                                                                                                      |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `key`           | string                    | Project key, upper-case (BR-PROJECT-02)                                                                          |
| `name`          | string                    | Display name                                                                                                     |
| `archivedAt`    | string (ISO 8601) \| null | When it was archived; `null` = active                                                                            |
| `myAccess`      | ProjectAccess \| null     | Caller's access level (`PROJECT_ADMIN`, `MEMBER`, `GUEST`); `null` for a System admin who is not a member        |
| `memberCount`   | integer \| null           | Number of members; `null` for a Guest when the project's Guest switch "Members" is off (BR-GUEST-03)             |
| `activeRelease` | { id, name } \| null      | The `ACTIVE` release; `null` when there is none, or for a Guest when "Releases and sprints" is off (BR-GUEST-03) |
| `updatedAt`     | string (ISO 8601)         | Last change                                                                                                      |

Sorted by name. No pagination in Phase 3: a user is in at most a few hundred projects (assumption in the requirements).

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`             | `messageId`   | When                                                                               |
| ------ | ------------------ | ------------- | ---------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | MSG-COMMON-04 | Body or query fails the schema; `errors` lists each field with its own `messageId` |
| 401    | `UNAUTHENTICATED`  | MSG-COMMON-05 | Not logged in                                                                      |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                              |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Filters by the caller's memberships in the query; a System admin sees all (BR-PROJECT-36) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                          |
| API3 Broken object property level authorization (data exposure, mass assignment) | Summary fields only; no member emails                                                     |
| API4 Unrestricted resource consumption                                           | `search` at most 100 characters; result bounded by membership                             |
| API5 Broken function level authorization                                         | Any logged-in user                                                                        |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt 'http://localhost:3000/api/projects?search=shop&archived=true'
```

## Test ideas

| Type       | Case                               | Expected                                               |
| ---------- | ---------------------------------- | ------------------------------------------------------ |
| Happy path | Linh QA lists projects             | SHOP and MOBI only (OLD archived, SECRET not a member) |
| Negative   | No cookie                          | 401                                                    |
| Boundary   | `search` of 100 and 101 characters | 200, then 400                                          |
| Permission | Ada Admin lists projects           | All four, `myAccess` null where not a member           |

## Change log

| Date       | Change                                                                                                                      | Why                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                                                        | Phase 3A                                 |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects                                     | Linh's decision 2026-10-09               |
| 2026-10-09 | `myAccess` can be `GUEST`                                                                                                   | Guest access (BR-GUEST-01, BR-GUEST-02)  |
| 2026-10-09 | `memberCount` and `activeRelease` are `null` for a Guest when that area is off; System admin rows keep their active release | Project list screen review (BR-GUEST-03) |
