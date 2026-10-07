# QA Work Management

An AI-assisted QA platform (requirements → test design → execution → bugs → regression → automation)
that is also a realistic environment for learning Playwright.

> Status: **Phase 1 (repository setup)**. The app is a skeleton: a working shell, API health check,
> database, and Playwright setup. Features arrive phase by phase. See [docs/phases](docs/phases).

## Tech stack

| Layer    | Tools                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Web      | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, TanStack Query |
| API      | Node.js 22, Express 5, TypeScript, Zod, pino                                         |
| Database | PostgreSQL 16 (Docker), Prisma 7                                                     |
| Testing  | Playwright (E2E + API), Vitest (unit), ESLint with `eslint-plugin-playwright`        |

## Prerequisites (on your Mac)

- **Node.js 22.12+**: `node -v` should print `v22.x` or newer. With nvm: `nvm install && nvm use` (reads `.nvmrc`).
- **Docker Desktop** running: `docker info` should not error.
- **Git**.
- Recommended: VS Code with the **Playwright Test for VS Code** extension.

## First-time setup

```bash
git clone https://github.com/RITA-CHANN/qa-work-management.git
cd qa-work-management
cp .env.example .env            # adjust ports here if something is already using them
npm install                     # also generates the Prisma client
npm run db:up                   # starts Postgres in Docker (creates qawm_dev and qawm_test)
npm run db:migrate              # applies migrations to qawm_dev
npm run db:seed                 # adds seed users
npx playwright install chromium # downloads the browser Playwright drives
```

## Daily commands

| Command              | What it does                                                       |
| -------------------- | ------------------------------------------------------------------ |
| `npm run dev`        | Starts API (http://localhost:3000) and web (http://localhost:5173) |
| `npm run e2e`        | Runs all Playwright tests on their own ports and database          |
| `npm run e2e:ui`     | Playwright UI mode: watch, time-travel, pick locators              |
| `npm run e2e:report` | Opens the last HTML report (with traces)                           |
| `npm test`           | Unit tests (Vitest)                                                |
| `npm run typecheck`  | TypeScript checks for every package                                |
| `npm run lint`       | ESLint (including Playwright best-practice rules)                  |
| `npm run format`     | Prettier                                                           |
| `npm run db:studio`  | Prisma Studio: browse the dev database                             |
| `npm run db:reset`   | Drops and recreates the **dev** database, then seeds it            |

Open http://localhost:5173. The header shows **API: Online** when the API and database are reachable.

## Repository layout

```
apps/api        Express API + Prisma schema, migrations, seed
apps/web        React SPA
packages/shared Types and Zod schemas used by web, API and tests
e2e             Playwright tests (you write these!)
docs            Architecture, database, API, testing, Playwright and AI docs; phase plans
```

## Documentation

- [docs/README.md](docs/README.md): **start here**, map of all docs and how IDs work
- [requirements/](docs/requirements/README.md): business requirements per feature (user stories, rules, acceptance criteria)
- [design/](docs/README.md#design): screens, user flows (basic design) and detail design
- [traceability.md](docs/traceability.md): requirement → screen → API → design → tests
- [decisions/](docs/decisions/README.md): architecture decisions (ADR)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): how the system fits together
- [database/](docs/database/README.md): tables, relationships, migrations; one file per table
- [api/](docs/api/README.md): API reference, one file per endpoint
- [TESTING.md](docs/TESTING.md): test strategy and how to run tests
- [PLAYWRIGHT.md](docs/PLAYWRIGHT.md): learning path and **current exercise**
- [AI.md](docs/AI.md): AI architecture (built from Phase 8)

## Troubleshooting

| Symptom                                                        | Fix                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Invalid environment configuration: DATABASE_URL: is required` | You have no `.env`. Run `cp .env.example .env`.                                                                                |
| Header shows **API: Offline**                                  | Is Docker running? `docker compose ps` should show `qawm-postgres` as healthy.                                                 |
| `Port 5173 is in use` / `EADDRINUSE`                           | Change `WEB_PORT` / `API_PORT` / `POSTGRES_PORT` in `.env`.                                                                    |
| `database "qawm_test" does not exist`                          | The volume was created before the init script existed: `docker compose down -v && npm run db:up`, then migrate and seed again. |
| Playwright: `Executable doesn't exist`                         | Run `npx playwright install chromium`.                                                                                         |
