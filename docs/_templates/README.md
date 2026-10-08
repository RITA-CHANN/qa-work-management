# Templates

Copy a template, rename it, fill it in, then run `npm run docs:build`. Every template follows an international
standard, listed in [../STANDARDS.md](../STANDARDS.md); `docs:check` fails if a required section or column is
missing.

| You are writing                 | Copy                                                         | Save as                                                |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| A new feature's requirements    | the whole [feature/](feature) folder                         | `docs/requirements/<feature>/`                         |
| A screen (basic design)         | [screen.md](screen.md)                                       | `docs/design/basic/screens/SCR-<FEATURE>-NN-<name>.md` |
| A user flow (basic design)      | [flow.md](flow.md)                                           | `docs/design/basic/flows/FLW-<FEATURE>-NN-<name>.md`   |
| Detail design (logic)           | [detail-design.md](detail-design.md)                         | `docs/design/detail/logic/DD-<FEATURE>-NN-<name>.md`   |
| A decision                      | [adr.md](adr.md)                                             | `docs/decisions/ADR-NNNN-<name>.md`                    |
| An API endpoint                 | [../api/\_template.md](../api/_template.md)                  | `docs/api/<resource>/<method>-<name>.md`               |
| A database table                | [table.md](table.md)                                         | `docs/database/tables/<table_name>.md`                 |
| A phase test plan               | [testing/test-plan.md](testing/test-plan.md)                 | `docs/testing/plans/TP-PHASE-NN-<name>.md`             |
| Test conditions for a feature   | [testing/conditions.md](testing/conditions.md)               | `docs/testing/<feature>/conditions.md`                 |
| Manual test cases for a feature | [testing/manual-cases.md](testing/manual-cases.md)           | `docs/testing/<feature>/manual-cases.md`               |
| Product risks (one file)        | [testing/risks.md](testing/risks.md)                         | `docs/testing/risks.md`                                |
| A phase test completion report  | [testing/completion-report.md](testing/completion-report.md) | `docs/testing/reports/TCR-PHASE-NN-<name>.md`          |
| A bug report                    | GitHub issue, "Bug report" form                              | `.github/ISSUE_TEMPLATE/bug.yml`                       |

`FEATURE` is the feature folder name in capitals (`auth` → `AUTH`). Numbers are never reused: take the next free one.

Every doc has `owner` (who keeps it up to date) and `reviewers` in its front matter. When a doc becomes
`approved`, set `approved:` to that date.
