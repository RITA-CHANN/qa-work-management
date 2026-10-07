# Playwright Learning Path

How we work: **Explain → small task → you try → review → feedback → improve.**
Claude explains concepts and reviews your code; you write the tests. Ask for a hint any time. Hints come in levels,
so ask for "hint 1" first.

Roadmap: [phases/phase-0-architecture.md §13](phases/phase-0-architecture.md#13-playwright-lab-roadmap).

| Phase        | Concepts                                                                                                         | Status      |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| 1 Setup      | test structure, `baseURL`, `getByRole`, `toHaveTitle`, `toHaveURL`, `request` fixture, HTML report, Trace Viewer | **current** |
| 2 Auth       | `getByLabel`, form errors, `storageState`, setup projects, API login                                             | next        |
| 3 Projects   | tables, `filter({ hasText })`, API CRUD tests                                                                    |             |
| 4 Test cases | Page Object Model, data builders, URL state                                                                      |             |

---

## Phase 1 exercise: your first tests

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
