# Phase 2 Plan: Authentication

Status: **Waiting for your go-ahead** · 2026-10-07

## 1. Current codebase

- `main` is at the merge of PR #3 (your first Playwright tests). Lint, typecheck and all 6 tests are green.
- The `User` table exists (`email`, `name`, `globalRole`) with 5 seed users, but it has **no password and no sessions**. Phase 1 left those for this phase.
- Every page and API route is public. There is no login page, no header user menu and no cookie handling.

## 2. What we are building

**API**

- `POST /api/auth/login` takes `{ email, password }`. It returns 200 with the user and sets a session cookie. Wrong email or password returns 401.
- `POST /api/auth/logout` deletes the session (real logout) and clears the cookie. It returns 204.
- `GET /api/auth/me` returns the logged-in user, or 401.
- A `requireAuth` middleware returns 401 `UNAUTHENTICATED` on protected routes. `/api/health` stays public.
- **Login rate limit:** after 5 failed attempts for the same email in 15 minutes, login returns 429 `RATE_LIMITED`. Both limits are configurable in `.env`.
- **CSRF guard:** POST, PUT, PATCH and DELETE requests must send `Content-Type: application/json`, otherwise the API returns 415.

**Database**

- `users.password_hash` column.
- New `sessions` table: `id_hash` (primary key), `user_id`, `expires_at`, `created_at`. Rows are deleted when their user is deleted.
- Seed: every seed user gets the password `Password123!`. This is for dev and test only, and is documented in the README.

**Web**

- `/login` page:
  - Email and password fields with real `<label>`s.
  - A "Log in" button that is disabled while the request is sending.
  - A server error shown as `role="alert"` reading "Invalid email or password".
  - Field validation messages.
- **Protected routes:** opening any page while logged out sends you to `/login?returnTo=/projects`. After logging in you land back on `/projects`. `returnTo` only accepts paths inside the app, so it can't be abused as an open redirect.
- **Header:** shows the user's name and a "Log out" button.
- Logging out, or any API call that returns 401, sends you to `/login`.

**Not in this phase:** sign-up, password reset and changing passwords. Users are created by the seed for now; an admin screen comes later. **Project roles** (OWNER, QA_LEAD, …) need projects to exist, so they arrive in Phase 3. This phase stores the global role (`ADMIN`/`USER`) and returns it from `/me`.

## 3. Why

Every later feature needs to know who is acting: projects, bugs, the activity log and permissions. For you this is the richest testing phase so far:

- Forms and negative cases.
- Redirect behaviour.
- Cookies and `storageState`.
- API tests that keep a login across requests.
- 401 vs 403 vs 429.

## 4. Architecture decisions for this phase

| Decision                                                                                                   | Reason                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Server-side sessions in Postgres and an `httpOnly` cookie `qawm_sid`, as decided in Phase 0 (D4)           | Logout is real (the row is deleted), JavaScript can't read the token, and the cookie is exactly what `storageState` saves |
| Store only a SHA-256 **hash** of the session id                                                            | A database leak doesn't hand out live sessions                                                                            |
| Cookie: `HttpOnly; SameSite=Lax; Path=/`, plus `Secure` in production; expires after 7 days (configurable) | Standard, safe defaults. The Vite proxy keeps web and API on one origin, so no CORS setup is needed                       |
| Passwords hashed with **`@node-rs/argon2`**                                                                | Same argon2 as Phase 0, but with prebuilt binaries for Mac M1/M2/Intel and no node-gyp. This reduces risk R9              |
| One generic error for a wrong email _or_ a wrong password                                                  | Doesn't reveal which emails exist (user enumeration). This is a security case you'll test                                 |
| In-memory login rate limiter keyed by email                                                                | Simple and enough for one server. Limits come from `.env` so tests can lower or raise them                                |
| Login request/response schemas in `packages/shared` (`loginRequestSchema`, `meResponseSchema`)             | The web form, the API and your tests validate against the same schema                                                     |
| `cookie-parser` for reading cookies                                                                        | Express 5 doesn't parse cookies itself. Small and well known                                                              |

## 5. Files that change

