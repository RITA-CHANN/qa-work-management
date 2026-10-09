---
title: Guest access messages
type: messages
feature: guest
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Guest access messages

An area that is off answers like any unknown resource (404, MSG-COMMON-07) and a write by a Guest is refused like
any other forbidden action (403, MSG-COMMON-06); both are in [../common/messages.md](../common/messages.md).

| ID           | When                                                 | Kind    | Shown as | Text                                                          |
| ------------ | ---------------------------------------------------- | ------- | -------- | ------------------------------------------------------------- |
| MSG-GUEST-01 | A Guest opens the dashboard while it is off for them | info    | status   | The project admins have not shared the dashboard with Guests. |
| MSG-GUEST-02 | Toast after a Project admin saves Guest visibility   | success | toast    | Guest access saved                                            |

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
| 2026-10-09 | Added MSG-GUEST-01 and MSG-GUEST-02                         | 3C code  |
