# Documentation map

All product and design docs live here, next to the code. Each doc is a small Markdown file. Requirement and design
items have **stable IDs**, so you can search one ID and find everything connected to it: the requirement, the
screen, the API, the design and the tests.

## Where things are

| Folder or file                                                                                               | What it holds                                                                                                           | ID examples                       |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [requirements/](requirements/README.md)                                                                      | What the business needs, one folder per feature                                                                         | `US-`, `BR-`, `AC-`, `MSG-`, `Q-` |
| [design/basic/screens/](design/basic/screens/)                                                               | Basic design: each screen's layout, fields, states, locators                                                            | `SCR-AUTH-01`                     |
| [design/basic/flows/](design/basic/flows/)                                                                   | Basic design: user flows and navigation (Mermaid diagrams)                                                              | `FLW-AUTH-01`                     |
| [design/detail/logic/](design/detail/logic/)                                                                 | Detail design: how it works inside (sequence, rules in code)                                                            | `DD-AUTH-01`                      |
| [database/](database/README.md)                                                                              | Detail design: all tables and relationships (overview), one file per table in `database/tables/`, migrations, seed data |                                   |
| [api/](api/README.md)                                                                                        | One file per endpoint                                                                                                   | `API-HEALTH-01`                   |
| [decisions/](decisions/README.md)                                                                            | Architecture decisions (ADR)                                                                                            | `ADR-0001`                        |
| [phases/](phases/)                                                                                           | Technical plan per phase (what we build when)                                                                           |                                   |
| [traceability/](traceability/README.md)                                                                      | **Generated**: coverage overview, one matrix per feature (AC → design, API, tests) and the reverse view (test → AC)     |                                   |
| [\_templates/](_templates/README.md)                                                                         | Copy one of these to start a new doc                                                                                    |                                   |
| [ARCHITECTURE.md](ARCHITECTURE.md), [TESTING.md](TESTING.md), [PLAYWRIGHT.md](PLAYWRIGHT.md), [AI.md](AI.md) | How the system and the tests work                                                                                       |                                   |

## IDs

`<TYPE>-<FEATURE>-<NN>`, for example `AC-AUTH-11`. `FEATURE` is the requirements folder name in capitals.

| Type  | Meaning              | Defined in                             |
| ----- | -------------------- | -------------------------------------- |
| `US`  | User story           | `requirements/<feature>/stories.md`    |
| `BR`  | Business rule        | `requirements/<feature>/rules.md`      |
| `AC`  | Acceptance criterion | `requirements/<feature>/acceptance.md` |
| `MSG` | UI or error message  | `requirements/<feature>/messages.md`   |
| `Q`   | Open question        | `requirements/<feature>/README.md`     |
| `SCR` | Screen               | `design/basic/screens/SCR-…md`         |
| `FLW` | User flow            | `design/basic/flows/FLW-…md`           |
| `DD`  | Detail design item   | `design/detail/logic/DD-…md`           |
| `API` | Endpoint             | `api/<resource>/<method>-<name>.md`    |
| `ADR` | Decision             | `decisions/ADR-NNNN-…md` (`ADR-0001`)  |

Rules:

- An ID is defined once: in the first column of a table row, or as the `id` in a file's front matter.
- IDs are **never renumbered or reused**. When something is dropped, set its status to `deprecated` or strike it
  through, but keep the ID, so old tests and bug reports still point to something.
- Every `MSG` text also lives once in code, in `MESSAGES` in `packages/shared/src/messages.ts`
  (`'MSG-AUTH-01': '…'`). Apps and tests use the code, `msg('MSG-AUTH-01')` from `@qawm/shared`; `docs:check` fails
  if the docs and the code differ, or if an app copies a message string.
- Design and API files list what they serve under `traces:` in their front matter. The matrix is built from that.

## Requirement attributes

Following ISO/IEC/IEEE 29148, requirement rows carry a few attributes as extra table columns. `docs:check` fails if
one is missing or has a value not in the list.

| Column     | On     | Values                                            | Meaning                                                                                                                        |
| ---------- | ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Priority` | US, AC | `Must`, `Should`, `Could`, `Won't`                | Business value (MoSCoW). Decides what is built and tested first.                                                               |
| `Source`   | US, BR | free text                                         | Where the requirement came from (a brief, a person, a review), so you know who to ask.                                         |
| `Risk`     | AC     | `High`, `Medium`, `Low`                           | How likely this breaks and how much it hurts if it does (risk-based testing, ISO/IEC/IEEE 29119-2). High risk is tested first. |
| `Verify`   | AC     | `Auto-UI`, `Auto-API`, `Unit`, `Manual`, `Review` | How the criterion is checked; one or more, comma-separated. `Auto-*` means a Playwright test should be tagged with it.         |
| `Covers`   | AC     | US and BR IDs                                     | The stories and rules the criterion proves (trace up).                                                                         |

## Front matter

Design, API and decision files start with a header like this:

```yaml
---
id: SCR-AUTH-01
title: Login screen
type: screen
feature: auth
status: review # draft | review | approved | deprecated
phase: 2
traces:
  requirements: [US-AUTH-01, BR-AUTH-03]
  acceptance: [AC-AUTH-01, AC-AUTH-02]
  design: [FLW-AUTH-01]
updated: 2026-10-07
---
```

## Tests

Tag each Playwright test with the criteria it checks: `{ tag: '@AC-AUTH-02' }`. See [TESTING.md](TESTING.md#rules-for-every-test).

## Traceability

`npm run docs:build` writes [traceability/](traceability/README.md) from the docs and the test tags:

- `README.md`: coverage per feature and the gaps to review (high-risk criteria with no test, stories and rules with
  no criterion, tests with no tag).
- `<feature>.md`: requirement → design → API → test, then the automation gaps sorted by risk.
- `tests.md`: the reverse view, each test and the IDs it covers.

The gaps are warnings, not errors: they are normal while a phase is in progress. Review the `traceability/` diff in
each pull request to see what coverage changed.

## Looking back

- Every change goes through a pull request, so `git log -p docs/requirements/auth/rules.md` (or "History" on GitHub)
  shows who changed a rule, when, and why.
- Feature, screen and design files end with a short **Change log** for business-visible changes.

## Commands

| Command              | Does                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run docs:check` | Checks front matter, requirement attributes, duplicate IDs, links to IDs that don't exist, and test tags. Run before a PR. |
| `npm run docs:build` | Same checks, then regenerates `traceability/`, `requirements/README.md` and `decisions/README.md`.                         |
