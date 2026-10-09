---
title: App shell messages
type: messages
feature: shell
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# App shell messages

Code: `packages/shared/src/messages.ts`, used as `msg('MSG-SHELL-01', { query })`. `npm run docs:check` fails if
the text below and the code differ. Tests should assert these exact texts. Shared texts (403, 404, validation):
[../common/messages.md](../common/messages.md). `{query}` is filled in at run time.

| ID           | Where                | Kind | Shown as | Message                  |
| ------------ | -------------------- | ---- | -------- | ------------------------ |
| MSG-SHELL-01 | ⌘K search: no result | info | status   | No results for "{query}" |

`Kind`: error, warning, info, success. `Shown as`: field, alert, status, toast, page, api (API response only).

## Change log

| Date       | Change                                                      | Why      |
| ---------- | ----------------------------------------------------------- | -------- |
| 2026-10-09 | First version, from the Phase 3C business requirements v1.3 | Phase 3C |
