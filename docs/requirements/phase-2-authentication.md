# Phase 2 Business Requirements: Authentication

Status: **Draft, waiting for your review** · 2026-10-07
Technical plan: [phase-2-plan.md](../phases/phase-2-plan.md) (how we build it). This file says **what the business needs** and how we know it works. Test cases trace back to the IDs below (US, BR, AC).

## 1. Goal

Only known team members can use QA Work Management. Every later feature (projects, bugs, activity log, permissions) needs to know **who** is acting, so this phase gives the system an identity for every request.

## 2. Actors

| Actor | Description                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| Guest | Someone who is not logged in. Can only see the login page.                                                                     |
| User  | A team member with an account (global role `USER`).                                                                            |
| Admin | A team member with global role `ADMIN`. In this phase an admin has the same screens as a user; admin-only features come later. |

Accounts are created by the seed data only. There is no sign-up in this phase.

## 3. User stories

| ID    | Story                                                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-01 | As a **user**, I want to log in with my email and password, so that I can use the app.                                                                                  |
| US-02 | As a **user**, I want to stay logged in when I reload or come back later, so that I don't have to log in every time.                                                    |
| US-03 | As a **user**, I want to log out, so that nobody else can use my session on this computer.                                                                              |
| US-04 | As a **guest**, when I open a page of the app, I want to be sent to the login page and then back to that page after logging in, so that I don't lose where I was going. |
| US-05 | As a **user**, I want to see my name in the header, so that I know which account I am using.                                                                            |
| US-06 | As the **business owner**, I want repeated wrong logins to be blocked for a while, so that nobody can guess passwords.                                                  |

## 4. Business rules

| ID    | Rule                                                                                                                                                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Only seeded accounts can log in. Email is the login name and is **case-insensitive** (`Admin@Example.com` = `admin@example.com`). Leading and trailing spaces are ignored.                                                                           |
| BR-02 | Both email and password are required. The email must look like an email address.                                                                                                                                                                     |
| BR-03 | A wrong password and an unknown email show the **same** message: "Invalid email or password". The app never says which part was wrong.                                                                                                               |
| BR-04 | After **5 failed logins** for the same email within **15 minutes**, further attempts for that email are blocked until the 15-minute window passes, even with the correct password. The user sees: "Too many login attempts. Please try again later." |
| BR-05 | A login session lasts **7 days**. After that the user must log in again.                                                                                                                                                                             |
| BR-06 | Logging out ends the session **on the server**. The old session cannot be reused, even if someone copied the cookie.                                                                                                                                 |
| BR-07 | Logging out in one browser does not log the user out of other browsers or devices.                                                                                                                                                                   |
| BR-08 | Every page except `/login` requires a logged-in user. A guest who opens one is sent to `/login`, and after logging in returns to the page they asked for.                                                                                            |
| BR-09 | The return page must be a page **inside this app**. Any outside address (for example `https://evil.com`) is ignored and the user lands on the dashboard.                                                                                             |
| BR-10 | A logged-in user who opens `/login` is sent to the dashboard.                                                                                                                                                                                        |
| BR-11 | If the session ends while the user is working (expired or logged out elsewhere), the next action sends them to `/login`.                                                                                                                             |
| BR-12 | The password is never shown, stored in plain text, or returned by the system.                                                                                                                                                                        |
| BR-13 | The limits in BR-04 and BR-05 are settings, not hard-coded, so the business can change them.                                                                                                                                                         |

## 5. Acceptance criteria

Format: **Given** (starting state) / **When** (action) / **Then** (expected result).

### Login (US-01)

| ID    | Given                    | When                                                            | Then                                                                |
| ----- | ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| AC-01 | I am a guest on `/login` | I enter a valid email and the right password and click "Log in" | I land on the dashboard and see my name in the header               |
| AC-02 | I am on `/login`         | I enter a valid email and a **wrong** password                  | I stay on `/login` and see "Invalid email or password"              |
| AC-03 | I am on `/login`         | I enter an email that has **no account**                        | I see exactly the same message as AC-02 (BR-03)                     |
| AC-04 | I am on `/login`         | I submit with email and/or password **empty**                   | I see a message under each empty field and no login request is sent |
| AC-05 | I am on `/login`         | I enter `abc` as the email                                      | I see "Enter a valid email address"                                 |
| AC-06 | I am on `/login`         | I enter my email in **upper case** with the right password      | I am logged in (BR-01)                                              |
| AC-07 | I have filled the form   | I press **Enter** in the password field                         | The form submits, same as clicking "Log in"                         |
| AC-08 | I clicked "Log in"       | The request is still sending                                    | The button is disabled, so I can't submit twice                     |
| AC-09 | I am on `/login`         | I type a password                                               | The characters are hidden                                           |

