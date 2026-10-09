---
id: API-USER-01
title: GET /api/users
type: api
feature: project
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements: [BR-PROJECT-11, BR-PROJECT-01, BR-ADMIN-04, BR-ADMIN-10, BR-ADMIN-18]
  acceptance: [AC-PROJECT-23, AC-PROJECT-24, AC-PROJECT-01, AC-ADMIN-09, AC-ADMIN-12]
  design: [SCR-PROJECT-03, SCR-PROJECT-01]
updated: 2026-10-09
---

# GET /api/users

Lists active users for the "Add member" picker (SCR-PROJECT-03), and the "First project admin" picker of "New project"
and the "New project admin" picker of "Change project admin" in Admin console › Projects (SCR-ADMIN-02). Status codes follow RFC 9110; errors are RFC 9457 problem details
([README.md](../README.md#error-format), [ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                     |
| --------------- | --------------------------------------------------- |
| **Auth**        | Logged in                                           |
| **Since phase** | 3                                                   |
| **Schema**      | `packages/shared/src/users.ts` (`userOptionSchema`) |

## Request

### Query parameters

| Name     | Type    | Required | Default | Description                               |
| -------- | ------- | -------- | ------- | ----------------------------------------- |
| `search` | string  | no       | —       | Part of a name or email, 1–100 characters |
| `limit`  | integer | no       | 20      | 1–50                                      |

## Responses

### 200 OK

```json
{
  "data": [
    {
      "id": "cm…",
      "name": "Sam Stakeholder",
      "email": "stakeholder@qawm.test"
    }
  ]
}
```

| Field   | Type   | Description  |
| ------- | ------ | ------------ |
| `id`    | string | User id      |
| `name`  | string | Display name |
| `email` | string | Email        |

Only `ACTIVE` accounts are listed: a deactivated user can't be picked (BR-ADMIN-10). The web app removes current
members from the list itself (it already has them from API-PROJECT-08).

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`             | `messageId`   | When                                                                               |
| ------ | ------------------ | ------------- | ---------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | MSG-COMMON-04 | Body or query fails the schema; `errors` lists each field with its own `messageId` |
| 401    | `UNAUTHENTICATED`  | MSG-COMMON-05 | Not logged in                                                                      |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| API1 Broken object level authorization                                           | Not applicable: returns the user directory, which every team member may see                       |
| API2 Broken authentication                                                       | Session cookie required (Phase 2); 401 otherwise                                                  |
| API3 Broken object property level authorization (data exposure, mass assignment) | `id`, `name`, `email` only; never `globalRole`, `passwordHash`                                    |
| API4 Unrestricted resource consumption                                           | `limit` at most 50; `search` at most 100 characters                                               |
| API5 Broken function level authorization                                         | Any logged-in user. Known gap: any user can list all emails; acceptable for a small internal team |

## Side effects

Read-only, safe and idempotent.

## Example

```bash
curl -b cookies.txt 'http://localhost:3000/api/users?search=sam'
```

## Test ideas

| Type       | Case                                       | Expected                           |
| ---------- | ------------------------------------------ | ---------------------------------- |
| Happy path | `search=sam`                               | Sam Stakeholder                    |
| Boundary   | `limit=50` and `51`                        | 200; 400                           |
| Security   | Response fields                            | No `passwordHash`, no `globalRole` |
| Negative   | `search=Hoa` (Hoa Inactive is deactivated) | `[]`                               |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version (design; built in the Phase 3 code PR)                                    | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
| 2026-10-09 | Only active users; also used by the Admin console pickers                               | BR-ADMIN-10, BR-ADMIN-18   |
