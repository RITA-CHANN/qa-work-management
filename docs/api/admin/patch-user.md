---
id: API-ADMIN-06
title: PATCH /api/admin/users/:id
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-01, BR-ADMIN-08, BR-ADMIN-09, BR-ADMIN-14, BR-ADMIN-16]
  acceptance: [AC-ADMIN-06, AC-ADMIN-15, AC-ADMIN-21]
  design: [SCR-ADMIN-03]
updated: 2026-10-09
---

# PATCH /api/admin/users/:id

Changes a user's global role (Admin / User, BR-ADMIN-08). The new role applies on the user's next request: the
session reads the role fresh every time. Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`adminUserUpdateSchema`, `adminUserSchema`)          |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Path parameters

| Name | Type   | Description |
| ---- | ------ | ----------- |
| `id` | string | User id     |

### Body

| Field        | Type                | Required | Rules        |
| ------------ | ------------------- | -------- | ------------ |
| `globalRole` | `"ADMIN"`, `"USER"` | yes      | The new role |

Only `globalRole` is accepted; status changes have their own endpoints (deactivate, reactivate). Unknown fields
are rejected (400).

```json
{ "globalRole": "ADMIN" }
```

## Responses

### 200 OK

The user as an [AdminUser](get-users.md#200-ok). Sending the role the user already has returns 200 with no change
and no audit event.

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                                                     |
| ------ | -------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09 | Body is not `application/json`                                                                           |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                                            |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                                                      |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01)                            |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | `globalRole` missing or not `ADMIN` / `USER`, or an unknown field                                        |
| 422    | `OWN_ACCOUNT`              | MSG-ADMIN-04  | `:id` is the caller (BR-ADMIN-09); checked before the user is looked up                                  |
| 404    | `NOT_FOUND`                | MSG-ADMIN-16  | No user with this id                                                                                     |
| 422    | `LAST_ADMIN`               | MSG-ADMIN-03  | Demoting an active Admin when no other active Admin exists, checked inside the transaction (BR-ADMIN-09) |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Admin-only; an Admin can't change their own role (BR-ADMIN-09)                                  |
| API2 Broken authentication                                                       | Session cookie required; the role is read fresh on every request, so a demotion applies at once |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict body with `globalRole` only                                                              |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; one update per call                                                       |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01)      |

## Side effects

Idempotent: the same role twice leaves one change. When the role changes, in one transaction (BR-ADMIN-16):
updates `users.global_role` and adds an audit event `user.role_changed` with `before` and `after`
`{ globalRole }`. Sessions are kept.

## Example

```bash
curl -i -b admin-cookies.txt -X PATCH http://localhost:3000/api/admin/users/cm123 \
  -H 'Content-Type: application/json' -d '{"globalRole":"ADMIN"}'
```

## Test ideas

| Type        | Case                                                 | Expected                                                    |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Happy path  | Promote a signed-in test user                        | 200; their next `GET /api/admin/users` is 200 (AC-ADMIN-15) |
| Negative    | Ada demotes herself                                  | 422 `OWN_ACCOUNT`, MSG-ADMIN-04 (AC-ADMIN-06)               |
| Concurrency | Test Admins A and B demote each other at once        | One 200, one 422 `LAST_ADMIN` (AC-ADMIN-21)                 |
| Negative    | Made-up id                                           | 404 MSG-ADMIN-16                                            |
| Validation  | `{"globalRole":"OWNER"}`; `{"status":"DEACTIVATED"}` | 400                                                         |
| Audit       | After a change                                       | `user.role_changed` with `USER` → `ADMIN`                   |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
