---
id: ADR-0009
title: Optimistic locking with a version number
type: decision
status: proposed
phase: 3
owner: Claude
reviewers: [Linh]
deciders: [Linh, Claude]
approved:
updated: 2026-10-08
---

# ADR-0009 Optimistic locking with a version number

Format: MADR 4.0 (Markdown Architectural Decision Records), the decision-and-rationale part of an ISO/IEC/IEEE
42010 architecture description.

## Context and problem

Several people edit the same project, release or milestone. Without a check, the last save silently wins and
the earlier change is lost (the "lost update" problem). We need to detect it.

## Decision drivers

- Nobody's change is overwritten without them knowing (BR-PROJECT-07).
- No locks held while someone has a form open (people walk away from open forms).
- Simple for the web app and for API tests.
- Reusable by later editable entities (requirements, test cases, bugs).

## Considered options

1. Optimistic locking: each row has a `version`; an update must send the version it read.
2. Pessimistic locking: "editing by X" lock when a form opens.
3. Last write wins (no check).
4. Compare `updatedAt` timestamps instead of a version number.

## Decision outcome

Chosen option: "Optimistic locking with a version number", because it never blocks anyone (driver 2), needs one
extra field (driver 3), and detects every lost update (driver 1). Phase 0 proposed it as D6.

### Consequences

- Good, because the update is one SQL statement: `UPDATE … SET …, version = version + 1 WHERE id = ? AND version = ?`;
  zero rows changed means someone else saved first, and the API answers 409 `VERSION_CONFLICT` (MSG-PROJECT-07).
- Good, because two browser tabs make a realistic multi-page Playwright exercise.
- Bad, because the second person has to reload and redo their change; there is no merge.
- Bad, because every PATCH body must carry `version`, which API clients can forget (400 if missing).

### Confirmation

AC-PROJECT-21; unit test on the update helper; [DD-PROJECT-03](../design/detail/logic/DD-PROJECT-03-optimistic-locking.md).

## Pros and cons of the options

### Optimistic locking (version number)

- Good, because no blocking, exact detection, cheap.
- Bad, because the loser redoes the work.

### Pessimistic locking

- Good, because conflicts can't happen.
- Bad, because stale locks need timeouts and an "unlock" button; much more code.

### Last write wins

- Good, because no code at all.
- Bad, because silent data loss.

### `updatedAt` timestamps

- Good, because the column already exists.
- Bad, because millisecond timestamps can collide and clocks can differ; a counter is exact.

## More information

Phase 0 architecture, decision D6. Requirements: BR-PROJECT-07.
