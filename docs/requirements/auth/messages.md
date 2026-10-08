---
title: Authentication messages
type: messages
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
updated: 2026-10-08
---

# Authentication messages

Code: `packages/shared/src/messages.ts`, used as `msg('MSG-AUTH-01')`. `npm run docs:check` fails if the text below and the
code differ. Tests should assert these exact texts. Shared texts: [../common/messages.md](../common/messages.md).

| ID          | Where                   | Kind  | Shown as | Message                                          |
| ----------- | ----------------------- | ----- | -------- | ------------------------------------------------ |
| MSG-AUTH-01 | Wrong email or password | error | alert    | Invalid email or password                        |
| MSG-AUTH-02 | Blocked by rate limit   | error | alert    | Too many login attempts. Please try again later. |
| MSG-AUTH-03 | Email empty             | error | field    | Email is required                                |
| MSG-AUTH-04 | Email invalid           | error | field    | Enter a valid email address                      |
| MSG-AUTH-05 | Password empty          | error | field    | Password is required                             |

`Kind` and `Shown as` are explained in the [template](../../_templates/feature/messages.md). Server messages
(MSG-AUTH-01, MSG-AUTH-02) are announced to screen readers (`role="alert"`, WCAG 4.1.3). Field messages are linked to
their input with `aria-describedby` (WCAG 3.3.1). Every field has a visible label.

## Change log

| Date       | Change                             | Why                                         |
| ---------- | ---------------------------------- | ------------------------------------------- |
| 2026-10-07 | First version                      | Phase 2                                     |
| 2026-10-08 | Added Kind and Shown as (WCAG 2.2) | Documentation standards (docs/STANDARDS.md) |
