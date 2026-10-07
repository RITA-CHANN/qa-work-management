---
title: Common messages
type: messages
feature: common
status: review
phase: 1
updated: 2026-10-07
---

# Common messages

Code: `packages/shared/src/messages/common.ts` (`COMMON_MESSAGES`). `npm run docs:check` fails if the text below and
the code differ. `{name}` is filled in at run time.

| ID            | Where                                            | Message                                                        |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| MSG-COMMON-01 | Web: an error the page does not expect           | Something went wrong. Please try again.                        |
| MSG-COMMON-02 | API 500 (`INTERNAL_ERROR`)                       | Something went wrong. Quote the requestId when reporting this. |
| MSG-COMMON-03 | API 400: body is not JSON                        | Request body is not valid JSON                                 |
| MSG-COMMON-04 | API 400 (`VALIDATION_ERROR`), field errors below | Request validation failed                                      |
| MSG-COMMON-05 | API 401 (`UNAUTHENTICATED`)                      | Authentication required                                        |
| MSG-COMMON-06 | API 403 (`FORBIDDEN`)                            | You do not have permission to do this                          |
| MSG-COMMON-07 | API 404 (`NOT_FOUND`)                            | Resource not found                                             |
| MSG-COMMON-08 | API 404 for an unknown route                     | Route {method} {path} does not exist                           |
| MSG-COMMON-09 | API 415 (`UNSUPPORTED_MEDIA_TYPE`)               | Content-Type must be application/json                          |
| MSG-COMMON-10 | Header API status: waiting for `/api/health`     | Checking…                                                      |
| MSG-COMMON-11 | Header API status: API answered ok               | Online                                                         |
| MSG-COMMON-12 | Header API status: API down or not ok            | Offline                                                        |
| MSG-COMMON-13 | Unknown page: heading                            | Page not found                                                 |
| MSG-COMMON-14 | Unknown page: text under the heading             | The page you are looking for does not exist.                   |
