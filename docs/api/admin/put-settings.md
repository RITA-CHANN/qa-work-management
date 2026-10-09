---
id: API-ADMIN-14
title: PUT /api/admin/settings
type: api
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [BR-ADMIN-01, BR-ADMIN-14, BR-ADMIN-16, BR-ADMIN-17, BR-GUEST-02]
  acceptance: [AC-ADMIN-01, AC-ADMIN-19]
  design: [SCR-ADMIN-05]
updated: 2026-10-09
---

# PUT /api/admin/settings

Saves the workspace settings from Admin console › Settings (SCR-ADMIN-05): the Guest areas new projects start with
(BR-GUEST-02) and the audit retention in days (BR-ADMIN-17). Existing projects keep their own Guest areas. Status
codes follow RFC 9110; errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Auth**        | System admin (global role `ADMIN`). For everyone else the route does not exist (404) |
| **Since phase** | 3 (3C)                                                                               |
| **Schema**      | `packages/shared/src/admin.ts` (`workspaceSettingsSchema`)                           |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Body

Both fields are required: the body replaces the settings.

| Field                | Type        | Required | Rules                                                                                      |
| -------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------ |
| `defaultGuestAreas`  | GuestArea[] | yes      | Each one of `GUEST_AREAS` in `packages/shared/src/guest.ts`; `[]` means Guests see nothing |
| `auditRetentionDays` | integer     | yes      | 30 to 3650                                                                                 |

Unknown fields are rejected (400). The web form checks the range first and shows MSG-ADMIN-18 at the field.

```json
{ "defaultGuestAreas": ["dashboard", "releases"], "auditRetentionDays": 365 }
```

## Responses

### 200 OK

The saved settings, as in [GET /api/admin/settings](get-settings.md#200-ok). The web app then shows MSG-ADMIN-19.

```json
{ "data": { "defaultGuestAreas": ["dashboard", "releases"], "auditRetentionDays": 365 } }
```

### Errors

Body: `application/problem+json`. Checked in the order of the table.

| Status | `code`                     | `messageId`   | When                                                                                                           |
| ------ | -------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09 | Body is not `application/json`                                                                                 |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05 | Not logged in                                                                                                  |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07  | Signed in with a one-time password not yet replaced                                                            |
| 404    | `NOT_FOUND`                | MSG-COMMON-08 | The caller is not a System admin: same body as an unknown route (BR-ADMIN-01)                                  |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04 | A field missing, an unknown area, `auditRetentionDays` not a whole number from 30 to 3650, or an unknown field |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                             |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | One workspace-wide row; no object id in the request                                                      |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                                   |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict body with the two settings only                                                                   |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; the retention floor of 30 days keeps the clean-up from emptying the log by mistake |
| API5 Broken function level authorization                                         | `requireAdmin` on the whole `/api/admin` router; non-Admins get 404, not 403 (BR-ADMIN-01)               |

## Side effects

Idempotent. When a value changes, in one transaction (BR-ADMIN-16): updates the `workspace_settings` row and adds an
audit event `settings.updated` (target type `settings`, target name "Workspace settings") with `before` and `after`
`{ defaultGuestAreas, auditRetentionDays }` (BR-ADMIN-14). Saving the same values writes no audit event.

The new retention is used by the next clean-up: the API deletes audit events older than `auditRetentionDays` when it
starts and then once a day (BR-ADMIN-17, `purgeOldAuditEvents` in `apps/api/src/modules/admin/settings.service.ts`).
The new Guest defaults apply to projects created afterwards (API-PROJECT-02); existing projects are not changed.

## Example

```bash
curl -i -b admin-cookies.txt -X PUT http://localhost:3000/api/admin/settings \
  -H 'Content-Type: application/json' -d '{"defaultGuestAreas":["dashboard"],"auditRetentionDays":90}'
```

## Test ideas

| Type       | Case                                                            | Expected                                                            |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Happy path | Ada sets `["members"]`, then creates a project                  | 200; the new project has `guestAreas` `["members"]`; SHOP unchanged |
| Happy path | Change the retention                                            | Audit event `settings.updated` with before and after                |
| Negative   | Same values twice                                               | 200 twice; one audit event                                          |
| Boundary   | `auditRetentionDays` 29, 30, 3650, 3651, 30.5                   | 400, 200, 200, 400, 400                                             |
| Validation | `{"auditRetentionDays":365}`; `defaultGuestAreas` `["budget"]`  | 400; 400                                                            |
| Permission | Linh (global role User)                                         | 404 MSG-COMMON-08                                                   |
| Unit       | Retention 365, audit events 364 and 366 days old, clean-up runs | The 364-day event stays, the 366-day one is deleted (AC-ADMIN-19)   |

## Change log

| Date       | Change        | Why      |
| ---------- | ------------- | -------- |
| 2026-10-09 | First version | Phase 3C |
