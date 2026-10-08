---
id: FLW-<FEATURE>-NN
title: <Flow name>
type: flow
feature: <feature>
status: draft
phase: <N>
owner: <who>
reviewers: [Linh]
approved:
traces:
  requirements: []
  acceptance: []
  design: []
updated: YYYY-MM-DD
---

# FLW-<FEATURE>-NN <Flow name>

A use case (ISO/IEC/IEEE 29148, UML 2.5): who does what, in which order, and what happens when it goes wrong.
Exception flows are the best source of negative test cases.

## Actors

## Preconditions

## Postconditions

What is true after the main flow succeeds.

## Diagram

```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -- yes --> C[Screen]
    B -- no --> D[Other screen]
```

## Main flow

1.

## Alternative flows

| ID  | At step | Condition | What happens | Criteria |
| --- | ------- | --------- | ------------ | -------- |
| A1  |         |           |              |          |

## Exception flows

| ID  | At step | Error | What happens | Criteria |
| --- | ------- | ----- | ------------ | -------- |
| E1  |         |       |              |          |

## Change log

| Date | Change | Why |
| ---- | ------ | --- |
