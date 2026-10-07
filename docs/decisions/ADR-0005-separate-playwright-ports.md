---
id: ADR-0005
title: Playwright uses separate ports (API 3100, web 5174)
type: decision
status: accepted
phase: 1
updated: 2026-10-07
---

# ADR-0005 Playwright uses separate ports (API 3100, web 5174)

## Decision

Playwright uses separate ports (API 3100, web 5174).

## Why

Tests never reuse your dev servers or dev database.

## History

Was decision P1-5 in the Phase 1 decisions log of `ARCHITECTURE.md`.
