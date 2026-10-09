---
id: API-ADMIN-13
title: GET /api/admin/settings
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [BR-ADMIN-01, BR-ADMIN-17, BR-GUEST-02]
  acceptance: [AC-ADMIN-01, AC-ADMIN-19]
  design: [SCR-ADMIN-05]
updated: 2026-10-09
---

# GET /api/admin/settings

Returns the workspace settings shown on Admin console › Settings (SCR-ADMIN-05): the Guest areas new projects start
with (BR-GUEST-02) and how long audit events are kept (BR-ADMIN-17). Status codes follow RFC 9110; errors are
RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`workspaceSettingsSchema`)                           |

## Request

No parameters and no body.

## Responses

### 200 OK

```json
{ "data": { "defaultGuestAreas": ["dashboard", "releases"], "auditRetentionDays": 365 } }
```

| Field                | Type        | Description                                                                                     |
| -------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `defaultGuestAreas`  | GuestArea[] | Copied into `guestAreas` of every new project (API-PROJECT-02); default `dashboard`, `releases` |
| `auditRetentionDays` | integer     | Audit events older than this many days are deleted (BR-ADMIN-17); default 365                   |

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                          |
| ------ | -------------------------- | ------------- | ----------------------------------------------------------------------------- |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                 |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                           |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01) |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | One workspace-wide row; no object id in the request                                        |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                     |
| API3 Broken object property level authorization (data exposure, mass assignment) | The two settings only; no `id` or `updated_at`                                             |
| API4 Unrestricted resource consumption                                           | One primary-key read                                                                       |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01) |

## Side effects

Safe to repeat. The first call on a new database inserts the `workspace_settings` row with its defaults
(`id` `default`), so it always answers 200; later calls only read it. No audit event.

## Example

```bash
curl -b admin-cookies.txt http://localhost:3000/api/admin/settings
```

## Test ideas

| Type       | Case                    | Expected                                                       |
| ---------- | ----------------------- | -------------------------------------------------------------- |
| Happy path | Ada on a fresh seed     | 200, `["dashboard","releases"]`, 365                           |
| Happy path | After PUT with 90 days  | 200, `auditRetentionDays` 90                                   |
| Permission | Linh (global role User) | 404 MSG-COMMON-08, same body as an unknown route (AC-ADMIN-01) |
| Negative   | Not logged in           | 401                                                            |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
