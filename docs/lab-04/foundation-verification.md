# Issue #45 Foundation Verification

Status: issue #45 foundation verified on its feature branch and ready for peer review. Await review and staging integration before issue #46. This is not final-main or complete Lab 4 verification.

## Implemented so far

- Additive Prisma schema/migration for Actions Taken, events, mutation replay records and Ticket version/cycle fields. Legacy resolvedAt backfill is explicitly approximate.
- Authorized action list/create/PATCH/history and active-assignee list. Role denial precedes lookup; non-owned/missing Requester resource reads use identical 404.
- Single-edge lifecycle, strict dates/text/follow-up validation, parent/User row locks, version conflicts, scoped idempotency replay and transactional events.
- Repeat-safe old seed and new deterministic Lab 4 demo data; existing passwords/activity/Ticket state are preserved.
- Executed tests for API, concurrent writes/retry/rollback, preserved-data migration, pg_dump/restore recovery and repeat seed.

## Actual checks on 2026-10-14

| Check | Actual result |
|---|---|
| Prisma validate and client generation | Passed |
| TypeScript noEmit for src and Prisma seed files | Passed |
| Schema drift against migrated test DB | Passed, no difference |
| Full backend suite | 124 passed across 18 files: 64 earlier tests + 60 Lab 4 foundation tests |
| Lab 4 test breakdown | Validation 15, action API 31, concurrency/retry/failure 11, migration/recovery 2, seed 1 |
| Migration deploy | All 5 migrations applied successfully to isolated DB |
| Migration/recovery/seed integration tests | Passed; legacy values/relations preserved, real pg_dump/pg_restore and repeated seed exercised |
| Server build | Passed |
| Existing client UI regression | 31 passed across 13 files |
| Client type check | Passed |
| E2E / final main release | Not run for this backend-foundation issue; later issue/release coverage remains pending |

Initial Docker/WSL/memory failures blocked the first attempt. After recovery, the original volume was present and localdb could be read (29 Tickets). All writes for verification used `toktickit_lab4_verify_20261014_actions` or uniquely named migration-test databases. localdb was not migrated, reset or seeded.

The first real seed attempt caught a PostgreSQL void-result deserialization error on the advisory lock; casting its result to text fixed it. A test import initially selected the tracked older seed.js instead of seed.ts; the test now imports the TS source explicitly. Drift detection also exposed the existing Lab 3 User.updatedAt default mismatch; the Prisma schema now reflects that existing database default without rewriting the old migration or legacy records. All final checks below passed after these fixes.

## Reproduce the verified checks (PowerShell)

Check docker ps and local-postgres health. The named DB already exists in the author's environment; create a new isolated DB if reproducing elsewhere. Never reset localdb. From server:

```powershell
$env:DATABASE_URL='postgresql://postgres:password@127.0.0.1:5434/toktickit_lab4_verify_20261014_actions'
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
npx vitest run --fileParallelism=false --pool=threads --maxWorkers=1
npm run build
```

From client, run vitest with pool=threads/maxWorkers=1 and tsc -b --noEmit. Actual local logs are in tmp/lab4-verification (excluded from commits): backend-final.txt (124 tests), backend.txt (earlier 114-test run), schema-drift.txt, server-types.txt, server-build.txt, client-ui.txt, client-types.txt and results.json (the earlier combined check run). The final expanded backend run started at 2026-10-14 12:43 Asia/Bangkok. No test-output images are committed.

Migration tests create their own uniquely named guarded disposable DBs and remove only DBs they created. Recovery uses PostgreSQL tools inside local-postgres and checks restored legacy records/schema; baseline-app startup verification is still a later release task. The remaining Ticket resolution/workflow APIs belong to issue #47; dashboards and UI belong to later issues.

## Stage boundaries and limitations

This issue provides the Actions Taken APIs and shared concurrency foundations. It does not implement the formal Ticket resolution gate, versioned legacy Ticket mutations, Ticket history endpoints, dashboards or UI; these remain explicitly assigned to later issues. In particular, action-versus-formal-resolution race tests belong to #47. Existing legacy endpoints are preserved at this stage; the broader resource-privacy regression increment remains scheduled. Passing earlier tests does not assert those later features exist.

Ready for PpAnpt review; do not mark #45 Done or start #46 before review and integration. Report screenshots, report MD/PDF and temporary captures remain excluded from commits.
