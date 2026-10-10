---
title: Common messages
type: messages
feature: common
status: review
owner: Claude
reviewers: [Linh]
phase: 1
updated: 2026-10-08
---

# Common messages

Code: `packages/shared/src/messages.ts`, used as `msg('MSG-COMMON-01')`. `npm run docs:check` fails if the text below and
the code differ. `{name}` is filled in at run time.

| ID            | Where                                            | Kind    | Shown as | Message                                                        |
| ------------- | ------------------------------------------------ | ------- | -------- | -------------------------------------------------------------- |
| MSG-COMMON-01 | Web: an error the page does not expect           | error   | alert    | Something went wrong. Please try again.                        |
| MSG-COMMON-02 | API 500 (`INTERNAL_ERROR`)                       | error   | api      | Something went wrong. Quote the requestId when reporting this. |
| MSG-COMMON-03 | API 400: body is not JSON                        | error   | api      | Request body is not valid JSON                                 |
| MSG-COMMON-04 | API 400 (`VALIDATION_ERROR`), field errors below | error   | api      | Request validation failed                                      |
| MSG-COMMON-05 | API 401 (`UNAUTHENTICATED`)                      | error   | api      | Authentication required                                        |
| MSG-COMMON-06 | API 403 (`FORBIDDEN`)                            | error   | api      | You do not have permission to do this                          |
| MSG-COMMON-07 | API 404 (`NOT_FOUND`)                            | error   | api      | Resource not found                                             |
| MSG-COMMON-08 | API 404 for an unknown route                     | error   | api      | Route {method} {path} does not exist                           |
| MSG-COMMON-09 | API 415 (`UNSUPPORTED_MEDIA_TYPE`)               | error   | api      | Content-Type must be application/json                          |
| MSG-COMMON-10 | Header API status: waiting for `/api/health`     | info    | status   | Checking…                                                      |
| MSG-COMMON-11 | Header API status: API answered ok               | success | status   | Online                                                         |
| MSG-COMMON-12 | Header API status: API down or not ok            | error   | status   | Offline                                                        |
| MSG-COMMON-13 | Unknown page: heading                            | error   | page     | Page not found                                                 |
| MSG-COMMON-14 | Unknown page: text under the heading             | error   | page     | The page you are looking for does not exist.                   |
| MSG-COMMON-15 | Leaving a form with unsaved changes              | warning | alert    | You have unsaved changes. Leave this page and lose them?       |

`Kind` and `Shown as` are explained in the [template](../../_templates/feature/messages.md); `api` means the text is
only in API responses.

## Change log

| Date       | Change                                | Why                                         |
| ---------- | ------------------------------------- | ------------------------------------------- |
| 2026-10-07 | First version                         | Phase 1                                     |
| 2026-10-08 | Added Kind and Shown as (WCAG 2.2)    | Documentation standards (docs/STANDARDS.md) |
| 2026-10-09 | Added MSG-COMMON-15 (unsaved changes) | SCR-PROJECT-06                              |
