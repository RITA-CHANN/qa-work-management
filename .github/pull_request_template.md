## What changes

Before:

After:

## Traceability

- IDs added, changed or deprecated:
- Acceptance criteria affected:

## Checklist

- [ ] `npm run docs:build` run and the `docs/traceability/` diff reviewed
- [ ] New or changed requirements meet the ISO/IEC/IEEE 29148 checklist in `docs/STANDARDS.md`
      (one statement, unambiguous, verifiable, with Priority / Risk / Verify)
- [ ] Docs changed in the same PR as the code they describe (API, table, screen, messages)
- [ ] Tests tagged with the criteria they check (`{ tag: '@AC-…' }`)
- [ ] `npm run lint`, `npm run typecheck` and the tests pass
