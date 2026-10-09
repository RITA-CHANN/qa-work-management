# Glossary

Terms used in the requirements, design and tests (ISO/IEC/IEEE 24765 and the ISTQB Glossary where they define
the term). Add a term the first time a doc uses it.

| Term                       | Meaning in this app                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Acceptance criterion (AC)  | A testable condition, written Given/When/Then, that shows a story or rule is met.                                               |
| Activity log               | The append-only list of who changed what in a project, and when (Phase 3).                                                      |
| Actor                      | A person or system that interacts with the app (Guest, User, Admin, …).                                                         |
| Archived project           | A project that is read-only for everyone until an Owner restores it; hidden from the default list.                              |
| Business rule (BR)         | A rule the business sets that the system must follow, independent of the screen.                                                |
| Defect                     | A flaw that makes the app behave differently from its requirements. Reported as a GitHub issue.                                 |
| Guest                      | Someone who is not logged in.                                                                                                   |
| Member                     | A user added to a project with exactly one project role.                                                                        |
| Milestone                  | An agile iteration (a sprint) of 1–28 days inside a release, with a goal and a status.                                          |
| Non-functional requirement | How well the app must work (speed, security, accessibility), measured against ISO/IEC 25010.                                    |
| Optimistic locking         | Detecting that someone else saved first by comparing a version number; the later save gets 409.                                 |
| Problem details            | The standard error body of RFC 9457 (`application/problem+json`) used by the API from Phase 3.                                  |
| Product risk               | Something that could go wrong in the product, rated by likelihood and impact.                                                   |
| Project                    | A piece of work that the team tests; it has members with roles, releases, milestones and an activity log (Phase 3).             |
| Project role               | What a member may do in one project: Owner, Project manager, QA lead, QA engineer, Team lead, Developer, Stakeholder or Viewer. |
| Release                    | A planned or shipped version of the product under test, for example "2.4"; split into milestones.                               |
| Seed data                  | Data the database is filled with on reset, used by development and tests.                                                       |
| Session                    | A logged-in period, kept on the server and identified by a cookie.                                                              |
| Test case                  | Inputs, steps and expected results that check a test condition. A Playwright test, or an `MTC-` case.                           |
| Test condition (TCO)       | Something to test, derived from a criterion with a test design technique.                                                       |
| Traceability               | The links from a requirement to its design, API, tests and results, in both directions.                                         |
| User story (US)            | A need written as "As a …, I want …, so that …".                                                                                |
