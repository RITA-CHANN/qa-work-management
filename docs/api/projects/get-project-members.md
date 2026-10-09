---
id: API-PROJECT-08
title: GET /api/projects/:key/members
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-05, BR-PROJECT-10, BR-PROJECT-37, BR-GUEST-03, BR-GUEST-05]
  acceptance: [AC-PROJECT-23, AC-PROJECT-29, AC-PROJECT-73, AC-GUEST-01, AC-GUEST-04]
  design: [SCR-PROJECT-03]
updated: 2026-10-09
---

# GET /api/projects/:key/members

Lists the members of a project with their access level and job title (SCR-PROJECT-03). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                          |
| --------------- | ------------------------------------------------------------------------ |
| **Auth**        | Any member, or System admin; a Guest only while the `members` area is on |
| **Since phase** | 3                                                                        |
| **Schema**      | `packages/shared/src/projects.ts` (`memberSchema`)                       |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

## Responses

### 200 OK

```json
{
  "data": [
    {
      "userId": "cm…",
      "name": "Linh QA",
      "email": "linh@qawm.test",
      "access": "MEMBER",
      "jobTitle": "QAE",
      "addedAt": "2026-09-01T08:00:00.000Z"
    }
  ]
}
```

| Field      | Type              | Description                                                                                                             |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `userId`   | string            | User id                                                                                                                 |
| `name`     | string            | Display name                                                                                                            |
| `email`    | string \| null    | Email (members can see each other's email); `null` for everyone but themselves when the caller is a Guest (BR-GUEST-05) |
| `access`   | ProjectAccess     | `PROJECT_ADMIN`, `MEMBER` or `GUEST`                                                                                    |
| `jobTitle` | JobTitle \| null  | Job title key, or `null` for none                                                                                       |
| `addedAt`  | string (ISO 8601) | When the person joined                                                                                                  |

Sorted by access level (Project admins, then Members, then Guests), then name. When the caller is a Guest the list
leaves out the other Guests (the caller is still listed) and every `email` but the caller's own is `null`
(BR-GUEST-05).

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`            | `messageId`    | When                                                                                             |
| ------ | ----------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 401    | `UNAUTHENTICATED` | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`       | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 404    | `NOT_FOUND`       | MSG-COMMON-07  | The caller is a Guest and the `members` area is off for Guests (BR-GUEST-03)                     |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008)                             |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                                                   |
| API3 Broken object property level authorization (data exposure, mass assignment) | `userId`, `name`, `email`, `access`, `jobTitle`, `addedAt` only; for a Guest no emails of others and no other Guests (BR-GUEST-05) |
| API4 Unrestricted resource consumption                                           | Bounded by project size                                                                                                            |
| API5 Broken function level authorization                                         | Any member; `assertArea(ctx, "members")` for a Guest, checked on the server (BR-GUEST-03)                                          |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt http://localhost:3000/api/projects/SHOP/members
```

## Test ideas

| Type       | Case                                                | Expected                                                                             |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Happy path | SHOP as Pat Viewer                                  | 8 members: Oanh Owner and Mai PM (Project admins) first, then 6 Members by name      |
| Negative   | SECRET as Linh QA                                   | 404                                                                                  |
| Security   | Response                                            | No `passwordHash`, no session data                                                   |
| Permission | SHOP as Sam Stakeholder (Guest), `members` area off | 404 MSG-COMMON-07                                                                    |
| Permission | SHOP as Sam, `members` on, a second Guest added     | Sam's own row has his email; others have `email` null; the other Guest is not listed |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
| 2026-10-09 | Guest: 404 while the `members` area is off; names only and no other Guests              | BR-GUEST-03, BR-GUEST-05   |
