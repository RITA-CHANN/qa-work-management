---
id: DD-<FEATURE>-NN
title: <Topic>
type: detail-design
feature: <feature>
status: draft
phase: <N>
traces:
  requirements: []
  acceptance: []
  api: []
  design: []
updated: YYYY-MM-DD
---

# DD-<FEATURE>-NN <Topic>

How it works inside: modules, data, algorithm, edge cases.

## Sequence

```mermaid
sequenceDiagram
    participant W as Web
    participant A as API
    participant DB as Postgres
    W->>A: request
    A->>DB: query
    A-->>W: response
```

## Rules in code

| Topic | Behaviour | Rule |
| ----- | --------- | ---- |

## Change log

| Date | Change | Why |
| ---- | ------ | --- |
