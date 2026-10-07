# Architecture

Full proposal and rationale: [phases/phase-0-architecture.md](phases/phase-0-architecture.md).
This file describes **what exists now** and is updated every phase.

## System overview

```
Browser ──► Vite dev server (web, :5173) ──/api proxy──► Express API (:3000) ──► PostgreSQL (Docker, :5432)
```

- **Same origin.** The browser only talks to the web server; Vite forwards `/api/*` to Express.
  Session cookies (Phase 2) therefore work without CORS.
- **Modular monolith.** One API process, organised by feature module under `apps/api/src/modules`.
- **Shared contracts.** `packages/shared` holds response types and Zod schemas used by web, API and tests.

## API request pipeline (`apps/api/src/app.ts`)

1. `requestId`: reuses a safe incoming `X-Request-Id` or creates a UUID; always echoed in the response header.
2. `pino-http`: one log line per request, tagged with the request id.
3. `express.json()`: parses JSON bodies (invalid JSON → 400 `VALIDATION_ERROR`).
4. Feature routers mounted under `/api` (currently `/api/health`).
5. `notFound`: unknown `/api/*` routes → 404 `NOT_FOUND` JSON.
6. `errorHandler`: the **only** place errors become responses. `AppError` subclasses keep their status/code;
   anything else becomes a generic 500 and is logged with its stack.

Express 5 forwards errors thrown in `async` handlers to the error handler automatically.

## Configuration

- One `.env` at the repo root (template: `.env.example`), loaded by `apps/api/src/config/load-env.ts`
  and by Vite (`apps/web/vite.config.ts`). Shell variables override it.
- `apps/api/src/config/env.ts` validates config with Zod at startup; invalid config stops the API
  with a readable list of problems.
- `NODE_ENV=test` switches the API and Prisma to `DATABASE_URL_TEST`.

## Web app (`apps/web/src`)

| Folder               | Purpose                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| `app/`               | Router                                                                            |
| `components/layout/` | App shell: skip link, header, `<nav aria-label="Main">`, `<main>`                 |
| `components/ui/`     | shadcn/ui primitives (add more with `npx shadcn@latest add <name>` in `apps/web`) |
| `components/`        | Shared composites (`PageHeader`, `EmptyState`)                                    |
| `features/<name>/`   | Feature code: data hooks + components (e.g. `features/health`)                    |
| `pages/`             | Route pages                                                                       |
| `lib/`               | `apiClient` (single fetch wrapper), `utils`                                       |

### Accessibility and testability rules

1. Every page renders exactly one `<h1>` via `PageHeader`, which also sets the document title
   (`"<Page> · QA Work Management"`).
2. Landmarks: `header`, `nav` (named "Main"), `main`.
3. Navigation uses `NavLink`, so the active link has `aria-current="page"`.
4. Async status uses `role="status"` with an accessible name (see `ApiStatus`).
5. Empty states are sections with a heading.
6. `data-testid` only where no semantic handle exists, with a comment explaining why.

## Decisions log

Phase 0 decisions D1–D13 are in the [Phase 0 architecture](phases/phase-0-architecture.md). Every decision since then is
one ADR file in [decisions/](decisions/README.md) (`ADR-NNNN`).

## Known issues

- `npm audit` reports advisories in Prisma CLI dependencies (`deepmerge-ts`, `mysql2`). They are
  dev-only tooling, the only "fix" is downgrading Prisma, and we don't use MySQL. We'll re-check on each Prisma update.
- The production web bundle is about 600 kB minified, almost all framework code (React DOM, React Router); route-level code
  splitting will be added once there are real feature pages.
