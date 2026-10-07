---
id: ADR-0007
title: Hash passwords with argon2id via @node-rs/argon2
type: decision
status: proposed
phase: 2
updated: 2026-10-07
---

# ADR-0007 Hash passwords with argon2id via @node-rs/argon2

## Context

Phase 0 picked argon2 for passwords. The usual `argon2` npm package compiles native code with node-gyp, which often
fails on a fresh Mac (risk R9).

## Decision

Use `@node-rs/argon2` with argon2id and its default parameters.

## Why

- Same algorithm as Phase 0, with prebuilt binaries for Mac (Intel and Apple Silicon), Linux and Windows. No
  compiler needed.
- Not picked: `argon2` (node-gyp), `bcrypt` (native too), `bcryptjs` (pure JS, slower and weaker). `bcryptjs` stays
  the fallback if `@node-rs/argon2` fails to install.

## Consequences

- Hashes look like `$argon2id$v=19$…`, so a later switch can detect the old format and rehash on login.
- Seeding 6 users takes a moment because hashing is slow on purpose.
