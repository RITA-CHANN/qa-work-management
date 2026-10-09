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

Guest access has no texts of its own. An area that is off answers like any unknown resource (404, MSG-COMMON-07)
and a write by a Guest is refused like any other forbidden action (403, MSG-COMMON-06); both are in
[../common/messages.md](../common/messages.md). Add rows here, and to `MESSAGES` in
`packages/shared/src/messages.ts`, if a Guest-specific text is needed later.

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
