---
id: SCR-<FEATURE>-NN
title: <Screen name>
type: screen
feature: <feature>
status: draft # draft | review | approved | deprecated
phase: <N>
owner: <who>
reviewers: [Linh]
approved:
route: /<path>
traces:
  requirements: [US-<FEATURE>-01, BR-<FEATURE>-01]
  acceptance: [AC-<FEATURE>-01]
  api: []
  design: []
updated: YYYY-MM-DD
---

# SCR-<FEATURE>-NN <Screen name>

What the screen is for and who uses it. Follows ISO 9241-110 (interaction principles) and WCAG 2.2 level AA.

## Layout

```
(ASCII wireframe, or a link to a Figma frame / image in docs/assets/)
```

## Fields

| Field | Input type | Required | Client validation | Message | Notes |
| ----- | ---------- | -------- | ----------------- | ------- | ----- |

## Actions

| Action | Result | Criteria |
| ------ | ------ | -------- |

## States

Cover at least: empty, loading, error, no permission, success.

| State | What the user sees | Criteria |
| ----- | ------------------ | -------- |

## Permissions

| Role | Can see | Can do |
| ---- | ------- | ------ |

## Accessibility

- Page title and `<h1>`:
- Landmarks (`header`, `nav`, `main`):
- Tab order:
- Focus after submit, error and close:
- Accessible names of buttons and links:
- How errors and status messages are announced (`role="alert"` / `role="status"`):
- Colour contrast at least 4.5:1 for text; nothing is shown by colour alone.

## Responsive

What changes on a narrow screen (below 768 px).

## Locators for tests

Roles and labels first (`getByRole`, `getByLabel`); `data-testid` only when there is no accessible name.

## Change log

| Date | Change | Why |
| ---- | ------ | --- |
