# Documentation map

All product and design docs live here, next to the code. Each doc is a small Markdown file. Requirement and design
items have **stable IDs**, so you can search one ID and find everything connected to it: the requirement, the
screen, the API, the design and the tests.

## Where things are

| Folder or file                                                                                               | What it holds                                                | ID examples                       |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------- |
| [requirements/](requirements/README.md)                                                                      | What the business needs, one folder per feature              | `US-`, `BR-`, `AC-`, `MSG-`, `Q-` |
| [design/basic/screens/](design/basic/screens/)                                                               | Basic design: each screen's layout, fields, states, locators | `SCR-AUTH-01`                     |
| [design/basic/flows/](design/basic/flows/)                                                                   | Basic design: user flows and navigation (Mermaid diagrams)   | `FLW-AUTH-01`                     |
| [design/detail/logic/](design/detail/logic/)                                                                 | Detail design: how it works inside (sequence, rules in code) | `DD-AUTH-01`                      |
| [DATABASE.md](DATABASE.md)                                                                                   | Detail design: tables, columns, migrations, seed data        |                                   |
| [api/](api/README.md)                                                                                        | One file per endpoint                                        | `API-HEALTH-01`                   |
| [decisions/](decisions/README.md)                                                                            | Architecture decisions (ADR)                                 | `ADR-0001`                        |
| [phases/](phases/)                                                                                           | Technical plan per phase (what we build when)                |                                   |
| [traceability.md](traceability.md)                                                                           | **Generated** matrix: each AC → design, API and tests        |                                   |
| [\_templates/](_templates/README.md)                                                                         | Copy one of these to start a new doc                         |                                   |
| [ARCHITECTURE.md](ARCHITECTURE.md), [TESTING.md](TESTING.md), [PLAYWRIGHT.md](PLAYWRIGHT.md), [AI.md](AI.md) | How the system and the tests work                            |                                   |

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
- Design and API files list what they serve under `traces:` in their front matter. The matrix is built from that.

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

## Looking back

- Every change goes through a pull request, so `git log -p docs/requirements/auth/rules.md` (or "History" on GitHub)
  shows who changed a rule, when, and why.
- Feature, screen and design files end with a short **Change log** for business-visible changes.

## Commands

| Command              | Does                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run docs:check` | Checks front matter, duplicate IDs, links to IDs that don't exist, and test tags. Run before a PR.   |
| `npm run docs:build` | Same checks, then regenerates `traceability.md`, `requirements/README.md` and `decisions/README.md`. |
