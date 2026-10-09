---
id: API-ADMIN-08
title: POST /api/admin/users/:id/reactivate
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-04, BR-ADMIN-01, BR-ADMIN-09, BR-ADMIN-10, BR-ADMIN-14, BR-ADMIN-16]
  acceptance: [AC-ADMIN-07]
  design: [SCR-ADMIN-03]
updated: 2026-10-09
---

# POST /api/admin/users/:id/reactivate

Lets a deactivated user sign in again with their existing password (BR-ADMIN-10). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------- |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404)     |
| **Since phase** | 3 (3C)                                                                                   |
| **Schema**      | `packages/shared/src/admin.ts` (`emptyBodySchema` from `projects.ts`, `adminUserSchema`) |

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

Empty object `{}`; any field is rejected (400).

## Responses

### 200 OK

The user as an [AdminUser](get-users.md#200-ok) with `status: "ACTIVE"`. A user who is already active is returned
unchanged (200, no audit event).

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09 | Body is not `application/json`                                                |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | The body has a field                                                          |
| 422    | `OWN_ACCOUNT`              | MSG-ADMIN-04  | `:id` is the caller (BR-ADMIN-09)                                             |
| 404    | `NOT_FOUND`                | MSG-ADMIN-16  | No user with this id                                                          |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Admin-only; an Admin can't change their own status (BR-ADMIN-09)                           |
| API2 Broken authentication                                                       | No session is created; the user signs in again with their own password                     |
| API3 Broken object property level authorization (data exposure, mass assignment) | Empty strict body                                                                          |
| API4 Unrestricted resource consumption                                           | One update per call                                                                        |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01) |

## Side effects

Idempotent. When the status changes, in one transaction (BR-ADMIN-16): sets `users.status = ACTIVE` and adds an
audit event `user.reactivated` with `before` `{ status: DEACTIVATED }` and `after` `{ status: ACTIVE }`.

## Example

```bash
curl -i -b admin-cookies.txt -X POST http://localhost:3000/api/admin/users/cm123/reactivate \
  -H 'Content-Type: application/json' -d '{}'
```

## Test ideas

| Type       | Case                               | Expected                                  |
| ---------- | ---------------------------------- | ----------------------------------------- |
| Happy path | Reactivate a deactivated test user | 200; they can sign in again (AC-ADMIN-07) |
| Boundary   | Already active                     | 200, unchanged, no audit entry            |
| Negative   | Ada on herself                     | 422 `OWN_ACCOUNT`                         |
| Negative   | Made-up id                         | 404 MSG-ADMIN-16                          |
| Permission | Linh                               | 404 MSG-COMMON-08                         |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
