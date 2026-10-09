---
id: SCR-ADMIN-05
title: Admin settings
type: screen
feature: admin
status: review
phase: 3
owner: Claude
reviewers: [Linh]
approved:
route: /admin/settings
traces:
  requirements: [BR-ADMIN-01, BR-ADMIN-17, BR-GUEST-02]
  acceptance: [AC-ADMIN-01, AC-ADMIN-19]
  api: [API-ADMIN-13, API-ADMIN-14]
  design: [SCR-ADMIN-01, SCR-PROJECT-02]
updated: 2026-10-09
---

# SCR-ADMIN-05 Admin settings

Workspace-wide settings of the Admin console: which areas Guests of a **new** project may see (BR-GUEST-02) and how
long audit events are kept (BR-ADMIN-17). Existing projects keep their own Guest switches (Settings tab of
[SCR-PROJECT-02](SCR-PROJECT-02-project-page.md)). Layout of the Admin console:
[SCR-ADMIN-01](SCR-ADMIN-01-all-projects-dashboard.md). Follows ISO 9241-110 and WCAG 2.2 level AA.

## Layout

```
Settings                                                                         <h1>
┌─ Guest access for new projects ──────────────────────┐                         <section>, <h2>
│ Project dashboard                           (●   )   │  role="switch", one per area
│ Releases and sprints                        (●   )   │  that exists so far
│ Members list                                (   ○)   │
│ Activity log                                (   ○)   │
└──────────────────────────────────────────────────────┘
┌─ Audit log ──────────────────────────────────────────┐
│ Keep audit events (days)  [ 365 ]                    │  number, 30–3650
│                           field message              │
└──────────────────────────────────────────────────────┘
                                      [ Save settings ]
```

The Admin side nav gains "Settings" after "Audit log".

## Fields

| Field                    | Input type                       | Required | Client validation        | Message      | Notes                                                                                            |
| ------------------------ | -------------------------------- | -------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| Guest area switches      | switch × 4                       | —        | —                        | —            | One per area of `GUEST_AREAS_AVAILABLE`, labelled with `GUEST_AREA_LABELS`; others kept as saved |
| Keep audit events (days) | `number` (`inputmode="numeric"`) | yes      | whole number, 30 to 3650 | MSG-ADMIN-18 | Checked with `workspaceSettingsSchema` before the request                                        |

## Actions

| Action                         | Result                                                                                                              | Criteria    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| Open `/admin/settings`         | `GET /api/admin/settings`; the form starts from the saved values                                                    |             |
| Flip a switch, change the days | Only the form changes                                                                                               |             |
| "Save settings", days invalid  | MSG-ADMIN-18 under the field, no request                                                                            |             |
| "Save settings"                | `PUT /api/admin/settings` with both values; toast MSG-ADMIN-19; projects created afterwards get the new Guest areas | AC-ADMIN-19 |
| "Save settings", server error  | The error text in an alert above the cards; the form keeps its values                                               |             |

## States

| State         | What the user sees                              | Criteria    |
| ------------- | ----------------------------------------------- | ----------- |
| Loading       | `<h1>` and "Loading…" (`role="status"`)         |             |
| Error         | API error text in an alert                      |             |
| No permission | "Page not found" (as SCR-ADMIN-01)              | AC-ADMIN-01 |
| Saving        | "Save settings" disabled while the request runs |             |
| Success       | Toast MSG-ADMIN-19                              |             |

## Permissions

| Role  | Can see               | Can do                                            |
| ----- | --------------------- | ------------------------------------------------- |
| Admin | The settings          | Change the Guest defaults and the audit retention |
| User  | "Page not found" only | —                                                 |

## Accessibility

- Page title "Settings · QA Work Management"; one `<h1>` "Settings".
- Each card is a `<section>` labelled by its `<h2>` ("Guest access for new projects", "Audit log").
- Each switch is a `button` with `role="switch"`, `aria-checked` and a `<label>` with the area name; the switches are
  in a `role="group"` named "Areas Guests can see".
- The days field has a visible label; its error is linked with `aria-describedby` and sets `aria-invalid="true"`.
- The form is a `<form>` with `noValidate`; Enter in the days field submits it.

## Responsive

The cards take the full width up to 48 rem; the switches keep label and control on one line down to 320 px.

## Locators for tests

`getByRole('heading', { level: 1, name: 'Settings' })`,
`getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Settings' })`,
`getByRole('region', { name: 'Guest access for new projects' })`, `getByRole('switch', { name: 'Members list' })`
(also "Project dashboard", "Releases and sprints", "Activity log"), `getByLabel('Keep audit events (days)')`,
`getByRole('button', { name: 'Save settings' })`.

## Change log

| Date       | Change        | Why                                 |
| ---------- | ------------- | ----------------------------------- |
| 2026-10-09 | First version | Phase 3C (BR-GUEST-02, BR-ADMIN-17) |