```
apps/api/prisma/schema.prisma                     + passwordHash, Session model
apps/api/prisma/migrations/<ts>_add_auth/          new migration
apps/api/prisma/seed/                              passwords for seed users
apps/api/src/modules/auth/                         auth.routes.ts, auth.service.ts, session.ts, password.ts, rate-limit.ts
apps/api/src/middleware/                           require-auth.ts, require-json.ts
apps/api/src/config/env.ts                         SESSION_TTL_HOURS, LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW_MIN
apps/api/src/app.ts                                cookie-parser, auth routes
apps/api/src/**/*.test.ts                          unit tests: password hashing, rate limiter, returnTo sanitising
packages/shared/src/auth.ts                        Zod schemas + types
apps/web/src/features/auth/                        LoginPage, use-me, use-login, use-logout, RequireAuth, UserMenu
apps/web/src/app/router.tsx                        /login route, protected layout
apps/web/src/components/layout/AppLayout.tsx       user menu in header
docs/api/auth/{post-login,post-logout,get-me}.md   one file per endpoint (+ index rows)
docs/{ARCHITECTURE,DATABASE,TESTING,PLAYWRIGHT}.md, README.md, .env.example
```

## 6. Risks

| Risk                                                                                                                                | Mitigation                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Your Phase 1 navigation tests will go red**: `/` now redirects to `/login`                                                        | This is expected and makes a good lesson. See section 9 for how you fix it with `storageState`                      |
| Rate limiter remembers failures while a test server is reused (`reuseExistingServer`), so negative tests could lock out a seed user | The test server gets a higher limit, and each test that hits the limit uses its own email. Documented in TESTING.md |
| Tests that share one logged-in user can log each other out (logout deletes the session)                                             | Logout tests log in fresh instead of using the shared `storageState`. This is part of the exercise                  |
| argon2 install fails on your Mac                                                                                                    | `@node-rs/argon2` ships prebuilt binaries; if it still fails, fall back to `bcryptjs` (pure JS)                     |
| Changing `User` needs a migration on your dev database                                                                              | `npm run db:migrate` after pulling; the README update covers it                                                     |

## 7. How I'll verify before handing over

- Migration applies to a clean database and the seed runs twice without errors.
- Unit tests, typecheck, lint and format all pass.
- I check by hand, with curl and a browser:
  - login, me, logout, and me again returns 401;
  - wrong password;
  - the 6th failed attempt returns 429;
  - POST without JSON returns 415;
  - the redirect to `/login?returnTo=` and the return afterwards;
  - `returnTo=https://evil.com` is ignored.
- I run your existing tests and confirm the navigation tests fail **only** because of the login redirect.

## 8. QA view of this phase

| Dimension     | Cases                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Happy path    | Log in → dashboard shows your name; log out → back at `/login`                                                          |
| Negative      | Wrong password, unknown email (same message), empty fields                                                              |
| Validation    | Invalid email format, missing password; API returns 400 with `details`                                                  |
| Security      | No user enumeration; cookie is HttpOnly; logout really kills the session; open-redirect blocked; non-JSON POST rejected |
| Boundary      | 5th failed attempt still 401, 6th is 429                                                                                |
| Session       | Reload keeps you logged in; a new browser context is logged out; expired session returns 401                            |
| Browser       | Back button after logout doesn't show protected data                                                                    |
| Accessibility | Labels on inputs, error announced via `role="alert"`, Enter key submits                                                 |

## 9. Your Phase 2 exercise (preview)

**Default I've picked:** I open the Phase 2 pull request, and **you push your tests onto that same branch** before it merges. That way `main` never has red tests, and you practice working on a shared branch.

1. **Fix your navigation tests:**
   - Write an `auth.setup.ts` **setup project** that logs in once and saves `storageState`.
   - Make the `chromium` project depend on it.
   - Concepts: setup projects, `dependencies`, `storageState`.
2. **Login UI tests:**
   - Happy path, wrong password, empty fields, and the `returnTo` redirect.
   - Uses `getByLabel`, `toBeDisabled`, `role="alert"`, and a fresh context so the test starts logged out.
3. **API auth tests:**
   - Login, then `/me`; `/me` without the cookie returns 401; logout invalidates the session.
   - The rate limit returns 429 on the 6th attempt.
   - Concepts: `request` with cookies, and `request.newContext()`.

Same rules as Phase 1: I explain each concept first, you try, I review on the PR.
