---
id: ADR-0010
title: API errors use RFC 9457 problem details
type: decision
status: proposed
phase: 3
owner: Claude
reviewers: [Linh]
deciders: [Linh, Claude]
approved:
updated: 2026-10-08
---

# ADR-0010 API errors use RFC 9457 problem details

Format: MADR 4.0 (Markdown Architectural Decision Records), the decision-and-rationale part of an ISO/IEC/IEEE
42010 architecture description.

## Context and problem

Since Phase 1 the API answers errors as `{ "error": { "code", "message", "details", "requestId" } }`, a shape we
made up. The documentation standards Linh approved (docs/STANDARDS.md) name RFC 9457 "Problem Details for HTTP
APIs" as the current standard. Only three endpoints exist, so changing now is cheap; after Phase 3 there will be
twenty more.

## Decision drivers

- Follow the current international standard (Linh's rule for all docs and APIs).
- Keep what tests and the web app use today: a stable machine `code`, the message ID, field errors, `requestId`.
- One schema that `openapi.yaml` can describe and contract tests can check.

## Considered options

1. RFC 9457 `application/problem+json` with extension members `code`, `messageId`, `errors`, `requestId`.
2. Keep the current `{ error: {…} }` shape and document a mapping to RFC 9457.

## Decision outcome

Chosen option: "RFC 9457 with extension members", because it is the standard (driver 1), RFC 9457 explicitly
allows extension members so nothing we rely on is lost (driver 2), and one `problemSchema` covers every error
(driver 3). Linh chose it with the documentation standards (default "switch in Phase 3").

```json
{
  "type": "https://qawm.test/problems/project-archived",
  "title": "Project is archived",
  "status": 422,
  "detail": "This project is archived. Restore it to make changes.",
  "instance": "/api/projects/OLD",
  "code": "PROJECT_ARCHIVED",
  "messageId": "MSG-PROJECT-08",
  "requestId": "…"
}
```

| Member      | Meaning                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------- |
| `type`      | URI naming the problem type; one per `code`, listed in `docs/api/README.md`              |
| `title`     | Short, fixed summary of the type                                                         |
| `status`    | Same as the HTTP status                                                                  |
| `detail`    | The user-facing text, from the message catalog                                           |
| `instance`  | The request path                                                                         |
| `code`      | Our stable machine code (`VALIDATION_ERROR`, `VERSION_CONFLICT`, `LAST_OWNER`, …)        |
| `messageId` | The `MSG-…` ID of `detail`, so the web app and tests don't compare free text             |
| `errors`    | Only for 400: `[{ "pointer": "/name", "detail": "…", "messageId": "…" }]` (JSON Pointer) |
| `requestId` | Same as the `X-Request-Id` header                                                        |

### Consequences

- Good, because clients and tools that know RFC 9457 understand our errors without our docs.
- Good, because `messageId` makes tests independent of wording changes.
- Bad, because the Phase 2 auth endpoints change shape: Linh's auth API tests that read `body.error.code` must
  change to `body.code`. This is planned in her Phase 3 exercise.
- Bad, because `Content-Type` is `application/problem+json`, so code that checks for `application/json` only must
  accept both.

### Confirmation

NFR-PROJECT-08: every error response validates against `problemSchema` in `openapi.yaml`; a unit test on the error
handler; `docs:check` compares the error tables in the endpoint docs with the OpenAPI file.

## Pros and cons of the options

### RFC 9457 with extension members

- Good, because it is the standard and keeps our fields.
- Bad, because a breaking change for existing tests.

### Keep the current shape with a mapping

- Good, because nothing breaks.
- Bad, because we document one thing and send another; later phases multiply the gap.

## More information

RFC 9457 (July 2023, replaces RFC 7807). docs/STANDARDS.md (API row). Endpoint error tables in
[docs/api/](../api/README.md).
