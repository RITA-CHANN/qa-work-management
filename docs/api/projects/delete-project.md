---
id: API-PROJECT-07
title: DELETE /api/projects/:key
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-PROJECT-07, BR-PROJECT-09, BR-PROJECT-35]
  acceptance: [AC-PROJECT-33, AC-PROJECT-34, AC-PROJECT-35]
  design: [FLW-PROJECT-03, SCR-PROJECT-02]
updated: 2026-10-09
---

# DELETE /api/projects/:key

Deletes an archived project that has no releases, for good (Project admins only). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                 |
| --------------- | ------------------------------- |
| **Auth**        | Project admin (or System admin) |
| **Since phase** | 3                               |
| **Schema**      | —                               |

## Request

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

No body.

## Responses

### 204 No Content

No body.

The "type the key to confirm" step is in the web app only; the API trusts the Project admin.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`               | `messageId`    | When                                                                                             |
| ------ | -------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 401    | `UNAUTHENTICATED`    | MSG-COMMON-05  | Not logged in                                                                                    |
| 404    | `NOT_FOUND`          | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 403    | `FORBIDDEN`          | MSG-COMMON-06  | Caller is a Member (not a Project admin or System admin)                                         |
| 422    | `DELETE_NOT_ALLOWED` | MSG-PROJECT-09 | The project is active, or archived with releases (BR-PROJECT-09)                                 |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | No body                                                                                                |
| API4 Unrestricted resource consumption                                           | One delete per call                                                                                    |
| API5 Broken function level authorization                                         | `assertCan(access, "project:delete")`: Project admin                                                   |

## Side effects

Idempotent in effect: a second call gets 404 because the project is gone. Deletes the project, its members and its activity entries (cascade); no activity entry is kept.

## Example

```bash
curl -i -b cookies.txt -X DELETE http://localhost:3000/api/projects/DEMO
```

## Test ideas

| Type       | Case                                          | Expected             |
| ---------- | --------------------------------------------- | -------------------- |
| Happy path | Archived project without releases             | 204, then GET is 404 |
| Negative   | Active project; archived `OLD` with a release | 422 for both         |
| Permission | Member on an archived project                 | 403                  |
| Boundary   | Delete, then create the same key again        | 201 (key is free)    |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
