---
id: SCR-PROJECT-06
title: Project settings
type: screen
feature: project
status: approved
phase: 3C
owner: Claude
reviewers: [Linh]
approved: 2026-10-10 (Linh)
route: /projects/:key/settings
traces:
  requirements:
    [
      US-PROJECT-04,
      US-PROJECT-06,
      US-PROJECT-07,
      US-GUEST-01,
      BR-PROJECT-03,
      BR-PROJECT-04,
      BR-PROJECT-05,
      BR-PROJECT-07,
      BR-PROJECT-08,
      BR-PROJECT-09,
      BR-GUEST-02,
    ]
  acceptance:
    [
      AC-PROJECT-19,
      AC-PROJECT-21,
      AC-PROJECT-30,
      AC-PROJECT-32,
      AC-PROJECT-35,
      AC-PROJECT-121,
      AC-PROJECT-122,
      AC-PROJECT-123,
      AC-PROJECT-124,
      AC-PROJECT-125,
      AC-GUEST-02,
      AC-GUEST-05,
    ]
  api:
    [API-PROJECT-03, API-PROJECT-04, API-PROJECT-05, API-PROJECT-06, API-PROJECT-07, API-PROJECT-13]
  design: [SCR-PROJECT-02, FLW-PROJECT-03, FLW-PROJECT-05, DD-PROJECT-01, DD-PROJECT-03]
updated: 2026-10-09
---

# SCR-PROJECT-06 Project settings

The place where a Project admin (or a System admin) changes how one project is set up: its details, what Guests
can see, and the actions that end its life (archive, restore, delete). Members and Guests never see it. Follows
ISO 9241-110 (interaction principles) and WCAG 2.2 level AA.

Split out of [SCR-PROJECT-02](SCR-PROJECT-02-project-page.md) (screen inventory INV-SCR-01 v1.2). SCR-PROJECT-02
keeps the header, tabs and the project dialogs; this screen reuses those dialogs.

## Sections now and later

