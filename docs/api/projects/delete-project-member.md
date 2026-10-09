---
id: API-PROJECT-11
title: DELETE /api/projects/:key/members/:userId
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-05, BR-PROJECT-06, BR-PROJECT-12, BR-PROJECT-23]
  acceptance: [AC-PROJECT-26, AC-PROJECT-27, AC-PROJECT-28, AC-PROJECT-48, AC-PROJECT-75]
  design: [FLW-PROJECT-02, SCR-PROJECT-03]
updated: 2026-10-09
---

# DELETE /api/projects/:key/members/:userId

Removes a member, or lets the caller leave (when `userId` is the caller). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| **Auth**        | Project admin (or System admin) to remove others, other Project admins included; any member to leave |
| **Since phase** | 3                                                                                                    |
| **Schema**      | —                                                                                                    |

## Request

### Path parameters

| Name     | Type   | Description                                             |
| -------- | ------ | ------------------------------------------------------- |
| `key`    | string | Project key, case-insensitive (`shop` = `SHOP`)         |
| `userId` | string | The member to remove; the caller's own id means "leave" |

No body.

## Responses

### 204 No Content

No body.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`               | `messageId`    | When                                                                                             |
| ------ | -------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 401    | `UNAUTHENTICATED`    | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`          | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 403    | `FORBIDDEN`          | MSG-COMMON-06  | A Member removes someone else (needs `member:manage`)                                            |
| 422    | `PROJECT_ARCHIVED`   | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                          |
| 404    | `NOT_FOUND`          | MSG-COMMON-07  | `userId` is not a member                                                                         |
| 422    | `LAST_PROJECT_ADMIN` | MSG-PROJECT-12 | Would leave no Project admin (BR-PROJECT-12)                                                     |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | No body                                                                                                |
| API4 Unrestricted resource consumption                                           | One delete per call                                                                                    |
| API5 Broken function level authorization                                         | `member:manage` (Project admin) to remove others, none needed to leave                                 |

## Side effects

Idempotent in effect: the second call gets 404. Deletes the row and writes one activity entry (`member.removed` or `member.left`). The removed user gets 404 on the project from their next request.

## Example

```bash
curl -i -b cookies.txt -X DELETE http://localhost:3000/api/projects/SHOP/members/<id>
```

## Test ideas

| Type       | Case                                                    | Expected                 |
| ---------- | ------------------------------------------------------- | ------------------------ |
| Happy path | Project admin removes Dev Nguyen; Dev calls GET project | 204; 404                 |
| Negative   | Only Project admin leaves                               | 422 `LAST_PROJECT_ADMIN` |
| Permission | Member removes someone else; Member leaves              | 403; 204                 |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
