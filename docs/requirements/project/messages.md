---
title: Projects messages
type: messages
feature: project
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-08
---

# Projects messages

Code: `packages/shared/src/messages.ts`, used as `msg('MSG-PROJECT-07')`. `npm run docs:check` fails if the text
below and the code differ. Tests should assert these exact texts. Shared texts (403, 404, validation):
[../common/messages.md](../common/messages.md). `{name}` and similar are filled in at run time.

| ID             | Where                                   | Kind    | Shown as | Message                                                             |
| -------------- | --------------------------------------- | ------- | -------- | ------------------------------------------------------------------- |
| MSG-PROJECT-01 | Key empty                               | error   | field    | Key is required                                                     |
| MSG-PROJECT-02 | Key wrong format                        | error   | field    | Key must be 2–10 letters or digits and start with a letter          |
| MSG-PROJECT-03 | Name empty or wrong length              | error   | field    | Name must be 3–100 characters                                       |
| MSG-PROJECT-04 | Key already used                        | error   | field    | This key is already in use                                          |
| MSG-PROJECT-05 | Description too long                    | error   | field    | Description must be at most 2000 characters                         |
| MSG-PROJECT-06 | Project not found (page and API 404)    | error   | page     | Project not found                                                   |
| MSG-PROJECT-07 | Edit conflict (409)                     | error   | alert    | Someone else changed this project. Reload to see their changes.     |
| MSG-PROJECT-08 | Change on an archived project (422)     | error   | alert    | This project is archived. Restore it to make changes.               |
| MSG-PROJECT-09 | Delete not allowed (422)                | error   | alert    | Only an archived project with no releases can be deleted.           |
| MSG-PROJECT-10 | Delete confirm field, wrong key         | error   | field    | Type {key} to confirm                                               |
| MSG-PROJECT-11 | Member already exists (409)             | error   | alert    | {name} is already a member of this project                          |
| MSG-PROJECT-12 | Last owner (422)                        | error   | alert    | A project must have at least one owner                              |
| MSG-PROJECT-13 | Release name empty or too long          | error   | field    | Release name must be 1–50 characters                                |
| MSG-PROJECT-14 | Release name taken                      | error   | field    | A release with this name already exists in this project             |
| MSG-PROJECT-15 | Target before start                     | error   | field    | Target date must be on or after the start date                      |
| MSG-PROJECT-16 | Status backwards (409)                  | error   | alert    | Release status can only move forward                                |
| MSG-PROJECT-17 | Second active release (422)             | error   | alert    | Release {name} is already active. Release it first.                 |
| MSG-PROJECT-18 | Delete release not allowed (422)        | error   | alert    | Only a planned release with no milestones can be deleted            |
| MSG-PROJECT-19 | Toast after save                        | success | toast    | Changes saved                                                       |
| MSG-PROJECT-20 | Search: no match                        | info    | status   | No projects match your search                                       |
| MSG-PROJECT-21 | List: no projects at all                | info    | status   | You are not a member of any project yet. Create one to get started. |
| MSG-PROJECT-22 | Change own role (422)                   | error   | alert    | You cannot change your own role                                     |
| MSG-PROJECT-23 | Milestone name empty or too long        | error   | field    | Milestone name must be 1–50 characters                              |
| MSG-PROJECT-24 | Milestone dates missing or wrong length | error   | field    | A milestone needs a start and end date, 1–{maxDays} days long       |
| MSG-PROJECT-25 | Milestone outside its release           | error   | field    | Milestone dates must be within release {name} ({start} – {end})     |
| MSG-PROJECT-26 | Milestones overlap (422)                | error   | alert    | Overlaps milestone {name} ({start} – {end})                         |
| MSG-PROJECT-27 | Release with open milestones (422)      | error   | alert    | Complete all milestones of this release first                       |
| MSG-PROJECT-28 | Milestone status backwards (409)        | error   | alert    | Milestone status can only move forward                              |
| MSG-PROJECT-29 | Cannot activate milestone (422)         | error   | alert    | Only one milestone can be active, and its release must be active    |
| MSG-PROJECT-30 | Milestone name taken                    | error   | field    | A milestone with this name already exists in this project           |
| MSG-PROJECT-31 | Delete non-planned milestone (422)      | error   | alert    | Only a planned milestone can be deleted                             |

`Kind` and `Shown as` are explained in the [template](../../_templates/feature/messages.md). API errors carry the
same text in the problem body's `detail` and the ID in `messageId`
([ADR-0010](../../decisions/ADR-0010-problem-details-errors.md)), so the web app can show it without copying it.
Field messages are linked to their input with `aria-describedby`; alerts use `role="alert"`, toasts and the empty
states use `role="status"`.

## Change log

| Date       | Change                                                                                                         | Why      |
| ---------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-10-08 | First version, from the Phase 3 business requirements v2 (with Linh's answers to Q-PROJECT-01 to Q-PROJECT-05) | Phase 3A |
