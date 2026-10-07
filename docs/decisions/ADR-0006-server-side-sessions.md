---
id: ADR-0006
title: Server-side sessions with a hashed token in an HttpOnly cookie
type: decision
status: proposed
phase: 2
updated: 2026-10-07
---

# ADR-0006 Server-side sessions with a hashed token in an HttpOnly cookie

## Context

Phase 2 needs login. Phase 0 (D4) chose cookie sessions over tokens in JavaScript. We still had to pick where
sessions live and what is stored.

## Decision

Sessions are rows in Postgres (`sessions`). The browser holds a random token in the `qawm_sid` cookie
(`HttpOnly`, `SameSite=Lax`); the table stores only the token's SHA-256 hash. Details: DD-AUTH-01, DD-AUTH-02.

## Why

- Logout really ends the session: the row is deleted (BR-AUTH-06). A JWT would stay valid until it expires.
- JavaScript can't read the token, so a script injection can't steal it (BR-AUTH-15).
- A database leak gives hashes, not working tokens.
- The cookie is exactly what Playwright's `storageState` saves, which is the Phase 2 lesson.
- Not picked: JWT in `localStorage` (readable by scripts, no real logout); `express-session` with a store (more
  moving parts than our 3 small functions).

## Consequences

- One database read per protected request. Fine at this size; a cache can come later.
- The login rate limiter is in memory (DD-AUTH-01), so it resets when the API restarts and doesn't work across
  several API servers. Acceptable for one server.
