---
title: Authentication messages
type: messages
feature: auth
status: review
phase: 2
updated: 2026-10-07
---

# Authentication messages

Tests should assert these exact texts.

| ID          | Where                   | Message                                          |
| ----------- | ----------------------- | ------------------------------------------------ |
| MSG-AUTH-01 | Wrong email or password | Invalid email or password                        |
| MSG-AUTH-02 | Blocked by rate limit   | Too many login attempts. Please try again later. |
| MSG-AUTH-03 | Email empty             | Email is required                                |
| MSG-AUTH-04 | Email invalid           | Enter a valid email address                      |
| MSG-AUTH-05 | Password empty          | Password is required                             |

Server messages (MSG-AUTH-01, MSG-AUTH-02) are announced to screen readers (`role="alert"`). Every field has a visible label.
