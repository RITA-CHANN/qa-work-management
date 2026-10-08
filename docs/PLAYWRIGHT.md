# Playwright Learning Path

How we work: **Explain → small task → you try → review → feedback → improve.**
Claude explains concepts and reviews your code; you write the tests. Ask for a hint any time. Hints come in levels,
so ask for "hint 1" first.

Roadmap: [phases/phase-0-architecture.md §13](phases/phase-0-architecture.md#13-playwright-lab-roadmap).

| Phase        | Concepts                                                                                                         | Status      |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| 1 Setup      | test structure, `baseURL`, `getByRole`, `toHaveTitle`, `toHaveURL`, `request` fixture, HTML report, Trace Viewer | done        |
| 2 Auth       | `getByLabel`, form errors, `storageState`, setup projects, API login                                             | **current** |
| 3 Projects   | tables, `filter({ hasText })`, API CRUD tests                                                                    |             |
| 4 Test cases | Page Object Model, data builders, URL state                                                                      |             |

---

## Phase 2 exercise: authentication

What to test is defined by the acceptance criteria in
[requirements/auth/acceptance.md](requirements/auth/acceptance.md). Tag every test with the criteria it checks.
All seed users have the password `Password123!`. `ratelimit@qawm.test` exists only for rate-limit tests.

### 1. Concepts (read first)

**Why your navigation tests are red now.** Every page except `/login` needs a session, so `page.goto('/')` lands
on `/login` and the sidebar is not there. That is the app working as designed (BR-AUTH-08), not a broken test.
The fix is to start those tests already logged in.

**`storageState`.** After login the browser holds the `qawm_sid` cookie. `context.storageState({ path })` saves
cookies and local storage to a JSON file; `use: { storageState: 'path' }` starts every test's context with it.
So you log in once and every test reuses that session.

**Setup projects and `dependencies`.** A project in `playwright.config.ts` can run a setup file (for example
`auth.setup.ts`, matched with `testMatch`), and another project can list it in `dependencies`, so setup always
runs first and shows up in the report like a normal test. This is the recommended way to log in once.

**Starting logged out.** Login tests need a guest. Inside a project that uses `storageState`, override it for one
file or `describe` with `test.use({ storageState: { cookies: [], origins: [] } })`.

**Tests that log out.** Logout deletes the session on the server (BR-AUTH-06). If a test logs out using the
**shared** saved session, every other test using that file is logged out too. Logout tests must log in on their own.

**API tests with cookies.** The `request` fixture keeps cookies between calls in the same test, like a browser.
`request.newContext()` (from `playwright.request`) gives you a fresh client without cookies: use it for "no session"
cases. `response.headers()['set-cookie']` lets you check the cookie attributes.

### 2. Your task

Push your work onto the Phase 2 pull request branch before it merges, so `main` never has red tests.

**A. Make the navigation tests green again**

1. Add `e2e/tests/auth.setup.ts` that logs in through the UI as a seed user and saves `storageState` to a file
   under `e2e/.auth/` (add that folder to `.gitignore`: it holds a live session).
2. Add a `setup` project and make `chromium` depend on it and use the saved state.
3. Run `navigation.spec.ts` without changing its assertions. It should pass.

**B. `e2e/tests/ui/login.spec.ts`** (start logged out)

| Test                                                     | Tag(s)                    |
| -------------------------------------------------------- | ------------------------- |
| Right email and password → dashboard, name in the header | `@AC-AUTH-01`             |
| Wrong password and unknown email show the **same** alert | `@AC-AUTH-02 @AC-AUTH-03` |
| Empty submit shows both field messages                   | `@AC-AUTH-04`             |
| `abc` as email shows the email message                   | `@AC-AUTH-05`             |
| Guest opens `/projects` → login → back on `/projects`    | `@AC-AUTH-22`             |
| `returnTo=https://evil.com` → dashboard                  | `@AC-AUTH-24`             |
| Log out → `/login`, Back does not show the page          | `@AC-AUTH-18 @AC-AUTH-19` |

Assert the exact texts from [messages.md](requirements/auth/messages.md). Use `getByLabel` and `getByRole`.

**C. `e2e/tests/api/auth.api.spec.ts`**

| Test                                                             | Tag(s)                    |
| ---------------------------------------------------------------- | ------------------------- |
| Login → 200, body matches `authUserSchema`, then `/me` → 200     | `@AC-AUTH-01`             |
| `/me` from a fresh context → 401 `UNAUTHENTICATED`               | `@AC-AUTH-16`             |
| Cookie has `HttpOnly` and `SameSite=Lax`, body has no token      | `@AC-AUTH-31 @AC-AUTH-32` |
| After logout the same cookie gets 401                            | `@AC-AUTH-20`             |
| `ratelimit@qawm.test`: 5 wrong → 401, 6th (right password) → 429 | `@AC-AUTH-10 @AC-AUTH-11` |

Also fix the open nit from Phase 1 in `health.api.spec.ts`: use `healthResponseSchema.parse(body)` instead of
checking `safeParse(...).success`, so a failure tells you which field is wrong.

### 3. Run and check

```bash
npm run e2e
npm run lint
npm run docs:build   # your tags appear in docs/traceability/
```

### 4. Submit for review

Push to the Phase 2 branch and tell me in the thread. Ask for "hint 1" whenever you're stuck.

## Phase 1 exercise: your first tests (done)

### 1. Concepts (read first)

**What is a test file?** A `*.spec.ts` file with one or more `test('name', async ({ page }) => { ... })` blocks.
`page` is a **fixture**: Playwright creates a fresh, isolated browser page for each test and closes it afterwards.
API tests ask for the `request` fixture instead, which sends HTTP requests without a browser.

**`baseURL` and `webServer`.** Look at `e2e/playwright.config.ts`. `webServer` starts the API and web app for you
(on test ports, with the test database). `baseURL` means you can write `page.goto('/projects')` instead of the full URL.
The `api` project has its own `baseURL` pointing straight at the API, so `request.get('/api/health')` works there.

**Why `getByRole`?** Users and screen readers find things by _role_ and _name_ ("the link called Projects"),
not by CSS. Compare:

```ts
page.locator('h1'); // any h1, says nothing about content
page.locator('.text-2xl.font-semibold'); // breaks when styling changes
page.getByRole('heading', { name: 'Dashboard' }); // what the user sees; survives restyling
```

`getByRole` also checks accessibility for free: if you can't find a button by role, a screen reader can't either.
Tip: in UI mode (`npm run e2e:ui`), use the **pick locator** tool to see what Playwright suggests.

**Web-first assertions.** `await expect(locator).toBeVisible()` **retries** until it passes or times out (5 s by
default). That is why you never need `waitForTimeout`: the assertion itself waits for the right state.
The same applies to `await expect(page).toHaveURL(...)` and `toHaveTitle(...)`.

**Asserting API responses.** `const response = await request.get(url)` gives you `response.status()`,
`response.headers()` and `await response.json()`. Response assertions don't retry (the response is already there),
so plain `expect(value).toBe(...)` is right here.

### 2. Your task

Create two files:

**A. `e2e/tests/ui/navigation.spec.ts`**

1. Open the home page. Assert the page title is `Dashboard · QA Work Management` and that a level-1 heading "Dashboard" is visible.
2. Click "Projects" in the **Main** navigation. Assert the URL is `/projects` and the heading changed.
3. Assert that the "Projects" link is marked as the current page (hint: look at the attributes `NavLink` adds).
4. Assert the empty state "No projects yet" is shown.
5. Visit a URL that doesn't exist and assert the "Page not found" heading. Click the link back to the dashboard and assert you're home.

**B. `e2e/tests/api/health.api.spec.ts`**

1. `GET /api/health` → status 200, `data.status` is `"ok"`, `data.database` is `"up"`.
2. Bonus: validate the whole body with `healthResponseSchema` from `@qawm/shared`.
3. `GET /api/does-not-exist` → status 404, `error.code` is `"NOT_FOUND"`, and `error.requestId` equals the `x-request-id` response header.
4. Bonus: send your own `X-Request-Id` header and assert it comes back.

### 3. Run and inspect

```bash
npm run e2e              # run everything
npm run e2e:ui           # watch mode, step through each action
npm run e2e:report       # open the report
npm run lint             # Playwright lint rules must pass
```

Then break a test on purpose (change an expected heading), run with `--trace on`, and open the trace from the report.
Find the failing step, the DOM snapshot, and the network call to `/api/health`.

### 4. Submit for review

Push a branch (`git checkout -b linh/phase-1-tests`, commit, push) or paste your code in the project thread.
The review will look at locator choice, assertion choice, readability, and whether each test checks one clear behaviour.
