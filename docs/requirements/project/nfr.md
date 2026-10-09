---
title: Projects non-functional requirements
type: nfr
feature: project
status: review
owner: Claude
reviewers: [Linh]
phase: 3
updated: 2026-10-09
---

# Projects non-functional requirements

How well projects must work, by ISO/IEC 25010:2023 quality characteristic. Values for each column:
[docs/README.md](../../README.md#requirement-attributes).

| ID             | Requirement                                                                        | Quality characteristic | Measure                                                                                                                                        | Priority | Verify           | Source                  |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- | ----------------------- |
| NFR-PROJECT-01 | A non-member can't tell whether a project exists                                   | Security               | Every project endpoint returns the same 404 status, `code` and `detail` for an unknown key and for a project the caller is not in (OWASP API1) | Must     | Auto-API         | BR-PROJECT-06, ADR-0008 |
| NFR-PROJECT-02 | Permissions are checked on the server for every action, not only by hiding buttons | Security               | One permission map; a unit test covers both access levels × every action in the matrix; every write endpoint calls the check (OWASP API5)      | Must     | Unit, Review     | BR-PROJECT-35           |
| NFR-PROJECT-03 | A change and its activity entry are saved together or not at all                   | Reliability            | Both written in one database transaction; a forced failure after the change leaves neither                                                     | Must     | Unit, Auto-API   | BR-PROJECT-22           |
| NFR-PROJECT-04 | A request can't set fields it is not allowed to set                                | Security               | `key`, `id`, `createdById`, `status` (on create) and unknown fields in a body are rejected with 400 (OWASP API3, mass assignment)              | Must     | Auto-API         | DD-PROJECT-01           |
| NFR-PROJECT-05 | List endpoints can't be asked for unlimited data                                   | Security               | Activity pages hold at most 100 entries (default 20); `search` is at most 100 characters (OWASP API4)                                          | Should   | Auto-API         | DD-PROJECT-02           |
| NFR-PROJECT-06 | Project pages answer quickly with realistic data                                   | Performance efficiency | With 200 projects and 10 000 activity entries, 95% of list, detail and activity requests answer in under 500 ms on a developer laptop          | Should   | Manual           | Phase 3 plan            |
| NFR-PROJECT-07 | The project screens can be used with a keyboard and a screen reader                | Interaction capability | WCAG 2.2 level AA on SCR-PROJECT-01 to SCR-PROJECT-05; no axe violations; every dialog traps and returns focus                                 | Should   | Manual           | Documentation standards |
| NFR-PROJECT-08 | Errors have one standard shape across the API                                      | Maintainability        | Every error response is `application/problem+json` (RFC 9457) and matches the `problemSchema` in `openapi.yaml`                                | Must     | Auto-API, Review | ADR-0010                |

## Change log

| Date       | Change                                                                                  | Why                        |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------- |
| 2026-10-08 | First version                                                                           | Phase 3A                   |
| 2026-10-09 | Role model v2: Project admin / Member + job title; only a System admin creates projects | Linh's decision 2026-10-09 |
