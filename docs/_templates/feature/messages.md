---
title: <Feature name> messages
type: messages
feature: <feature>
status: draft
phase: <N>
owner: <who>
reviewers: [Linh]
approved:
updated: YYYY-MM-DD
---

# <Feature name> messages

Code: add each row to `MESSAGES` in `packages/shared/src/messages.ts` too (`'MSG-<FEATURE>-01': '…'`);
`npm run docs:check` fails if the two differ.

Writing rules (WCAG 2.2): an error says **what is wrong and how to fix it** (3.3.1, 3.3.3); a field error is shown
under its field and linked to it with `aria-describedby`; a message that appears without moving focus uses
`role="alert"` (errors) or `role="status"` (everything else) so screen readers announce it (4.1.3).

| ID               | Where | Kind  | Shown as | Message |
| ---------------- | ----- | ----- | -------- | ------- |
| MSG-<FEATURE>-01 |       | error | field    |         |

`Kind`: error, warning, info, success. `Shown as`: field, alert, status, toast, page, api (API response only).

## Change log

| Date | Change | Why |
| ---- | ------ | --- |
