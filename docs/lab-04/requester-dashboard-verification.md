# Issue #48 Requester Dashboard verification

Date: 2026-10-28, Asia/Bangkok. Branch: `feature5/lab4-requester-dashboard`, based on reviewed PR #55 staging merge `be6e14fad872a89c328f6da255e5f4047410da55`. Issue: [#48](https://github.com/BBINGOAL/toktickit/issues/48). PR/reviewer request recorded after creation; no approval is claimed here.

## Delivered behavior

- Requester-only Dashboard API returns four exact counts, at most five recent/attention previews each, public fields and matching drill-down URLs. One server time and repeatable-read transaction prevent mixed snapshots. A concurrent committed update between metric queries is tested against the next fresh snapshot.
- Seven Bangkok calendar dates use local midnight six dates before asOf, with inclusive UTC bounds. Resolve counts use current RESOLVED/CLOSED plus resolvedAt, not updatedAt or advisory indication. Tests cover midnight, year boundary, leap/non-leap February and just-outside/future timestamps.
- My Tickets intersects session ownership, scope/status/date and existing filters, validates query values, returns stable sort/ID pagination and keeps count/rows in one snapshot. Dashboard totals match separate authoritative Prisma counts and actual filtered-list totals.
- Requester login and required password change land on /dashboard. Dashboard navigation, server-owned counts, window/snapshot time, zero/loading/forbidden/expired/error/retry and clearly labelled previous-snapshot states are implemented. Older-user/query responses cannot replace current data.
- My Tickets URL preserves Dashboard bounds through search/status/category/priority/sort/page changes, refresh and browser Back/Forward. Filter changes reset page atomically; clear removes bounds. Sort/page controls and internal table scroll are keyboard reachable.
- PR #55 follow-ups: preserve Lab 2 visible removed-file metadata, restore authorized removed-download 410, hide missing/non-owned attachments identically with 404; document/test terminal owner/priority metadata edits and non-owner Staff resolution with actual actor history. Explicit Lab 2/3 403-to-404 compatibility notes appear in tests.md/API spec.

## Actual environment and results

Windows, native PostgreSQL **18.1**, existing isolated cluster under local `tmp/lab4-ui-verification/pg18-data` on B:, bound to **127.0.0.1:55434**, database **toktickit_lab4_verify_20261014_actions**. Only that test cluster was started for verification. No original Docker volume/localdb reset, migration/reseed, .env change or unrelated service shutdown. This increment adds no schema migration. Docker health/recovery was not asserted.

| Check | Actual result | Local run time (Bangkok) |
|---|---|---|
| Backend unit/API/migration/seed/recovery regression | **244/244**, 22 files, 59.45s | Start 18:22:24, completed 18:23:24 |
| Client component/regression | **72/72**, 17 files, 28.37s | Start 18:23:26, completed 18:23:55 |
| Chromium combined Actions/workflow/Requester Dashboard | **20/20**, 5 files, one worker, about 1.3m | 18:20:11-18:21:30 |
| Server types and production build | Pass, exit 0 | 18:23:24-18:23:25 |
| Prisma schema drift | No difference, exit 0 | 18:23:25-18:23:26 |
| Client TypeScript and production build | Pass, exit 0 | 18:23:55-18:23:59 |
| Client lint | Exit 0; three existing warnings in AuthContext, UserManagement and ITStaffQueue; no Dashboard/My Tickets warnings | Run after final regression |

Count delta from #47: 30 Dashboard/date/query checks, 5 workflow/attachment review follow-up checks, 11 client checks and 7 Requester E2E cases. The unchanged 13 Actions/workflow E2E cases also passed. No extra browser engines or full legacy E2E run is implied.

Logs/command timestamps are local in `tmp/lab4-dashboard-verification/{backend,client-ui,client-types,client-build,server-types,server-build,schema-drift,e2e}.txt` and corresponding `.result.json`; lint output is client-lint.txt. HTML/trace output is in the same local directory. Runtime images are local under `artifacts/lab-04/screenshots/requester-dashboard/`; four viewport cases pass at 320/390/768/1280px. The actual 320px and 1280px captures were inspected: wrapped navigation/long summaries, visible keyboard focus and no page overflow. My Tickets table scroll is checked separately. Images, logs, tmp scripts, DB files and report MD/PDF remain uncommitted.

## Reproduction

Supply an isolated migrated/seeded `toktickit_lab4_verify_*` database explicitly; do not use localdb. For native backup/restore checks, LAB4_PG_BIN must point to installed pg_dump/pg_restore. Do not start another server on the configured ports before Playwright, which deliberately refuses to reuse an unknown running app.

```powershell
$env:DATABASE_URL='postgresql://postgres:password@127.0.0.1:55434/toktickit_lab4_verify_20261014_actions'
$env:LAB4_PG_BIN='C:\Program Files\PostgreSQL\18\bin'

# From server/
node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1 --fileParallelism=false
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc
node node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code

# From client/
node node_modules/vitest/vitest.mjs run --maxWorkers=1 --fileParallelism=false
node node_modules/typescript/bin/tsc -b --noEmit
node node_modules/vite/bin/vite.js build
npm run lint

# From e2e/, same explicit DATABASE_URL inherited by API and fixtures
node node_modules/@playwright/test/cli.js test --config lab4-dashboard.config.ts
```

The local runner also checks the exact verification DB name and redirects temp/cache files to B:. It is a convenience script, not a required committed project dependency. Native PG cluster is shut down after verification.

## Observed failures and corrections

1. Initial date tests were red because dashboard-rules did not exist. A sandbox worker spawn attempt failed EPERM; the actual red run used authorized threads. Implemented before recording green results.
2. First focused API run: 27/28. A hardcoded recentlyUpdated fixture expectation counted six instead of five; independent Prisma/drill-down comparisons confirmed five. Corrected the expectation without changing the metric predicate.
3. First focused client run: 13/15. Existing NEW badge selector also matched the new Status option; narrowed it to the actual badge span. New clear-filter test matched both identical reset controls; selected the filter control explicitly. An erasableSyntaxOnly typecheck rejection of a constructor parameter property was fixed using an explicit field.
4. First combined E2E: 15/19. All four Dashboard focus assertions used programmatic focus after mouse sign-in, which does not activate :focus-visible keyboard modality. Replaced the setup with real Tab navigation, retaining the visible-outline assertion. Added first-password-change coverage; final **20/20** passed without weakening viewport/focus checks.
5. PR #55 follow-up test exposed removed download 404 versus the documented authorized 410; fixed authorization-before-removal ordering. An intermediate workflow-only run also had a fixture-hook timeout and a subsequent matrix failure; root cause was not established. The final serial full backend run passed **244/244** with unchanged assertions/timeouts. This is recorded rather than claiming the transient timeout was diagnosed or fixed.

Nonfatal pg adapter concurrent-query deprecation warnings remain from the existing stack; no dependency upgrade was attempted. Client lint has three existing warnings noted above. These are not represented as a warning-free run.

## Review and release boundary

Requester Dashboard acceptance is implemented and verified on this feature branch. Staff/Admin keep their existing Queue landing route until #49; its metrics/My Actions/Queue work has not started. Whole-product contrast/200% zoom/performance smoke, full older E2E, remaining hardening and final-main verification remain #50/#51. Existing contract rows stay Partial/Not run for that scope. Review and staging merge of this PR are required before #49; no auto-merge.
