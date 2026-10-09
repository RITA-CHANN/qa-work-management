---
id: API-ADMIN-11
title: GET /api/admin/audit
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [US-ADMIN-05, BR-ADMIN-01, BR-ADMIN-14, BR-ADMIN-15]
  acceptance: [AC-ADMIN-04, AC-ADMIN-10, AC-ADMIN-11, AC-ADMIN-18]
  design: [SCR-ADMIN-04]
updated: 2026-10-09
---

# GET /api/admin/audit

Pages through the audit log, newest first: sign-ins, admin actions on users, and writes an Admin made on a project
they are not a member of (BR-ADMIN-14, BR-ADMIN-15). Used by Admin console › Audit log (SCR-ADMIN-04). There is no
endpoint to change or delete an entry (AC-ADMIN-11). Status codes follow RFC 9110; errors are RFC 9457 problem
details ([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------- |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404)           |
| **Since phase** | 3 (3C)                                                                                         |
| **Schema**      | `packages/shared/src/admin.ts` (`auditQuerySchema`, `auditEventSchema`, `AUDIT_ACTION_LABELS`) |

## Request

### Query parameters

| Name         | Type                | Required | Default | Description                                                                        |
| ------------ | ------------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `actorId`    | string              | no       | —       | Only entries by this user id                                                       |
| `action`     | string              | no       | —       | Exact action, at most 60 characters, e.g. `auth.sign_in_failed` (list below)       |
| `projectKey` | string              | no       | —       | At most 10 characters; compared upper-case                                         |
| `from`       | date `YYYY-MM-DD`   | no       | —       | Entries on or after 00:00 UTC of this day                                          |
| `to`         | date `YYYY-MM-DD`   | no       | —       | Entries before 00:00 UTC of the next day (the day is included)                     |
| `asAdmin`    | `"true"`, `"false"` | no       | —       | `true`: only entries with `actedAs = ADMIN`. `false` is the same as leaving it out |
| `cursor`     | string              | no       | —       | `meta.nextCursor` of the previous page                                             |
| `limit`      | integer             | no       | 50      | 1–100 entries per page                                                             |

Any other query parameter is rejected (400).

## Responses

### 200 OK

Newest first (`createdAt` then `id`, both descending). The cursor is `<ISO time>|<id>` of the last entry, so new
entries never shift a page.

```json
{
  "data": [
    {
      "id": "cm…",
      "at": "2026-10-09T05:00:00.000Z",
      "actor": { "id": "cm…", "name": "Ada Admin" },
      "action": "project.updated",
      "actionLabel": "Edited project",
      "targetType": "project",
      "targetName": "Ada Admin changed the description",
      "projectKey": "SECRET",
      "before": { "description": null },
      "after": { "description": "Admin-only tools" },
      "actedAs": "ADMIN",
      "ip": "10.0.0.2"
    }
  ],
  "meta": { "nextCursor": null }
}
```

| Field             | Type                 | Description                                                                                                       |
| ----------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`              | string               | Entry id                                                                                                          |
| `at`              | string (ISO 8601)    | When it happened                                                                                                  |
| `actor`           | { id, name } \| null | Who did it. `null` for a failed sign-in with an unknown email (the web app shows "Unknown")                       |
| `action`          | string               | `<area>.<verb>`                                                                                                   |
| `actionLabel`     | string               | English label from `AUDIT_ACTION_LABELS`; the action itself if it has no label                                    |
| `targetType`      | string               | `session`, `user`, `project`, `member`, `release` or `milestone`                                                  |
| `targetName`      | string               | Readable target frozen at write time: the email (sign-ins, user actions) or the activity summary (project writes) |
| `projectKey`      | string \| null       | Project the event is about                                                                                        |
| `before`, `after` | object \| null       | Changed fields, old and new values. Never a password                                                              |
| `actedAs`         | `"ADMIN"` \| null    | `ADMIN` when an Admin wrote to a project they are not a member of (BR-ADMIN-14)                                   |
| `ip`              | string \| null       | Client IP address as Express sees it (`req.ip`); `null` for project writes                                        |
| `meta.nextCursor` | string \| null       | Pass as `cursor` for the next page; `null` = last page                                                            |

Actions written in Phase 3C:

| `action`                                                                                                                         | Written by                                                           |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `auth.sign_in`, `auth.sign_in_failed`                                                                                            | [POST /api/auth/login](../auth/post-login.md#side-effects)           |
| `auth.sign_out`                                                                                                                  | POST /api/auth/logout, when the cookie had a valid session           |
| `auth.password_changed`                                                                                                          | [POST /api/auth/change-password](../auth/post-change-password.md)    |
| `user.created`, `user.role_changed`, `user.deactivated`, `user.reactivated`, `user.password_reset`, `user.signed_out_everywhere` | The `/api/admin/users` endpoints                                     |
| `project.*`, `member.*`, `release.*`, `milestone.*` (same names as the activity log, DD-PROJECT-02)                              | Any project write by an Admin who is not a member, `actedAs` `ADMIN` |

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                                                                                              |
| ------ | -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                                                                                     |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                                                                                               |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01)                                                                     |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | Bad date, `limit` outside 1–100, too long `action` or `projectKey`, unknown parameter, or a cursor that is not `<time>\|<id>` (pointer `/cursor`) |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                          |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Admin-only log of the whole workspace, by design                                                      |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                                |
| API3 Broken object property level authorization (data exposure, mass assignment) | Passwords are never written (BR-ADMIN-14); read only: no POST, PATCH or DELETE route exists           |
| API4 Unrestricted resource consumption                                           | `limit` at most 100; index on (`created_at`, `id`) for the cursor; indexes on `actor_id` and `action` |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01)            |

## Side effects

Read-only, safe and idempotent. Reading the log is not itself audited.

## Example

```bash
curl -b admin-cookies.txt 'http://localhost:3000/api/admin/audit?action=auth.sign_in_failed&limit=10'
```

## Test ideas

| Type       | Case                                                                 | Expected                                                                        |
| ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Happy path | Fresh seed, no filter                                                | 6 seeded entries plus the test's own sign-ins, newest first                     |
| Filter     | `action=auth.sign_in_failed` after a wrong password for Linh         | Entry with `targetName` `linh@qawm.test`, the IP, no password (AC-ADMIN-10)     |
| Filter     | `asAdmin=true` after Ada renames a project she is not in             | Entry `project.updated`, `before` / `after` name, `actedAs` ADMIN (AC-ADMIN-04) |
| Paging     | `limit=2`, then `cursor=<nextCursor>`                                | Next 2 entries, no overlap                                                      |
| Boundary   | `limit=0`, `limit=101`; `from=2026-13-01`; `cursor=abc`              | 400                                                                             |
| Security   | `DELETE /api/admin/audit`, `PATCH /api/admin/audit` with a JSON body | 404 route not found (AC-ADMIN-11)                                               |
| Permission | Linh                                                                 | 404 MSG-COMMON-08                                                               |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
