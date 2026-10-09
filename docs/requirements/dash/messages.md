---
title: Project dashboard messages
type: messages
feature: dash
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Project dashboard messages

Code: `packages/shared/src/messages.ts`, used as `msg('MSG-DASH-01')`. `npm run docs:check` fails if the text below
and the code differ. Tests should assert these exact texts. Shared texts (403, 404, validation):
[../common/messages.md](../common/messages.md).

| ID          | Where                                      | Kind | Shown as | Message                |
| ----------- | ------------------------------------------ | ---- | -------- | ---------------------- |
| MSG-DASH-01 | Release card: no active or planned release | info | status   | No release planned yet |
| MSG-DASH-02 | Sprint card: no active sprint              | info | status   | No sprint running      |

`Kind`: error, warning, info, success. `Shown as`: field, alert, status, toast, page, api (API response only).

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
