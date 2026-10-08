# Testing

Strategy and rationale: [phases/phase-0-architecture.md §12](phases/phase-0-architecture.md#12-playwright-testing-strategy).

## Test layers

| Layer  | Tool                 | Location                      | Who writes it          |
| ------ | -------------------- | ----------------------------- | ---------------------- |
| Unit   | Vitest               | `apps/*/src/**/*.test.ts`     | Claude (app internals) |
| API    | Playwright `request` | `e2e/tests/api/*.api.spec.ts` | **Linh**, with review  |
| UI E2E | Playwright `page`    | `e2e/tests/ui/*.spec.ts`      | **Linh**, with review  |

## Running tests

```bash
npm test             # unit tests
npm run e2e          # all Playwright tests (starts its own API + web on ports 3100/5174 using qawm_test)
npm run e2e -- --project=api          # only API tests
npm run e2e -- --project=chromium     # only UI tests
npm run e2e -- tests/ui/navigation.spec.ts   # one file
npm run e2e:ui       # UI mode
npm run e2e:report   # open the HTML report
```

Before the first run: Docker must be running (`npm run db:up`) and browsers installed (`npx playwright install chromium`).

## How a Playwright run works

1. `webServer[0]` runs `db:test:prepare` (migrate + seed `qawm_test`), then starts the API with `NODE_ENV=test` on port 3100.
2. `webServer[1]` starts the web app on port 5174, proxying `/api` to port 3100.
3. Playwright waits until both URLs respond, then runs the tests.
4. Locally, if those servers are already running (e.g. from an earlier run in UI mode), they are reused.

## Rules for every test

1. **Isolation:** no test depends on another test's data or order. Create the data you change; read-only tests may use seed data.
2. **No hard waits:** `page.waitForTimeout` is a lint error. Use web-first assertions (`await expect(locator).toBeVisible()`).
3. **Locator priority:** `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId` (justified) → CSS → XPath.
4. **Assert behaviour users see** (text, URL, state), not implementation details (class names).
5. **Lint must pass:** `npm run lint` includes `eslint-plugin-playwright`.
6. **Trace to a requirement:** tag each test with the acceptance criteria it checks, for example
   `test('wrong password shows a generic error', { tag: '@AC-AUTH-02' }, async ({ page }) => { … })`.
   Run one criterion with `npx playwright test --grep @AC-AUTH-02`. `npm run docs:check` fails on a tag that
   matches no ID, and `npm run docs:build` updates [traceability/](traceability/README.md) with your tests. Its automation gaps list,
   sorted by risk, is a good place to pick the next test to write.

## QA checklist per feature

Each phase adds a table here covering: happy path, negative, boundary, validation, permissions, error handling,
empty state, loading state, concurrency, data consistency, API failure and browser behaviour.

### Phase 2: Authentication

The full list is [requirements/auth/acceptance.md](requirements/auth/acceptance.md); coverage per criterion is in
[traceability/auth.md](traceability/auth.md).

| Dimension     | Case                                                                                                      | Criteria                                       | Automate |
| ------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| Happy path    | Log in, see your name; log out, back at `/login`                                                          | AC-AUTH-01, AC-AUTH-18                         | UI, API  |
| Negative      | Wrong password and unknown email give the same message                                                    | AC-AUTH-02, AC-AUTH-03                         | UI, API  |
| Validation    | Empty fields, invalid email; API 400 with `details`                                                       | AC-AUTH-04, AC-AUTH-05                         | UI, API  |
| Boundary      | 5th failure still 401, 6th 429                                                                            | AC-AUTH-10, AC-AUTH-11                         | API      |
| Security      | HttpOnly cookie, no token in body, old cookie dead after logout, open redirect blocked, non-JSON POST 415 | AC-AUTH-20, AC-AUTH-24, AC-AUTH-31, AC-AUTH-32 | UI, API  |
| Session       | Reload keeps you in; a new context is a guest                                                             | AC-AUTH-14, AC-AUTH-16                         | UI, API  |
| Browser       | Back after logout shows no data                                                                           | AC-AUTH-19                                     | UI       |
| Accessibility | Labels, `role="alert"`, Enter submits                                                                     | AC-AUTH-07, AC-AUTH-09                         | UI       |
| Config        | Rate limit and session length come from `.env`                                                            | AC-AUTH-30                                     | unit     |

Test data notes:

- Seed users all use `Password123!`. Rate-limit tests use `ratelimit@qawm.test` only. A block lasts 15 minutes in
  the running API, so a local re-run with a reused server needs the API restarted.
- Wrong-password tests for other cases can use a made-up email, so they never block a real user.

### Phase 1: App shell and health

| Dimension      | Case                                                                    | Manual           | Automate                                  |
| -------------- | ----------------------------------------------------------------------- | ---------------- | ----------------------------------------- |
| Happy path     | Dashboard loads with heading and title "Dashboard · QA Work Management" | ✓                | ✓ UI                                      |
| Happy path     | Sidebar navigates to Projects; URL is `/projects`; link marked current  | ✓                | ✓ UI                                      |
| Empty state    | Projects page shows "No projects yet"                                   | ✓                | ✓ UI                                      |
| Negative       | Unknown URL shows "Page not found" with a way back                      | ✓                | ✓ UI                                      |
| Happy path     | `GET /api/health` → 200, body matches schema                            |                  | ✓ API                                     |
| Negative       | Unknown API route → 404 JSON with `NOT_FOUND` and `requestId`           |                  | ✓ API                                     |
| Validation     | Invalid JSON body → 400 `VALIDATION_ERROR`                              |                  | ✓ API                                     |
| Error handling | API down → header shows "API: Offline"                                  | ✓ (stop the API) | ✓ UI with `page.route` (Phase 7 exercise) |
| Browser        | Back/forward between Dashboard and Projects keeps the correct heading   | ✓                | ✓ UI                                      |
| Accessibility  | Keyboard: Tab first shows "Skip to main content"                        | ✓                | later                                     |
| Config         | API refuses to start without `DATABASE_URL`                             | ✓                | unit (done)                               |
