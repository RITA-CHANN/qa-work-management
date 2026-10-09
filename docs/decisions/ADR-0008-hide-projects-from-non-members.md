---
id: ADR-0008
title: Answer 404 for projects the caller is not a member of
type: decision
status: proposed
phase: 3
owner: Claude
reviewers: [Linh]
deciders: [Linh, Claude]
approved:
updated: 2026-10-08
---

# ADR-0008 Answer 404 for projects the caller is not a member of

Format: MADR 4.0 (Markdown Architectural Decision Records), the decision-and-rationale part of an ISO/IEC/IEEE
42010 architecture description.

## Context and problem

Projects can belong to different clients. When a user asks for a project they are not a member of, the API can
say "forbidden" (403) or "not found" (404). A 403 tells the caller that the key exists, which leaks client names
and lets someone guess keys.

## Decision drivers

- Don't reveal which projects exist (OWASP API1, broken object level authorization).
- Members still need a clear answer when their **role** doesn't allow an action.
- One rule that every later project-scoped endpoint (requirements, bugs, runs) can reuse.

## Considered options

1. 404 for non-members and unknown keys, 403 for members whose role doesn't allow the action.
2. 403 for every refusal, 404 only for unknown keys.
3. 404 for every refusal, including members without the right role.

## Decision outcome

Chosen option: "404 for non-members, 403 for members", because it hides the project from outsiders (driver 1)
while still telling a member why an action is refused (driver 2), and it is one middleware step every module
reuses (driver 3). Phase 0 already proposed it; Linh confirmed it (Q-PROJECT-04).

### Consequences

- Good, because a key that exists and a key that doesn't give byte-for-byte the same answer to an outsider.
- Good, because the permission tests split cleanly: "not a member" cases expect 404, "wrong role" cases expect 403.
- Bad, because a user who was just removed sees "Project not found" instead of "you were removed"; support has to
  know this.
- Neutral: Admins are treated as members of every project (BR-PROJECT-36).

### Confirmation

AC-PROJECT-16 and NFR-PROJECT-01 (API tests compare the two 404 bodies); the project loader in DD-PROJECT-01 is the
only place that resolves a key.

## Pros and cons of the options

### 404 for non-members, 403 for members

- Good, because no existence leak, and members still get a helpful 403.
- Bad, because two different refusal codes to learn.

### 403 for every refusal

- Good, because one refusal code.
- Bad, because it confirms the project exists.

### 404 for every refusal

- Good, because it leaks nothing at all.
- Bad, because a member who can see the project gets "not found" for a button they can see, which is confusing.

## More information

[DD-PROJECT-01 Permissions](../design/detail/logic/DD-PROJECT-01-permissions.md), BR-PROJECT-06, BR-PROJECT-35.