### Rate limit (US-06)

| ID    | Given                                                     | When                                               | Then                                                                            |
| ----- | --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| AC-10 | I have failed 4 times for an email in the last 15 minutes | I fail a **5th** time                              | I see "Invalid email or password" (not blocked yet)                             |
| AC-11 | I have failed 5 times for an email in the last 15 minutes | I try a **6th** time, even with the right password | I see "Too many login attempts. Please try again later." and I am not logged in |
| AC-12 | Email A is blocked                                        | I log in with email B and its right password       | I am logged in (the block is per email)                                         |
| AC-13 | Email A was blocked                                       | 15 minutes have passed                             | I can log in with email A again                                                 |

### Staying logged in (US-02)

| ID    | Given                           | When                                                          | Then                  |
| ----- | ------------------------------- | ------------------------------------------------------------- | --------------------- |
| AC-14 | I am logged in                  | I reload the page                                             | I am still logged in  |
| AC-15 | I am logged in                  | I close the tab and open the app again in the same browser    | I am still logged in  |
| AC-16 | I am logged in in one browser   | I open the app in a **different** browser (or private window) | I am a guest there    |
| AC-17 | My session is older than 7 days | I open any page                                               | I am sent to `/login` |

### Logout (US-03)

| ID    | Given                                                          | When                                | Then                                                    |
| ----- | -------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| AC-18 | I am logged in                                                 | I click "Log out"                   | I land on `/login`                                      |
| AC-19 | I just logged out                                              | I press the browser **Back** button | I do not see the previous page's data; I am on `/login` |
| AC-20 | I logged out, but someone kept a copy of my old session cookie | They use it                         | They are treated as a guest (BR-06)                     |
| AC-21 | I am logged in in browser 1 and browser 2                      | I log out in browser 1              | Browser 2 is still logged in (BR-07)                    |

### Protected pages and redirect (US-04)

| ID    | Given                                            | When                                                 | Then                                                                |
| ----- | ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------- |
| AC-22 | I am a guest                                     | I open `/projects`                                   | I am sent to `/login`, and after logging in I land on `/projects`   |
| AC-23 | I am a guest                                     | I open `/`                                           | I am sent to `/login`, and after logging in I land on the dashboard |
| AC-24 | I am a guest                                     | I open `/login?returnTo=https://evil.com` and log in | I land on the dashboard, not on the outside site (BR-09)            |
| AC-25 | I am logged in                                   | I open `/login`                                      | I am sent to the dashboard (BR-10)                                  |
| AC-26 | I am logged in and my session ends on the server | I do any action that loads data                      | I am sent to `/login` (BR-11)                                       |

### Header (US-05)

| ID    | Given                    | When                             | Then                                          |
| ----- | ------------------------ | -------------------------------- | --------------------------------------------- |
| AC-27 | I am logged in           | I look at the header on any page | I see my name and a "Log out" button          |
| AC-28 | I am a guest on `/login` | I look at the page               | There is no user name and no "Log out" button |

## 6. Messages

| Where                   | Message                                          |
| ----------------------- | ------------------------------------------------ |
| Wrong email or password | Invalid email or password                        |
| Blocked by rate limit   | Too many login attempts. Please try again later. |
| Email empty             | Email is required                                |
| Email invalid           | Enter a valid email address                      |
| Password empty          | Password is required                             |

Server messages are announced to screen readers (`role="alert"`). Every field has a visible label.

## 7. Out of scope (later phases)

- Sign-up, forgot password, change password.
- Admin screen to create, disable or delete users.
- "Remember me" option (every session lasts 7 days).
- Logging out of all devices.
- Project roles (OWNER, QA_LEAD, …): Phase 3, when projects exist.
- Two-factor login, social login (Google, GitHub).

## 8. Test data

All seed users share the password `Password123!` (dev and test only). The seed user list and emails are in `apps/api/prisma/seed/` and the README.

## 9. Open questions for you

| ID   | Question                                                                                  | Default if you don't answer                        |
| ---- | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Q-01 | Should the login page show how many attempts are left before the block?                   | No. It would help an attacker and it's not common. |
| Q-02 | After the block, should the user see when they can try again ("try again in 12 minutes")? | No, a generic message only.                        |
