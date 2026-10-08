# Documentation standards

Every kind of doc in this repo follows a current international standard. We use a **tailored** (lighter) form,
which the standards allow as long as the information they require is present. The templates in
[\_templates/](_templates/README.md) put this into practice and `npm run docs:check` enforces the required
sections, columns and values.

| Doc                                                   | Main standard                                                                        | Also used                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| All docs: front matter, review, change log            | ISO/IEC/IEEE 15289:2019 (content of life-cycle information items)                    | ISO/IEC/IEEE 24765 (vocabulary), [glossary.md](glossary.md)                                       |
| Requirements: feature, stories, rules, acceptance     | ISO/IEC/IEEE 29148:2018 (requirements engineering)                                   | ISTQB CTFL v4.0, Given/When/Then                                                                  |
| Non-functional requirements (`nfr.md`)                | ISO/IEC 25010:2023 (product quality model)                                           | OWASP ASVS 5.0, WCAG 2.2                                                                          |
| Messages                                              | WCAG 2.2 (3.3.1 Error Identification, 3.3.3 Error Suggestion, 4.1.3 Status Messages) |                                                                                                   |
| Screens                                               | ISO 9241-110:2020 (interaction principles), WCAG 2.2 level AA                        | ISO/IEC 25010 interaction capability                                                              |
| User flows                                            | Use cases (ISO/IEC/IEEE 29148), UML 2.5.1                                            | BPMN 2.0 (ISO/IEC 19510) for business processes                                                   |
| Detail design                                         | IEEE 1016-2009 (software design descriptions, design viewpoints)                     | UML sequence and state diagrams                                                                   |
| [ARCHITECTURE.md](ARCHITECTURE.md)                    | ISO/IEC/IEEE 42010:2022 (architecture description)                                   | C4 model diagrams                                                                                 |
| Decisions (ADR)                                       | MADR 4.0, as the decision record of ISO/IEC/IEEE 42010                               |                                                                                                   |
| API                                                   | OpenAPI Specification 3.1, RFC 9110 (HTTP semantics)                                 | RFC 9457 (problem details for errors, from Phase 3), OWASP API Security Top 10 (2023)             |
| Database                                              | ISO/IEC 11179 (data element definitions)                                             | ISO/IEC 25012 (data quality), ISO 8601 (dates and times)                                          |
| Testing: plan, conditions, cases, risks, report, bugs | ISO/IEC/IEEE 29119-3:2021 (test documentation)                                       | ISO/IEC/IEEE 29119-2 (risk-based testing), 29119-4:2021 (test design techniques), ISTQB CTFL v4.0 |
| Traceability                                          | ISO/IEC/IEEE 29148 (two-way traces), ISTQB CTFL v4.0                                 | [traceability/](traceability/README.md)                                                           |

## Review checklist for a requirement (ISO/IEC/IEEE 29148)

A good requirement is **necessary, appropriate, unambiguous, complete, singular, feasible, verifiable, correct and
conforming**. In practice: one statement per row, no "and/or", no vague words ("fast", "user-friendly", "etc."),
a number wherever one is possible, and an acceptance criterion or a measure that proves it.

## Notes

- Playwright tests are the test case and test procedure specifications for automated tests; ISO/IEC/IEEE 29119-3
  allows test documentation to live in code. Only manual tests need `docs/testing/<feature>/manual-cases.md`.
- Versions come from git. Each doc keeps a short change log for business-visible changes.
- The ISO standards are paid documents. This mapping follows their published scope and structure; if you buy one,
  check the clause details against it and update the templates.
