---
title: <Feature name> messages
type: messages
feature: <feature>
status: draft
phase: <N>
updated: YYYY-MM-DD
---

# <Feature name> messages

Code: `packages/shared/src/messages/<feature>.ts`. Add each row there too, as `msg('MSG-<FEATURE>-01', '…')`;
`npm run docs:check` fails if the two differ.

| ID               | Where | Message |
| ---------------- | ----- | ------- |
| MSG-<FEATURE>-01 |       |         |
