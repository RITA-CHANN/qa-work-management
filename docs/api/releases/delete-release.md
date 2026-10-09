---
id: API-RELEASE-04
title: DELETE /api/projects/:key/releases/:id
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [BR-PROJECT-18]
  acceptance: [AC-PROJECT-43, AC-PROJECT-53]
  design: [SCR-PROJECT-04, DD-PROJECT-04]
updated: 2026-10-09
---

# DELETE /api/projects/:key/releases/:id

Deletes a Planned release that has no milestones. Status codes follow RFC 9110; errors are RFC 9457 problem details
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
| `id`  | string | Release id                                      |

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
| 404    | `NOT_FOUND`          | MSG-COMMON-07  | `id` is not a release of this project                                                            |
| 403    | `FORBIDDEN`          | MSG-COMMON-06  | The caller's access level does not allow this action (BR-PROJECT-35)                             |
| 422    | `PROJECT_ARCHIVED`   | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                          |
| 422    | `DELETE_NOT_ALLOWED` | MSG-PROJECT-18 | Not `PLANNED`, or has milestones (BR-PROJECT-18)                                                 |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                       |
| API3 Broken object property level authorization (data exposure, mass assignment) | No body                                                                                                |
| API4 Unrestricted resource consumption                                           | One delete per call                                                                                    |
| API5 Broken function level authorization                                         | `release:write`                                                                                        |

## Side effects

Idempotent in effect (second call 404). Deletes the release and writes one activity entry `release.deleted`.

## Example

```bash
curl -i -b cookies.txt -X DELETE http://localhost:3000/api/projects/MOBI/releases/<id>
```

## Test ideas

| Type       | Case                                      | Expected |
| ---------- | ----------------------------------------- | -------- |
| Happy path | Planned, no milestones                    | 204      |
| Negative   | ACTIVE release; Planned 2.5 with Sprint 5 | 422; 422 |
| Permission | Member (Pat Viewer)                       | 403      |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
