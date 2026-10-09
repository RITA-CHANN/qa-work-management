---
id: API-ME-01
title: GET /api/me/current-project
type: api
feature: shell
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-SHELL-02, BR-SHELL-03, BR-SHELL-04, BR-DASH-01]
  acceptance: [AC-SHELL-03, AC-SHELL-04]
  design: [SCR-SHELL-01, SCR-DASH-01]
updated: 2026-10-09
---

# GET /api/me/current-project

Returns the key of the project the shell opens on: the project switcher, the project links in the side nav and
the dashboard on `/` use it (BR-SHELL-04). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| **Auth**        | Logged in                                                 |
| **Since phase** | 3 (3C)                                                    |
| **Schema**      | `apps/api/src/modules/me/me.routes.ts` (no shared schema) |

## Request

No parameters and no body.

## Responses

### 200 OK

```json
{ "data": { "key": "MOBI" } }
```

| Field | Type           | Description                                                                |
| ----- | -------------- | -------------------------------------------------------------------------- |
| `key` | string \| null | Key of the current project; `null` when the user can see no active project |

How the key is chosen, in order:

1. The last project the user opened (`users.last_project_id`, set by [PUT](put-current-project.md)), if it is
   still **active** and the user can still see it (member, or any project for an Admin).
2. Otherwise the first active project the user can see, sorted by name, then key.
3. Otherwise `null` (the web app shows "No projects yet" with MSG-ADMIN-10 on `/`).

Archived projects are never returned. The stored `last_project_id` is not changed by this call.

### Errors

Body: `application/problem+json`.

| Status | `code`                     | `messageId`   | When                                                |
| ------ | -------------------------- | ------------- | --------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                       |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Only the caller's own setting; the stored project is returned only if the caller can still see it     |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                                |
| API3 Broken object property level authorization (data exposure, mass assignment) | Returns only a key the caller may see anyway                                                          |
| API4 Unrestricted resource consumption                                           | Two indexed queries; the candidate list is limited to the caller's projects (all projects for Admins) |
| API5 Broken function level authorization                                         | Any logged-in user                                                                                    |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt http://localhost:3000/api/me/current-project
```

## Test ideas

| Type       | Case                                                             | Expected                     |
| ---------- | ---------------------------------------------------------------- | ---------------------------- |
| Happy path | Linh after `PUT {"key":"MOBI"}`, new login                       | `MOBI` (AC-SHELL-04)         |
| Fallback   | Linh, nothing stored                                             | First active project by name |
| Fallback   | Stored project archived, or Linh removed from it                 | First active project by name |
| Boundary   | A user who is in no project                                      | `{ "key": null }`            |
| Permission | Ada (Admin, not a member of SECRET) after `PUT {"key":"SECRET"}` | `SECRET`                     |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
