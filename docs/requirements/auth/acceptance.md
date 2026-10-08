---
title: Authentication acceptance criteria
type: acceptance
feature: auth
status: review
owner: Claude
reviewers: [Linh]
phase: 2
updated: 2026-10-08
---

# Authentication acceptance criteria

Format: **Given** (starting state) / **When** (action) / **Then** (expected result). **Covers** lists the
stories and rules each criterion proves. **Priority**, **Risk** and **Verify** are explained in
[docs/README.md](../../README.md#requirement-attributes). Tag the Playwright test that checks a criterion with its ID,
for example `{ tag: '@AC-AUTH-02' }`.

## Login (US-AUTH-01)

| ID         | Given                    | When                                                            | Then                                                                | Covers                 | Priority | Risk   | Verify            |
| ---------- | ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- | -------- | ------ | ----------------- |
| AC-AUTH-01 | I am a guest on `/login` | I enter a valid email and the right password and click "Log in" | I land on the dashboard and see my name in the header               | US-AUTH-01             | Must     | High   | Auto-UI, Auto-API |
| AC-AUTH-02 | I am on `/login`         | I enter a valid email and a **wrong** password                  | I stay on `/login` and see MSG-AUTH-01                              | US-AUTH-01, BR-AUTH-03 | Must     | High   | Auto-UI, Auto-API |
| AC-AUTH-03 | I am on `/login`         | I enter an email that has **no account**                        | I see exactly the same message as AC-AUTH-02                        | BR-AUTH-03             | Must     | High   | Auto-UI, Auto-API |
| AC-AUTH-04 | I am on `/login`         | I submit with email and/or password **empty**                   | I see a message under each empty field and no login request is sent | BR-AUTH-02             | Must     | Medium | Auto-UI, Auto-API |
| AC-AUTH-05 | I am on `/login`         | I enter `abc` as the email                                      | I see MSG-AUTH-04                                                   | BR-AUTH-02             | Should   | Low    | Auto-UI, Auto-API |
| AC-AUTH-06 | I am on `/login`         | I enter my email in **upper case** with the right password      | I am logged in                                                      | BR-AUTH-01             | Should   | Medium | Auto-API          |
| AC-AUTH-07 | I have filled the form   | I press **Enter** in the password field                         | The form submits, same as clicking "Log in"                         | US-AUTH-01             | Should   | Low    | Auto-UI           |
| AC-AUTH-08 | I clicked "Log in"       | The request is still sending                                    | The button is disabled, so I can't submit twice                     | US-AUTH-01             | Should   | Medium | Manual            |
| AC-AUTH-09 | I am on `/login`         | I type a password                                               | The characters are hidden                                           | BR-AUTH-12             | Must     | Medium | Auto-UI           |

## Rate limit (US-AUTH-06)

| ID         | Given                                                     | When                                                    | Then                                                         | Covers                 | Priority | Risk   | Verify   |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ | ---------------------- | -------- | ------ | -------- |
| AC-AUTH-10 | I have failed 4 times for an email in the last 15 minutes | I fail a **5th** time                                   | I see MSG-AUTH-01 (not blocked yet)                          | US-AUTH-06, BR-AUTH-04 | Must     | High   | Auto-API |
| AC-AUTH-11 | I have failed 5 times for an email in the last 15 minutes | I try a **6th** time, even with the right password      | I see MSG-AUTH-02 and I am not logged in                     | US-AUTH-06, BR-AUTH-04 | Must     | High   | Auto-API |
| AC-AUTH-12 | Email A is blocked                                        | I log in with email B and its right password            | I am logged in (the block is per email)                      | BR-AUTH-04             | Must     | Medium | Auto-API |
| AC-AUTH-13 | Email A was blocked                                       | 15 minutes have passed since its first failed attempt   | I can log in with email A again                              | BR-AUTH-04             | Must     | Medium | Manual   |
| AC-AUTH-29 | I have failed 4 times for an email                        | I log in with the right password, then fail 1 more time | I see MSG-AUTH-01, not MSG-AUTH-02 (the count started again) | BR-AUTH-14             | Should   | Medium | Auto-API |
| AC-AUTH-30 | The limit setting is changed to 3 failures                | I fail 3 times, then try a 4th time                     | I see MSG-AUTH-02                                            | BR-AUTH-13             | Could    | Low    | Unit     |

## Staying logged in (US-AUTH-02)

| ID         | Given                           | When                                                          | Then                  | Covers     | Priority | Risk   | Verify            |
| ---------- | ------------------------------- | ------------------------------------------------------------- | --------------------- | ---------- | -------- | ------ | ----------------- |
| AC-AUTH-14 | I am logged in                  | I reload the page                                             | I am still logged in  | US-AUTH-02 | Must     | High   | Auto-UI           |
| AC-AUTH-15 | I am logged in                  | I close the tab and open the app again in the same browser    | I am still logged in  | US-AUTH-02 | Must     | Medium | Auto-UI           |
| AC-AUTH-16 | I am logged in in one browser   | I open the app in a **different** browser (or private window) | I am a guest there    | US-AUTH-02 | Must     | Medium | Auto-UI, Auto-API |
| AC-AUTH-17 | My session is older than 7 days | I open any page                                               | I am sent to `/login` | BR-AUTH-05 | Must     | Medium | Unit              |

## Logout (US-AUTH-03)

| ID         | Given                                                          | When                                | Then                                                    | Covers                 | Priority | Risk   | Verify   |
| ---------- | -------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------- | ---------------------- | -------- | ------ | -------- |
| AC-AUTH-18 | I am logged in                                                 | I click "Log out"                   | I land on `/login`                                      | US-AUTH-03             | Must     | High   | Auto-UI  |
| AC-AUTH-19 | I just logged out                                              | I press the browser **Back** button | I do not see the previous page's data; I am on `/login` | US-AUTH-03, BR-AUTH-06 | Must     | High   | Auto-UI  |
| AC-AUTH-20 | I logged out, but someone kept a copy of my old session cookie | They use it                         | They are treated as a guest                             | BR-AUTH-06             | Must     | High   | Auto-API |
| AC-AUTH-21 | I am logged in in browser 1 and browser 2                      | I log out in browser 1              | Browser 2 is still logged in                            | BR-AUTH-07             | Should   | Medium | Auto-UI  |

## Protected pages and redirect (US-AUTH-04)

| ID         | Given                                            | When                                                 | Then                                                                | Covers                 | Priority | Risk   | Verify  |
| ---------- | ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- | -------- | ------ | ------- |
| AC-AUTH-22 | I am a guest                                     | I open `/projects`                                   | I am sent to `/login`, and after logging in I land on `/projects`   | US-AUTH-04, BR-AUTH-08 | Must     | Medium | Auto-UI |
| AC-AUTH-23 | I am a guest                                     | I open `/`                                           | I am sent to `/login`, and after logging in I land on the dashboard | BR-AUTH-08             | Must     | Medium | Auto-UI |
| AC-AUTH-24 | I am a guest                                     | I open `/login?returnTo=https://evil.com` and log in | I land on the dashboard, not on the outside site                    | BR-AUTH-09             | Must     | High   | Auto-UI |
| AC-AUTH-25 | I am logged in                                   | I open `/login`                                      | I am sent to the dashboard                                          | BR-AUTH-10             | Should   | Low    | Auto-UI |
| AC-AUTH-26 | I am logged in and my session ends on the server | I do any action that loads data                      | I am sent to `/login`                                               | BR-AUTH-11             | Must     | Medium | Auto-UI |

## Session security

| ID         | Given          | When                                               | Then                                              | Covers                 | Priority | Risk | Verify   |
| ---------- | -------------- | -------------------------------------------------- | ------------------------------------------------- | ---------------------- | -------- | ---- | -------- |
| AC-AUTH-31 | I am logged in | A script on the page reads `document.cookie`       | The session cookie is not in the result           | BR-AUTH-15             | Must     | High | Auto-API |
| AC-AUTH-32 | I log in       | I look at the login response body and the page URL | Neither contains the session token or my password | BR-AUTH-12, BR-AUTH-15 | Must     | High | Auto-API |

## Header (US-AUTH-05)

| ID         | Given                    | When                             | Then                                          | Covers     | Priority | Risk   | Verify  |
| ---------- | ------------------------ | -------------------------------- | --------------------------------------------- | ---------- | -------- | ------ | ------- |
| AC-AUTH-27 | I am logged in           | I look at the header on any page | I see my name and a "Log out" button          | US-AUTH-05 | Must     | Medium | Auto-UI |
| AC-AUTH-28 | I am a guest on `/login` | I look at the page               | There is no user name and no "Log out" button | US-AUTH-05 | Should   | Low    | Auto-UI |

## Change log

| Date       | Change                                                                    | Why                                                          |
| ---------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 2026-10-07 | First version                                                             | Phase 2                                                      |
| 2026-10-07 | AC-AUTH-13 says when the 15 minutes start. Added AC-AUTH-29 to AC-AUTH-32 | Cover BR-AUTH-13, BR-AUTH-14, BR-AUTH-15                     |
| 2026-10-08 | Added Priority, Risk and Verify columns                                   | Traceability: risk-based testing (ISO/IEC/IEEE 29119, 29148) |
