---
id: API-<RESOURCE>-NN
title: METHOD /api/path
type: api
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

# METHOD /api/path

One sentence: what this endpoint does and who uses it. Status codes follow RFC 9110; the error body format is in
[README.md](README.md#error-codes).

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Auth**        | None / Logged in / System admin / Project admin / Any member |
| **Since phase** | N                                                            |
| **Schema**      | `packages/shared/src/<file>.ts` (`<schemaName>`)             |

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

## Security

Checked against the OWASP API Security Top 10 (2023):

| Risk                                                                             | How this endpoint handles it |
| -------------------------------------------------------------------------------- | ---------------------------- |
| API1 Broken object level authorization                                           |                              |
| API2 Broken authentication                                                       |                              |
| API3 Broken object property level authorization (data exposure, mass assignment) |                              |
| API4 Unrestricted resource consumption                                           |                              |
| API5 Broken function level authorization                                         |                              |

## Side effects

Is it safe to call twice (idempotent)? What it writes (tables, activity log, cookies).

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

## Change log

| Date | Change | Why |
| ---- | ------ | --- |
