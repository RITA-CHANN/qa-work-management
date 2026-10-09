---
title: Projects business rules
type: rules
feature: project
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-08
---

# Projects business rules

One rule per row, and one testable statement per rule (ISO/IEC/IEEE 29148: singular, unambiguous, verifiable).
The permission matrix that BR-PROJECT-35 points to is in [README.md](README.md#permission-matrix).

## Project

| ID            | Rule                                                                                                                                                                                                                                               | Source                                                      | Status   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| BR-PROJECT-01 | Any logged-in user can create a project. The creator automatically becomes its **Owner**.                                                                                                                                                          | Phase 3 business requirements                               | proposed |
| BR-PROJECT-02 | **Key**: required, 2 to 10 characters, uppercase letters and digits only, must start with a letter (e.g. `SHOP`, `QA2`). Typed lower case is turned into upper case.                                                                               | Phase 3 business requirements                               | proposed |
| BR-PROJECT-03 | The key is **unique across all projects**, archived ones included, and **cannot be changed** after creation (later IDs like `SHOP-TC-12` depend on it).                                                                                            | Phase 3 business requirements                               | proposed |
| BR-PROJECT-04 | **Name**: required, 3 to 100 characters after trimming spaces. Names do not need to be unique.                                                                                                                                                     | Phase 3 business requirements                               | proposed |
| BR-PROJECT-05 | **Description**: optional, at most 2000 characters.                                                                                                                                                                                                | Phase 3 business requirements                               | proposed |
| BR-PROJECT-06 | A user sees **only** projects they are a member of. A project they are not in behaves as if it **does not exist** (404, not 403), so its name and key don't leak. Admins see all projects.                                                         | Phase 0 architecture (404 for other projects), Q-PROJECT-04 | proposed |
| BR-PROJECT-07 | If two people edit the same project at the same time, the second save is **refused** with MSG-PROJECT-07 and their changes are not saved, so nobody silently overwrites someone else (optimistic locking with a version number).                   | Phase 3 business requirements                               | proposed |
| BR-PROJECT-08 | **Archive**: an archived project is read-only for everyone (no edits, no member, release or milestone changes) until restored. It is hidden from the project list unless "Show archived" is on. Restoring makes it active again with all its data. | Phase 3 business requirements                               | proposed |
| BR-PROJECT-09 | **Delete** is permanent and only allowed for a project that is **archived first** and has **no releases**. Otherwise the user is told to archive it (MSG-PROJECT-09). The user must type the project key to confirm.                               | Linh's answer to Q-PROJECT-05                               | proposed |
| BR-PROJECT-35 | Each project role may do exactly the actions marked ✅ for it in the permission matrix ([README](README.md#permission-matrix)). Any other action by a member is refused with 403 (MSG-COMMON-06).                                                  | Permission matrix in README                                 | proposed |
| BR-PROJECT-36 | An Admin can do every action an Owner can, on every project, without being a member.                                                                                                                                                               | Phase 0 architecture (global roles)                         | proposed |

## Members

| ID            | Rule                                                                                                                                                                                                            | Source                        | Status   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- |
| BR-PROJECT-10 | A person can be a member of a project **once**, with exactly **one** role. Adding someone who is already a member is refused (MSG-PROJECT-11).                                                                  | Phase 3 business requirements | proposed |
| BR-PROJECT-11 | Only existing user accounts can be added (pick from a list; no invitations by email in this phase).                                                                                                             | Phase 3 business requirements | proposed |
| BR-PROJECT-12 | A project must always have **at least one Owner**. Removing or demoting the last Owner, or the last Owner leaving, is refused (MSG-PROJECT-12).                                                                 | Phase 3 business requirements | proposed |
| BR-PROJECT-13 | A change to someone's role takes effect on their **next request**; they don't need to log in again.                                                                                                             | Phase 3 business requirements | proposed |
| BR-PROJECT-23 | Owner, Project manager and QA lead can add members, change roles and remove members. Only an **Owner** can give the Owner role, change an Owner's role, or remove an Owner. A PM or QA lead who tries gets 403. | Linh's answer to Q-PROJECT-03 | proposed |
| BR-PROJECT-24 | Nobody can change **their own** role (no self-promotion), except an Owner stepping down while another Owner remains. Anyone can **leave** (BR-PROJECT-12 still applies).                                        | Q-PROJECT-06 default          | proposed |

## Releases

| ID            | Rule                                                                                                                                                                        | Source                        | Status   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- |
| BR-PROJECT-14 | **Release name**: required, 1 to 50 characters, unique **within the project** (case-insensitive: `2.4` and `2.4` are the same). Two projects can both have a release `2.4`. | Phase 3 business requirements | proposed |
| BR-PROJECT-15 | **Dates** are optional. If both are set, the target date must be **on or after** the start date.                                                                            | Phase 3 business requirements | proposed |
| BR-PROJECT-16 | **Status** moves forward only: `PLANNED → ACTIVE → RELEASED`. Moving backwards is refused (MSG-PROJECT-16).                                                                 | Phase 3 business requirements | proposed |
| BR-PROJECT-17 | At most **one** release per project is `ACTIVE` at a time. Activating a second one is refused until the first is released (MSG-PROJECT-17).                                 | Phase 3 business requirements | proposed |
| BR-PROJECT-18 | A release can be deleted only while it is `PLANNED` and has **no milestones**. (Later phases also block deleting a release that has runs or test cases.)                    | Phase 3 business requirements | proposed |
| BR-PROJECT-25 | A release can move to `RELEASED` only when **all its milestones are `COMPLETED`** (MSG-PROJECT-27).                                                                         | Phase 3 business requirements | proposed |

## Milestones (agile sprints)

A **milestone** is a time-boxed iteration (a sprint) inside a release: release 2.4 = Sprint 3 + Sprint 4.

| ID            | Rule                                                                                                                                                                                          | Source                                              | Status   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------- |
| BR-PROJECT-26 | A milestone belongs to one project and **must belong to one release** of that project. A release can have many milestones.                                                                    | Linh's answer to Q-PROJECT-02; Q-PROJECT-07 default | proposed |
| BR-PROJECT-27 | **Name**: required, 1 to 50 characters, unique within the project (case-insensitive, trimmed), e.g. "Sprint 4". **Goal**: optional, at most 500 characters.                                   | Linh's answer to Q-PROJECT-02 (agile)               | proposed |
| BR-PROJECT-28 | **Start date** and **end date** are **required**. End date is on or after start date. Length is **1 to 28 days** (end − start + 1), the usual 1–4 week sprint. The 28-day limit is a setting. | Q-PROJECT-08 default                                | proposed |
| BR-PROJECT-29 | If the release has a start and/or target date, the milestone must fit **inside** them (MSG-PROJECT-25).                                                                                       | Linh's answer to Q-PROJECT-02 (agile)               | proposed |
| BR-PROJECT-30 | Milestones of the **same release must not overlap** (a sprint starts after the previous one ends). Milestones in different releases may overlap.                                              | Linh's answer to Q-PROJECT-02 (agile)               | proposed |
| BR-PROJECT-31 | **Status** moves forward only: `PLANNED → ACTIVE → COMPLETED`. Moving backwards is refused (MSG-PROJECT-28).                                                                                  | Linh's answer to Q-PROJECT-02 (agile)               | proposed |
| BR-PROJECT-32 | At most **one** milestone per project is `ACTIVE`. A milestone can be activated only if its release is `ACTIVE` (MSG-PROJECT-29).                                                             | Linh's answer to Q-PROJECT-02 (agile)               | proposed |
| BR-PROJECT-33 | A milestone can be deleted only while it is `PLANNED`.                                                                                                                                        | Linh's answer to Q-PROJECT-02 (agile)               | proposed |
| BR-PROJECT-34 | On a milestone, the app shows **days left** (until end date) when Active, and "Overdue by N days" when Active past its end date. It is **not** closed automatically: a person completes it.   | Q-PROJECT-09 default                                | proposed |

## Activity log

| ID            | Rule                                                                                                                                                                                                    | Source                        | Status   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- |
| BR-PROJECT-19 | Every change in this phase writes one activity entry: project created, edited, archived, restored; member added, role changed, removed; release and milestone created, edited, status changed, deleted. | Phase 3 business requirements | proposed |
| BR-PROJECT-20 | An entry shows **who**, **what** (in plain words, e.g. "Minh Lead changed Linh QA's role from Viewer to QA engineer"), and **when**. For edits it shows the old and new value of each changed field.    | Phase 3 business requirements | proposed |
| BR-PROJECT-21 | Entries cannot be edited or deleted by anyone. They are newest first, 20 per page.                                                                                                                      | Phase 3 business requirements | proposed |
| BR-PROJECT-22 | A change and its activity entry are saved **together**: if one fails, neither is saved.                                                                                                                 | Phase 3 business requirements | proposed |

## Change log

| Date       | Change                                                                                                         | Why      |
| ---------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-10-08 | First version, from the Phase 3 business requirements v2 (with Linh's answers to Q-PROJECT-01 to Q-PROJECT-05) | Phase 3A |
