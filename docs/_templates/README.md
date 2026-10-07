# Templates

Copy a template, rename it, fill it in, then run `npm run docs:build`.

| You are writing              | Copy                                        | Save as                                                |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| A new feature's requirements | the whole [feature/](feature) folder        | `docs/requirements/<feature>/`                         |
| A screen (basic design)      | [screen.md](screen.md)                      | `docs/design/basic/screens/SCR-<FEATURE>-NN-<name>.md` |
| A user flow (basic design)   | [flow.md](flow.md)                          | `docs/design/basic/flows/FLW-<FEATURE>-NN-<name>.md`   |
| Detail design (logic)        | [detail-design.md](detail-design.md)        | `docs/design/detail/logic/DD-<FEATURE>-NN-<name>.md`   |
| A decision                   | [adr.md](adr.md)                            | `docs/decisions/ADR-NNNN-<name>.md`                    |
| An API endpoint              | [../api/\_template.md](../api/_template.md) | `docs/api/<resource>/<method>-<name>.md`               |

`FEATURE` is the feature folder name in capitals (`auth` → `AUTH`). Numbers are never reused: take the next free one.
