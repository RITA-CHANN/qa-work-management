---
id: API-ADMIN-07
title: POST /api/admin/users/:id/deactivate
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements:
    [US-ADMIN-04, BR-ADMIN-01, BR-ADMIN-09, BR-ADMIN-10, BR-ADMIN-11, BR-ADMIN-14, BR-ADMIN-16]
  acceptance: [AC-ADMIN-06, AC-ADMIN-07, AC-ADMIN-08, AC-ADMIN-18]
  design: [SCR-ADMIN-03]
updated: 2026-10-09
---

# POST /api/admin/users/:id/deactivate

Deactivates an account: the user can't sign in any more (MSG-ADMIN-06) and every session they have ends at once (BR-ADMIN-10). Memberships and history stay; accounts are never deleted. Status codes follow RFC 9110; errors are RFC 9457 problem details
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

The user as an [AdminUser](get-users.md#200-ok) with `status: "DEACTIVATED"`. A user who is already deactivated
is returned unchanged (200, no audit event).

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                                                                                                                                                                                         |
| ------ | -------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09 | Body is not `application/json`                                                                                                                                                                                                               |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                                                                                                                                                                                |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                                                                                                                                                                                          |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01)                                                                                                                                                                |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | The body has a field                                                                                                                                                                                                                         |
| 422    | `OWN_ACCOUNT`              | MSG-ADMIN-04  | `:id` is the caller (BR-ADMIN-09); checked before the user is looked up                                                                                                                                                                      |
| 404    | `NOT_FOUND`                | MSG-ADMIN-16  | No user with this id                                                                                                                                                                                                                         |
| 422    | `LAST_ADMIN`               | MSG-ADMIN-03  | The user is an Admin and no other active Admin exists (BR-ADMIN-09)                                                                                                                                                                          |
| 422    | `LAST_PROJECT_ADMIN`       | MSG-ADMIN-05  | The user is the only active Project admin of one or more active projects (BR-ADMIN-11). `detail` names the user and the project keys, comma-separated: "Linh QA is the only project admin of TEST1, TEST2. Set another project admin first." |

"Project admin" means role `OWNER` until role model v2 (PR #13) lands. Another Project admin counts only if their
account is active; archived projects are ignored.

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                                      |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Admin-only; an Admin can't deactivate themselves (BR-ADMIN-09)                                                    |
| API2 Broken authentication                                                       | All sessions of the user are deleted in the same transaction; login checks the status (403 `ACCOUNT_DEACTIVATED`) |
| API3 Broken object property level authorization (data exposure, mass assignment) | Empty strict body                                                                                                 |
| API4 Unrestricted resource consumption                                           | A few indexed queries per call                                                                                    |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01)                        |

## Side effects

Idempotent: deactivating twice leaves one change. When the status changes, in one transaction (BR-ADMIN-16): sets
`users.status = DEACTIVATED`, deletes every `sessions` row of the user and adds an audit event `user.deactivated`
with `before` `{ status: ACTIVE }` and `after` `{ status: DEACTIVATED }`. A refused call (422) writes nothing
(AC-ADMIN-18).

## Example

```bash
curl -i -b admin-cookies.txt -X POST http://localhost:3000/api/admin/users/cm123/deactivate \
  -H 'Content-Type: application/json' -d '{}'
```

## Test ideas

| Type       | Case                                 | Expected                                                                                                    |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Happy path | Test user signed in on two contexts  | 200; both contexts get 401 on the next request; login gives 403 MSG-ADMIN-06 (AC-ADMIN-07)                  |
| Negative   | Ada deactivates herself              | 422 `OWN_ACCOUNT` (AC-ADMIN-06)                                                                             |
| Negative   | Only Owner of an active test project | 422 `LAST_PROJECT_ADMIN`, the key in `detail`, user still active, no audit entry (AC-ADMIN-08, AC-ADMIN-18) |
| Boundary   | Already deactivated (Hoa Inactive)   | 200, unchanged, no new audit entry                                                                          |
| Negative   | Made-up id                           | 404 MSG-ADMIN-16                                                                                            |
| Validation | Body `{"reason":"x"}`                | 400                                                                                                         |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
