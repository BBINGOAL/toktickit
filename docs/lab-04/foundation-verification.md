# Issue #45 Foundation Verification

Status: implementation in progress, **not ready for review/merge**. Branch: feature2/lab4-actions-taken-foundation-migration.

## Implemented so far

- Additive Prisma schema/migration for Actions Taken, events, mutation replay records and Ticket version/cycle fields. Legacy resolvedAt backfill is explicitly approximate.
- Authorized action list/create/PATCH/history and active-assignee list. Role denial precedes lookup; non-owned/missing Requester resource reads use identical 404.
- Single-edge lifecycle, strict dates/text/follow-up validation, parent/User row locks, version conflicts, scoped idempotency replay and transactional events.
- Repeat-safe old seed and new deterministic Lab 4 demo data; existing passwords/activity/Ticket state are preserved.
- Planned executable tests for API, concurrent writes/retry/rollback, preserved-data migration, pg_dump/restore recovery and repeat seed.

## Actual checks on 2026-10-14

| Check | Actual result |
|---|---|
| Prisma validate and client generation | Passed |
| TypeScript noEmit for src and Prisma seed files | Passed |
| action-validation.test.ts | 8 passed |
| Database/API/concurrency tests | Not run; isolated DB setup is not complete |
| Migration deploy | Attempt failed while Windows Prisma schema engine could not start; no successful migration claimed |
| Migration/recovery/seed integration tests | Not run |
| Full earlier regression | Not run for this issue |

Docker/WSL startup repeatedly failed with 0xc00000fd. Docker briefly became healthy and an empty isolated database `toktickit_lab4_verify_20261014_actions` was created, but migration deploy did not complete. Host memory was severely constrained and Docker later became unresponsive. `localdb` was not migrated, reset or seeded.

## Resume after Docker is stable

Check `docker ps` and confirm local-postgres is healthy. The named test DB already exists; do not recreate/reset localdb. In server, set DATABASE_URL explicitly to that isolated DB, run `prisma migrate deploy`, regenerate Prisma Client, seed, then run `vitest run tests/lab-04 --fileParallelism=false --pool=threads --maxWorkers=1`. Investigate actual failures before marking any test passed. Then run the complete backend regression and relevant build/client checks.

Migration tests create their own uniquely named guarded disposable DBs and remove only DBs they created. Recovery uses PostgreSQL tools inside local-postgres and checks restored legacy records/schema; baseline-app startup verification is still a later release task. The remaining Ticket resolution/workflow APIs belong to issue #47; dashboards and UI belong to later issues.

Do not open a ready-for-review PR, request approval, mark #45 Done or start #46 until the foundation is verified. Report screenshots, report MD/PDF and temporary captures remain excluded from commits.
