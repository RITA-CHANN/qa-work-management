---
title: Authentication messages
type: messages
feature: auth
status: review
phase: 2
updated: 2026-10-07
---

# Authentication messages

Code: `packages/shared/src/messages.ts`, used as `msg('MSG-AUTH-01')`. `npm run docs:check` fails if the text below and the
code differ. Tests should assert these exact texts. Shared texts: [../common/messages.md](../common/messages.md).

| ID          | Where                   | Message                                          |
| ----------- | ----------------------- | ------------------------------------------------ |
| MSG-AUTH-01 | Wrong email or password | Invalid email or password                        |
| MSG-AUTH-02 | Blocked by rate limit   | Too many login attempts. Please try again later. |
| MSG-AUTH-03 | Email empty             | Email is required                                |
| MSG-AUTH-04 | Email invalid           | Enter a valid email address                      |
| MSG-AUTH-05 | Password empty          | Password is required                             |

Server messages (MSG-AUTH-01, MSG-AUTH-02) are announced to screen readers (`role="alert"`). Every field has a visible label.
