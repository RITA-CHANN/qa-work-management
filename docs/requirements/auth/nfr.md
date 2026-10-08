---
title: Authentication non-functional requirements
type: nfr
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
updated: 2026-10-08
---

# Authentication non-functional requirements

How well login must work, by ISO/IEC 25010:2023 quality characteristic. Values for each column:
[docs/README.md](../../README.md#requirement-attributes).

| ID          | Requirement                                                          | Quality characteristic | Measure                                                                                           | Priority | Verify           | Source                        |
| ----------- | -------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- | -------- | ---------------- | ----------------------------- |
| NFR-AUTH-01 | Passwords are stored with a slow, salted hash                        | Security               | argon2id with the library defaults; no plain text in the database or logs                         | Must     | Review, Unit     | ADR-0007                      |
| NFR-AUTH-02 | The response does not reveal whether an email has an account         | Security               | Same status, code and message for unknown email and wrong password; dummy hash for unknown emails | Must     | Auto-API, Review | BR-AUTH-03                    |
| NFR-AUTH-03 | The session cookie can't be read by scripts or sent from other sites | Security               | `HttpOnly`, `SameSite=Lax`, and `Secure` in production                                            | Must     | Auto-API         | BR-AUTH-15                    |
| NFR-AUTH-04 | Login answers quickly                                                | Performance efficiency | 95% of successful logins answer in under 1 second on a developer laptop                           | Should   | Manual           | Phase 2 business requirements |
| NFR-AUTH-05 | The login screen can be used with a keyboard and a screen reader     | Interaction capability | WCAG 2.2 level AA on SCR-AUTH-01 and SCR-AUTH-02; no axe violations                               | Should   | Manual           | Documentation standards       |

## Change log

| Date       | Change        | Why                                         |
| ---------- | ------------- | ------------------------------------------- |
| 2026-10-08 | First version | Documentation standards (docs/STANDARDS.md) |
