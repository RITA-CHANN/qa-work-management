---
id: API-PROJECT-13
title: PUT /api/projects/:key/guest-visibility
type: api
feature: guest
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
traces:
  requirements:
    [US-GUEST-01, BR-GUEST-02, BR-GUEST-03, BR-GUEST-04, BR-GUEST-06, BR-PROJECT-08, BR-ADMIN-14]
  acceptance: [AC-GUEST-02, AC-GUEST-05, AC-GUEST-03]
  design: [SCR-PROJECT-02, DD-PROJECT-01, DD-PROJECT-02]
updated: 2026-10-09
---

# PUT /api/projects/:key/guest-visibility

Sets which areas the Guests of a project may see (BR-GUEST-02), from the Settings tab › Guests card of the project
page (SCR-PROJECT-02). The new list applies on each Guest's next request (BR-GUEST-06). Status codes follow RFC 9110;
errors are RFC 9457 problem details ([README.md](../README.md#error-format),
[ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)).

|                 |                                                                           |
| --------------- | ------------------------------------------------------------------------- |
| **Auth**        | Project admin (or System admin); Member and Guest get 403                 |
| **Since phase** | 3 (3C)                                                                    |
| **Schema**      | `packages/shared/src/guest.ts` (`guestVisibilitySchema`), `projectSchema` |

## Request

### Headers

| Header         | Required | Value              | Why                                                |
| -------------- | -------- | ------------------ | -------------------------------------------------- |
| `Content-Type` | yes      | `application/json` | Anything else returns 415 (CSRF guard, DD-AUTH-02) |

### Path parameters

| Name  | Type   | Description                                     |
| ----- | ------ | ----------------------------------------------- |
| `key` | string | Project key, case-insensitive (`shop` = `SHOP`) |

### Body

| Field   | Type        | Required | Rules                                                                                                                                                                        |
| ------- | ----------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `areas` | GuestArea[] | yes      | The areas switched on, each one of `GUEST_AREAS` in `packages/shared/src/guest.ts`; at most one entry per area; `[]` switches every area off. The list replaces the old one. |

The web app shows a switch only for the areas built so far (`GUEST_AREAS_AVAILABLE`: `dashboard`, `releases`,
`members`, `activity`) and sends the other areas unchanged. The API stores the list without repeats, in the order of
`GUEST_AREAS`. Unknown fields are rejected (400).

```json
{ "areas": ["dashboard", "releases", "activity"] }
```

## Responses

### 200 OK

The project as in [GET /api/projects/:key](get-project.md#200-ok), with the new `guestAreas`. `version` is not
changed: Guest visibility is not part of the optimistic lock of the name and description (DD-PROJECT-03).

```json
{ "data": { "key": "SHOP", "guestAreas": ["dashboard", "releases", "activity"], "…": "…" } }
```

A list equal to the saved one returns 200 with no change and no activity or audit entry.

### Errors

Body: `application/problem+json`. Checked in the order of the table (DD-PROJECT-01).

| Status | `code`                     | `messageId`    | When                                                                                             |
| ------ | -------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 415    | `UNSUPPORTED_MEDIA_TYPE`   | MSG-COMMON-09  | Body is not `application/json`                                                                   |
| 401    | `UNAUTHENTICATED`          | MSG-COMMON-05  | Not logged in                                                                                    |
| 403    | `PASSWORD_CHANGE_REQUIRED` | MSG-ADMIN-07   | Signed in with a one-time password not yet replaced                                              |
| 400    | `VALIDATION_ERROR`         | MSG-COMMON-04  | `areas` missing, not a list, an unknown area, too many entries, or an unknown field              |
| 404    | `NOT_FOUND`                | MSG-PROJECT-06 | Unknown key, or the caller is not a member and not a System admin (same body for both, ADR-0008) |
| 403    | `FORBIDDEN`                | MSG-COMMON-06  | The caller is a Member or a Guest (`project:guests`, BR-PROJECT-35, BR-GUEST-04)                 |
| 422    | `PROJECT_ARCHIVED`         | MSG-PROJECT-08 | The project is archived (BR-PROJECT-08)                                                          |

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| API1 Broken object level authorization                                           | Project resolved only through `loadProject`; non-members get the same 404 as an unknown key (ADR-0008) |
| API2 Broken authentication                                                       | Session cookie required; 401 otherwise                                                                 |
| API3 Broken object property level authorization (data exposure, mass assignment) | Strict body with `areas` only; each value must be a known area                                         |
| API4 Unrestricted resource consumption                                           | Body limited to 1 MB; `areas` at most as long as `GUEST_AREAS`; one update per call                    |
| API5 Broken function level authorization                                         | `assertCan(access, "project:guests")`: Project admins and System admins only                           |

## Side effects

Idempotent: the same list twice leaves one change. When the list changes, in one transaction (BR-PROJECT-22,
BR-ADMIN-16): updates `projects.guest_areas`, adds one activity entry `project.guest_visibility_changed`
("Oanh Owner changed what Guests can see", `changes.guestAreas` with the old and new list) and one audit event with
the same action, whoever the caller is (`actedAs` `ADMIN` only for a System admin who is not a member, BR-GUEST-06,
BR-ADMIN-14). The Guests' next request reads the new list (no cache).

## Example

```bash
curl -i -b cookies.txt -X PUT http://localhost:3000/api/projects/SHOP/guest-visibility \
  -H 'Content-Type: application/json' -d '{"areas":["dashboard","releases","activity"]}'
```

## Test ideas

| Type       | Case                                                                        | Expected                                                                                 |
| ---------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Happy path | Oanh (Project admin) switches `activity` on; Sam (Guest) then gets activity | 200 with the new `guestAreas`; Sam's `GET …/activity` goes from 404 to 200 (AC-GUEST-02) |
| Happy path | After the change                                                            | One activity entry and one audit event `project.guest_visibility_changed`                |
| Negative   | Same list as saved; `["dashboard","dashboard"]`                             | 200 and no new entry; 200 stored once                                                    |
| Negative   | `{"areas":["budget"]}`; `{}`; `{"areas":[],"version":1}`                    | 400                                                                                      |
| Boundary   | `[]`; every area of `GUEST_AREAS`                                           | 200, Guests see nothing; 200                                                             |
| Permission | System admin, Project admin, Member, Guest, non-member                      | 200, 200, 403, 403, 404 (AC-GUEST-05, AC-GUEST-03)                                       |
| State      | Archived project as its Project admin                                       | 422 `PROJECT_ARCHIVED`                                                                   |

## Change log

| Date       | Change        | Why                                 |
| ---------- | ------------- | ----------------------------------- |
| 2026-10-09 | First version | Phase 3C Guest access (BR-GUEST-02) |
