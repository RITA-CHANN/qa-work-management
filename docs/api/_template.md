---
id: API-<RESOURCE>-NN
title: METHOD /api/path
type: api
feature: <feature>
status: draft
phase: <N>
traces:
  requirements: []
  acceptance: []
updated: YYYY-MM-DD
---

# METHOD /api/path

One sentence: what this endpoint does and who uses it.

|                 |                                                  |
| --------------- | ------------------------------------------------ |
| **Auth**        | None / Logged in / Project role: …               |
| **Since phase** | N                                                |
| **Schema**      | `packages/shared/src/<file>.ts` (`<schemaName>`) |

## Request

### Path parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

### Query parameters

| Name | Type | Required | Default | Description |
| ---- | ---- | -------- | ------- | ----------- |

### Body

| Field | Type | Required | Rules |
| ----- | ---- | -------- | ----- |

```json
{}
```

## Responses

### 200 OK

```json
{ "data": {} }
```

| Field | Type | Description |
| ----- | ---- | ----------- |

### Errors

| Status | `code` | When |
| ------ | ------ | ---- |

## Example

```bash
curl -i http://localhost:3000/api/path
```

## Test ideas

| Type       | Case | Expected |
| ---------- | ---- | -------- |
| Happy path |      |          |
| Negative   |      |          |
| Boundary   |      |          |
| Permission |      |          |
