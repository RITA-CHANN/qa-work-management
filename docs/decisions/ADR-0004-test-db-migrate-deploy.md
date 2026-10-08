---
id: ADR-0004
title: Test DB is prepared with prisma migrate deploy + idempotent seed
type: decision
status: accepted
owner: Claude
reviewers: [Linh]
approved: 2026-10-07
phase: 1
updated: 2026-10-07
---

# ADR-0004 Test DB is prepared with `prisma migrate deploy` + idempotent seed

## Decision

Test DB is prepared with `prisma migrate deploy` + idempotent seed.

## Why

Non-destructive and fast; a per-test data reset strategy is designed in Phase 3 when real data exists.

## History

Was decision P1-4 in the Phase 1 decisions log of `ARCHITECTURE.md`.