A section appears only once the data it configures exists (redesign proposal §3, "a screen appears in the nav only
once it is built"). The mockup "Project Settings" shows the full target.

| Section            | Route                                 | Built in             | Notes                                                           |
| ------------------ | ------------------------------------- | -------------------- | --------------------------------------------------------------- |
| General            | `/projects/:key/settings`             | this screen          | Key, name, description, created, last changed                   |
| Guests             | `/projects/:key/settings/guests`      | this screen          | One switch per area (BR-GUEST-02)                               |
| Danger zone        | `/projects/:key/settings/danger-zone` | this screen          | Archive, restore, delete                                        |
| Workflows          | `…/settings/workflows`                | Tasks (3B), Bugs (6) | Task states with the Tasks screen; defect life cycle in Phase 6 |
| Fields & scales    | `…/settings/fields`                   | Phase 6              | Severity, priority, custom fields                               |
| Templates          | `…/settings/templates`                | Phase 4              | Test case and bug templates                                     |
| Process            | `…/settings/process`                  | Phases 4–5           | Review before use, retest before close, default exit criteria   |
| Environments       | `…/settings/environments`             | Phase 7 (B20)        | Or its own screen, decided in that thread                       |
| Notification rules | `…/settings/notifications`            | Later (L1)           | With the notification center                                    |
| Team & permissions | —                                     | not a section        | Already the Members tab (SCR-PROJECT-03)                        |
| Transfer ownership | —                                     | dropped              | Role model v2 has no Owner; several Project admins are allowed  |

## Layout

```
┌──────────┬────────────────────────────────────────────────────────────────────────────┐
│ nav      │  project header of SCR-PROJECT-02; side nav "Project settings" current     │
│          │  ┌─ Settings ──────┐ ┌─ General ──────────────────────────────────────────┐ │
│          │  │ General       ◀ │ │ <h2> General                                       │ │
│          │  │ Guests          │ │ Key           SHOP            (read-only text)     │ │
│          │  │ Danger zone     │ │ Name *        [ShopEase Web                    ]   │ │
│          │  └─────────────────┘ │ Description   [Customer web shop …            ]   │ │
│          │   nav "Settings      │               [                                ]   │ │
│          │   sections", links   │ Created       Ada Admin, 2026-09-01               │ │
│          │                      │ Last changed  2026-10-09 14:02                     │ │
│          │                      │                         [ Discard ] [ Save ]       │ │
│          │                      └────────────────────────────────────────────────────┘ │
└──────────┴────────────────────────────────────────────────────────────────────────────┘

── Guests (/projects/:key/settings/guests) ─────────────────────
┌────────────────────────────────────────────┐
│ <h2> Guests                                │
│ Project dashboard                 (●   )   │ role="switch", one per area that exists
│ Releases and sprints              (●   )   │
│ Members list                      (   ○)   │
│ Activity log                      (   ○)   │
│                      [ Cancel ] [ Save ]   │
└────────────────────────────────────────────┘

── Danger zone (/projects/:key/settings/danger-zone) ───────────
Active project:
┌────────────────────────────────────────────────────────────────┐
│ <h2> Danger zone                                               │
│ Archive project                                [ Archive… ]    │
│ Read-only for everyone until restored. Needed before delete.   │
│ ────────────────────────────────────────────────────────────── │
│ Delete project                                 [ Delete… ] off │
│ Archive the project first.                                     │
└────────────────────────────────────────────────────────────────┘
Archived project: "Archive project" row becomes "Restore project" [ Restore ]; "Delete…" enabled,
with "Removes the project for good. Only possible while it has no releases." under it.
"Archive…" and "Delete…" open the existing SCR-PROJECT-02 dialogs; Restore needs no dialog.
```

Below 768 px the section nav becomes a row of links above the content (wraps, no horizontal page scroll).

## Fields

| Field                | Input type     | Required | Client validation               | Message        | Notes                                                            |
| -------------------- | -------------- | -------- | ------------------------------- | -------------- | ---------------------------------------------------------------- |
| Key                  | read-only text | —        | —                               | —              | Never changes (BR-PROJECT-03)                                    |
| Name                 | `text`         | yes      | 3–100 characters after trimming | MSG-PROJECT-03 | Same rule as the edit dialog (BR-PROJECT-04)                     |
| Description          | `textarea`     | no       | at most 2000 characters         | MSG-PROJECT-05 | Line breaks kept                                                 |
| Created              | read-only text | —        | —                               | —              | Creator's name and date                                          |
| Last changed         | read-only text | —        | —                               | —              | `updatedAt`, date and time                                       |
| Guest area switches  | switch × 4     | —        | —                               | —              | One per `GUEST_AREAS_AVAILABLE`, labels from `GUEST_AREA_LABELS` |
| Confirm key (delete) | `text`         | yes      | equals the project key exactly  | MSG-PROJECT-10 | In the delete dialog of SCR-PROJECT-02                           |

## Actions

| Action                                                    | Result                                                                                                                       | Criteria                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Open "Project settings" (side nav)                        | Opens `/projects/:key/settings` (General); "General" is the current section                                                  | AC-PROJECT-121                |
| Click a section link, or open its URL directly            | That section shows; its link has `aria-current="page"`; browser back returns to the previous section                         | AC-PROJECT-121                |
| Open an unknown section, e.g. `…/settings/xyz`            | "Page not found" (MSG-COMMON-13)                                                                                             | AC-PROJECT-121                |
| General: change name or description                       | Save and Discard become enabled; nothing is sent yet                                                                         | AC-PROJECT-122                |
| General › Save                                            | `PATCH /api/projects/:key` with `version`; toast MSG-PROJECT-19; header shows the new name; form is clean again              | AC-PROJECT-19, AC-PROJECT-122 |
| General › Save with an invalid name                       | Message under the field (MSG-PROJECT-03), focus moves to the field, nothing is sent                                          | AC-PROJECT-122                |
| General › Save, server 409                                | Alert MSG-PROJECT-07 above the form with "Reload"; my input is kept until I click Reload                                     | AC-PROJECT-21                 |
| General › Discard                                         | Fields go back to the saved values                                                                                           | AC-PROJECT-122                |
| Leave General (tab, section or link) with unsaved changes | Confirm dialog MSG-COMMON-15 with "Stay" and "Leave"; Leave drops the changes                                                | AC-PROJECT-123                |
| Guests: flip switches, Save, Cancel                       | As today: `PUT /api/projects/:key/guest-visibility`; toast MSG-GUEST-02; Cancel restores the saved list                      | AC-GUEST-02                   |
| Danger zone › Archive… → confirm                          | SCR-PROJECT-02 archive dialog; `POST …/archive`; archived banner appears, page becomes read-only, the row turns into Restore | AC-PROJECT-30, AC-PROJECT-124 |
| Danger zone › Restore                                     | `POST …/restore`; banner goes, forms editable again                                                                          | AC-PROJECT-32                 |
| Danger zone › Delete… (archived only)                     | SCR-PROJECT-02 delete dialog (type the key); `DELETE`; go to `/projects`, toast                                              | AC-PROJECT-35                 |
| Delete… on an active project                              | Button disabled, "Archive the project first." under it                                                                       | AC-PROJECT-124                |

## States

| State                             | What the user sees                                                                                                                                        | Criteria                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Loading                           | Header skeleton of SCR-PROJECT-02; section nav shown, content skeleton                                                                                    |                             |
| Member or Guest opens any section | "Page not found" (MSG-COMMON-13); no "Project settings" entry is shown to them                                                                            | AC-GUEST-05, AC-PROJECT-125 |
| System admin, not a member        | Banner MSG-ADMIN-08 (from SCR-PROJECT-02); everything editable                                                                                            |                             |
| Archived                          | Banner from SCR-PROJECT-02; General fields read-only without Save/Discard; Guests switches disabled without buttons; Danger zone shows Restore and Delete | AC-PROJECT-124              |
| Saving                            | Save button disabled and reads "Saving…"                                                                                                                  |                             |
| Validation error                  | Message under the field (`aria-describedby`), focus on the first invalid field                                                                            | AC-PROJECT-122              |
| Conflict (409)                    | Alert MSG-PROJECT-07 with Reload                                                                                                                          | AC-PROJECT-21               |
| Server error                      | Error text in an alert at the top of the section; input kept                                                                                              |                             |
| Success                           | Toast MSG-PROJECT-19 (General) or MSG-GUEST-02 (Guests)                                                                                                   | AC-PROJECT-19, AC-GUEST-02  |

## Permissions

| Access level                | Can see                                                   | Can do                                                                                          |
| --------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Project admin, System admin | Every section                                             | Everything on this page (`project:edit`, `project:guests`, `project:archive`, `project:delete`) |
| Member (any job title)      | Nothing ("Page not found")                                | —                                                                                               |
| Guest                       | Nothing ("Page not found")                                | —                                                                                               |
| Not a member                | "Project not found" (MSG-PROJECT-06), from SCR-PROJECT-02 | —                                                                                               |

The API already enforces every one of these (DD-PROJECT-01); the page only hides what the API would refuse.

## Accessibility

- Page title as in SCR-PROJECT-02; `<h1>` stays the project name (SCR-PROJECT-02); each section
  has one `<h2>` ("General", "Guests", "Danger zone").
- Section nav: `<nav aria-label="Settings sections">` with links; the current one has `aria-current="page"`.
- Tab order: side nav → project header → section nav → section content → Save/Discard.
- Focus: after a section link, focus moves to the section `<h2>`; after a failed save, to the first invalid field;
  after a dialog closes, back to the button that opened it.
- Errors are announced with `role="alert"`; toasts with `role="status"`.
- Danger zone buttons are named "Archive…", "Restore", "Delete…"; a disabled Delete has its reason linked with
  `aria-describedby`.
- Guest switches: each is a `button` with `role="switch"`, `aria-checked` and a `<label>` with the area name, inside a
  `role="group"` named "Areas Guests can see"; disabled switches use the `disabled` attribute.
- Text contrast at least 4.5:1; the danger zone is marked by its heading and words, not only by red.

## Responsive

Below 768 px: the section nav is a wrapping row of links above the section; form fields take the full width;
Save/Discard stay at the end of the form.

## Locators for tests

- Sections: `page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: 'Guests' })`
- Section heading: `page.getByRole('heading', { level: 2, name: 'General' })`
- Fields: `page.getByLabel('Name')`, `page.getByLabel('Description')`
- Buttons: `getByRole('button', { name: 'Save' })`, `'Discard'`, `'Archive…'`, `'Restore'`, `'Delete…'`
- Guest switches: `page.getByRole('switch', { name: 'Members list' })`
- Unsaved-changes dialog: `page.getByRole('alertdialog')`

No `data-testid` is needed.

## Change log

| Date       | Change                                                                                                              | Why                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 2026-10-09 | First version: split out of SCR-PROJECT-02; section nav, inline General form, Danger zone                           | Screen inventory v1.2, per-screen workflow             |
| 2026-10-10 | Entry point is the side nav item "Project settings" (the project tab bar is being removed by SCR-PROJECT-02); built | Linh's choice in the page-frame thread; code in PR #17 |
