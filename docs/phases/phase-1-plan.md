# Phase 1 Plan: Repository Setup

Status: **Waiting for go-ahead and GitHub access** · 2026-10-07

## 1. Current codebase

Nothing exists yet. The repo `qa-work-management` will be created empty on GitHub by you (see "What I need from you").

## 2. What we are building

A running skeleton, with no business features:

- A monorepo you can clone and start with three commands.
- **Web**: React + Vite + TypeScript + Tailwind + shadcn/ui. An app shell (sidebar, header, `<main>`), React Router with placeholder pages for Dashboard, Projects, and a 404 page. Every page has an `<h1>` and named landmarks.
- **API**: Express + TypeScript, with `GET /api/health`. It also includes the shared middleware: request id, logging, JSON error format, a 404 handler for unknown routes, and config checked at startup.
- **Database**: Postgres in Docker, a Prisma schema with just `User` (a placeholder for Phase 2), the first migration, and a seed script.
- **Shared package**: Zod, plus the shared API response and error types.
- **Quality tools**: TypeScript strict mode, ESLint (including `eslint-plugin-playwright`), Prettier, and Vitest with one unit test.
- **Playwright**: installed and configured. `webServer` starts the API and web app against the test database. I add nothing beyond the config: **your first tests are the Phase 1 exercise.**
- **Docs**: README (setup), and ARCHITECTURE, DATABASE, API, TESTING, PLAYWRIGHT and AI.md seeded from Phase 0.

## 3. Why

Every later phase depends on this foundation: shared validation, a consistent error format, a test database, and a working Playwright setup. Getting the error format and test database right now means every later test can be isolated and predictable.

## 4. Architecture decisions for this phase

| Decision                                                                   | Reason                                                    |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| npm workspaces (`apps/web`, `apps/api`, `packages/shared`, `e2e`)          | One install, shared types, no extra build tools           |
| Node 22 LTS (22.12+), pinned in `.nvmrc` and `engines`                     | Same runtime on your Mac and in CI                        |
| `app.ts` builds the Express app and `server.ts` starts it listening        | The app can be tested without opening a port              |
| Vite dev server proxies `/api` to the API                                  | Same origin, so session cookies just work in Phase 2      |
| Two databases, `qawm_dev` and `qawm_test`                                  | Tests can reset their data without touching your dev data |
| Error body `{ error: { code, message, details, requestId } }` from day one | Every API test you write can rely on it                   |

## 5. Files that will be created

```
package.json  .nvmrc  .gitignore  .env.example  tsconfig.base.json
eslint.config.js  .prettierrc  docker-compose.yml  README.md
docs/{ARCHITECTURE,DATABASE,API,TESTING,PLAYWRIGHT,AI}.md
packages/shared/  src/{index.ts, api.ts (response/error types)}
apps/api/  src/{app.ts, server.ts, config/env.ts, lib/{logger,errors,prisma}.ts,
            middleware/{requestId,errorHandler,notFound}.ts, modules/health/health.routes.ts}
            prisma/{schema.prisma, migrations/, seed/seed.ts}
            src/lib/errors.test.ts (Vitest)
apps/web/  index.html, vite.config.ts, src/{main.tsx, app/{router,layout}.tsx,
            pages/{DashboardPage,ProjectsPage,NotFoundPage}.tsx, lib/apiClient.ts,
            components/ui/* (shadcn)}
e2e/       playwright.config.ts, tests/ (empty, for you), tsconfig.json
```

## 6. Risks

| Risk                                          | Mitigation                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Version mismatches on your Mac (Node, Docker) | `.nvmrc`, `engines` check, and a README setup checklist with expected command outputs |
| Port conflicts (5432, 5173, 3000)             | Ports set in `.env`; the README explains how to change them                           |
| Tailwind v4 + shadcn setup drift              | Follow the current shadcn Vite guide exactly; check that the build works              |
| Over-building the skeleton                    | No auth and no features. Anything not listed above waits                              |

## 7. How I'll verify before handing over

`npm install` → `docker compose up -d` → `npm run db:migrate && npm run db:seed` → `npm run dev` (open the app, call `/api/health`) → `npm run typecheck` → `npm run lint` → `npm test` → `npx playwright test --list` (config loads). I'll paste the results.

## 8. QA view of this phase

- **Manual QA:** the app loads; navigation reaches every placeholder page; an unknown URL shows the 404 page; `/api/health` returns 200; an unknown `/api/xyz` returns a 404 JSON error with a requestId; the API refuses to start with a missing `DATABASE_URL`.
- **Automate:** page titles and headings; navigation; the 404 page; the health endpoint; the error format of unknown API routes.
- **Playwright concepts you'll practice:** test structure (`test`, `expect`), `page.goto` with `baseURL`, `getByRole('heading')`, `getByRole('link')`, `toHaveTitle`, `toHaveURL`, the `request` fixture, the HTML report, and Trace Viewer.

## 9. Your Phase 1 exercise (preview)

1. **Explain step (from me):** what a Playwright test file is, what `baseURL` and `webServer` do, and why `getByRole('heading', { name: 'Dashboard' })` beats `page.locator('h1')`.
2. **Your task:** write `e2e/tests/ui/navigation.spec.ts`. Open the app, assert the Dashboard heading, click the Projects link, then assert the URL and heading. Then write `e2e/tests/api/health.api.spec.ts`. Call `/api/health`, assert status 200 and the body shape. Assert that `/api/does-not-exist` returns 404 with `error.code === "NOT_FOUND"`.
3. Push your branch or paste the code here; I'll review it.
