---
title: Authentication business rules
type: rules
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
updated: 2026-10-08
---

# Authentication business rules

| ID         | Rule                                                                                                                                                                                                                                                                                                                             | Source                        | Status   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- |
| BR-AUTH-01 | Only seeded accounts can log in. Email is the login name and is **case-insensitive** (`Admin@Example.com` = `admin@example.com`). Leading and trailing spaces are ignored.                                                                                                                                                       | Phase 2 business requirements | approved |
| BR-AUTH-02 | Both email and password are required. The email must look like an email address.                                                                                                                                                                                                                                                 | Phase 2 business requirements | approved |
| BR-AUTH-03 | A wrong password and an unknown email show the **same** message (MSG-AUTH-01). The app never says which part was wrong.                                                                                                                                                                                                          | Phase 2 business requirements | approved |
| BR-AUTH-04 | After **5 failed logins** for the same email within **15 minutes**, further attempts for that email are blocked until the 15-minute window passes, even with the correct password. The window starts at the first failed attempt. Validation errors and blocked attempts are not counted as failures. The user sees MSG-AUTH-02. | Phase 2 business requirements | approved |
| BR-AUTH-05 | A login session lasts **7 days**. After that the user must log in again.                                                                                                                                                                                                                                                         | Phase 2 business requirements | approved |
| BR-AUTH-06 | Logging out ends the session **on the server**. The old session cannot be reused, even if someone copied the cookie.                                                                                                                                                                                                             | Phase 2 business requirements | approved |
| BR-AUTH-07 | Logging out in one browser does not log the user out of other browsers or devices.                                                                                                                                                                                                                                               | Phase 2 business requirements | approved |
| BR-AUTH-08 | Every page except `/login` requires a logged-in user. A guest who opens one is sent to `/login`, and after logging in returns to the page they asked for.                                                                                                                                                                        | Phase 2 business requirements | approved |
| BR-AUTH-09 | The return page must be a page **inside this app**. Any outside address (for example `https://evil.com`) is ignored and the user lands on the dashboard.                                                                                                                                                                         | Phase 2 business requirements | approved |
| BR-AUTH-10 | A logged-in user who opens `/login` is sent to the dashboard.                                                                                                                                                                                                                                                                    | Phase 2 business requirements | approved |
| BR-AUTH-11 | If the session ends while the user is working (expired or logged out elsewhere), the next action sends them to `/login`.                                                                                                                                                                                                         | Phase 2 business requirements | approved |
| BR-AUTH-12 | The password is never shown, stored in plain text, or returned by the system.                                                                                                                                                                                                                                                    | Phase 2 business requirements | approved |
| BR-AUTH-13 | The limits in BR-AUTH-04 and BR-AUTH-05 are settings, not hard-coded, so the business can change them.                                                                                                                                                                                                                           | Phase 2 business requirements | approved |
| BR-AUTH-14 | A successful login clears the failed-attempt count for that email.                                                                                                                                                                                                                                                               | Detail design review          | approved |
| BR-AUTH-15 | The session token is never readable by page scripts and never appears in a URL or a response body.                                                                                                                                                                                                                               | Detail design review          | approved |

## Change log

| Date       | Change                                                                                           | Why                                                |
| ---------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| 2026-10-07 | First version                                                                                    | Phase 2                                            |
| 2026-10-07 | BR-AUTH-04: when the window starts and what counts as a failure. Added BR-AUTH-14 and BR-AUTH-15 | Gaps found while writing the API and detail design |
| 2026-10-08 | Added the Source column                                                                          | Traceability (ISO/IEC/IEEE 29148)                  |
| 2026-10-08 | Added the Status column                                                                          | Documentation standards (docs/STANDARDS.md)        |
