---
id: API-ME-02
title: PUT /api/me/current-project
type: api
feature: shell
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-SHELL-02, BR-SHELL-03, BR-SHELL-04]
  acceptance: [AC-SHELL-03, AC-SHELL-04]
  design: [SCR-SHELL-01]
updated: 2026-10-09
---

# PUT /api/me/current-project

Remembers the project the user just opened, so the next visit (and the next login) opens it again (BR-SHELL-04).
The web app calls it when a `/projects/:key` page opens and when a project is chosen in the project switcher.
Status codes follow RFC 9110; errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| **Auth**        | Logged in; the project must be visible to the caller (member, or Admin)                                  |
| **Since phase** | 3 (3C)                                                                                                   |
| **Schema**      | `apps/api/src/modules/me/me.routes.ts`, key rule `projectKeySchema` in `packages/shared/src/projects.ts` |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

| Field | Type   | Required | Rules                                                                                 |
| ----- | ------ | -------- | ------------------------------------------------------------------------------------- |
| `key` | string | yes      | Trimmed and upper-cased, then `^[A-Z][A-Z0-9]{1,9}$` (MSG-PROJECT-01, MSG-PROJECT-02) |

Unknown fields are rejected (400).

```json
{ "key": "mobi" }
```

## Responses

### 200 OK

```json
{ "data": { "key": "MOBI" } }
```

| Field | Type   | Description                        |
| ----- | ------ | ---------------------------------- |
| `key` | string | The stored project key, upper-case |

An archived project is accepted and stored, but [GET](get-current-project.md) skips archived projects, so it falls
back to the first active one.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`    | When                                                                                       |
| ------ | -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09  | Body is not `application/json`                                                             |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05  | Not logged in                                                                              |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07   | Signed in with a one-time password not yet replaced                                        |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04  | Missing or malformed key, or an unknown field; `errors` lists each field                   |
| 404    | `NOT_FOUND`                | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not an Admin (same body for both, ADR-0008) |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                      |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict body with `key` only; writes only the caller's own `last_project_id`                 |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; one lookup and one update per call                                    |
| API5 Broken function level authorization                                         | Any logged-in user, for their own setting                                                   |

## Side effects

Idempotent: the same key twice stores the same value. Writes `users.last_project_id` of the caller. No activity or
audit entry.

## Example

```bash
curl -i -b cookies.txt -X PUT http://localhost:3000/api/me/current-project \
  -H 'Content-Type: application/json' -d '{"key":"MOBI"}'
```

## Test ideas

| Type       | Case                                         | Expected                                   |
| ---------- | -------------------------------------------- | ------------------------------------------ |
| Happy path | Linh, `{"key":"mobi"}`                       | 200 `MOBI`; GET returns `MOBI`             |
| Negative   | Linh, `{"key":"SECRET"}` (not a member)      | 404 MSG-PROJECT-06, stored value unchanged |
| Negative   | `{"key":"NOPE"}`                             | 404, same body as SECRET                   |
| Validation | `{}`; `{"key":"1A"}`; `{"key":"SHOP","x":1}` | 400                                        |
| Security   | Sent as `text/plain`                         | 415                                        |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
