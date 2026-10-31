# Lab 4 Final Main Release Verification

## Verified source and environment

Verified final main `768975d27754543d03d32a103682ccf81c14b606` on 2026-10-31: backend **278/278** (24 files), separate performance **1/1**, client **109/109** (20 files), application Chromium **49/49** (14 files), source types/builds/lint and schema drift checks pass. Actual main backup/restore and real baseline-app smoke pass; a separate main browser capture/metric comparison passes **1/1**. The prior 10-scenario evidence run remains labeled as staging evidence.

Feature PRs #52-#58 were peer reviewed and merged into staging. Documentation PR [#59](https://github.com/BBINGOAL/toktickit/pull/59) merged as `112497e` at 08:34:05 Asia/Bangkok; release PR [#60](https://github.com/BBINGOAL/toktickit/pull/60) merged into main as `768975d` at 08:39:17. The student explicitly clarified that documentation/release PRs do not need peer review. Their absence of peer approval is not presented as approval; no unnecessary reviewer gate is imposed. Documentation issue #51 was deleted and seven product issues #44-#50 are Done.

The student then checked out main and pulled at 08:39:58. Reflog records a normal fast-forward from 2b8531b to 768975d; local and GitHub main match. No tracked work was lost. `git ls-tree` confirms report-assets, artifacts/lab-04, output reports, report MD and tmp are not in the main commit. `git diff --quiet e25284b 768975d -- server client e2e` exits 0: reviewed runtime/test source is unchanged by the documentation/release merges. Nevertheless, all required application checks below were run freshly on actual main; earlier staging passes were not renamed.


Windows x64, Node 24.14.0, PostgreSQL 18.1, Ryzen 5 7535HS / 12 logical CPUs / 15.32 GiB RAM. Native isolated PostgreSQL on B:, 127.0.0.1:55434, database `toktickit_lab4_verify_20261014_actions`; JWT test secret matches the fixture. No localdb reset, original-data cleanup, or Docker-health claim. Browser suites start/stop their own API/Vite processes on ports 4000/5173.

## Actual commands, times and outcomes

Times below use Asia/Bangkok; UTC timestamps remain in the local machine-readable result records. Every command exits 0. Tests are sequential, one worker, no retries or skips. Backend and performance are separate runs, not a fabricated single 279-test execution.

| Check | Actual command (in indicated directory) | Result |
|---|---|---|
| Backend (server) | `node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1 --fileParallelism=false --exclude **/dashboard-performance.test.ts` | 278/278; 24 files; 08:41:47-08:42:41 |
| Performance (server) | `node node_modules/vitest/vitest.mjs run tests/lab-04/dashboard-performance.test.ts --pool=threads --maxWorkers=1 --fileParallelism=false` | 1/1; 1 file; 08:42:41-08:42:45 |
| UI (client) | `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --fileParallelism=false --reporter=dot` | 109/109; 20 files; 08:42:45-08:43:35 |
| Chromium (e2e) | `node node_modules/@playwright/test/cli.js test --config lab4-hardening.config.ts` | 49/49; 14 application files; 08:43:41-08:45:49 |
| Client types/build/lint | `tsc -b --noEmit`; `vite build`; `oxlint` | Pass; one existing AuthContext only-export-components warning |
| Server types/build | source-only `tsc` configuration; `node node_modules/typescript/bin/tsc` | Pass |
| Schema | `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` | No drift |
| Supplemental captures | Fresh main metric/database and desktop/tablet/mobile capture | 1/1 on main; prior 10/10 lifecycle/failure run was staging, not added to 49 app tests |
| Recovery | Baseline archive at 2b8531b, baseline deploy/client, pre-upgrade dump, Lab 4 deploy, separate restore, baseline app smoke | Pass; exact legacy data/schema/migration history and role checks |

Local transcripts: `tmp/lab4-main-verification/{backend,performance,client-ui,e2e,recovery,dashboard-captures}.txt`; result JSON records command/exit/time. Runtime metrics comparison is `report-assets/lab4-runtime/metric-comparison.json`; GitHub capture manifests and actual board/PR exports are kept locally. These files feed the report and deliberately remain uncommitted.

## Dashboard query and performance evidence

The supplemental capture independently compares four Requester counts and three Staff/Admin counts against Prisma queries. It uses the API's asOf/windowStart for Requester dates, current role IDs for owner/assignee, and the same documented active-state set. API and database values agree. API suites additionally compare all eight status/four priority keys, exact drill-down totals, zero/ownership states, equal-timestamp ordering and concurrent repeatable-read snapshots.

Performance adds 1000 Tickets/3000 Actions with unique owned fixture keys and retains original rows. Two warmups and 20 sequential requests per role; query count includes authentication/transaction commands. Limits stay p95 <=1000 ms, <=12 SQL statements and <=50 KiB JSON. This is local smoke, not production-load certification.

| Role | p95 ms | Max SQL | Max JSON bytes |
|---|---|---|---|
| Requester | 9.68 | 10 | 2953 |
| Staff | 14.74 | 12 | 5240 |
| Administrator | 21.3 | 12 | 5238 |

## MIG-02 complete recovery rehearsal

1. Archive baseline server code from exact Lab 3 SHA `2b8531bebe9e12f277ca9d97fb9baeb9e21ae257` to a separate workspace. Generate its distinct Prisma Client and deploy its four baseline migrations into a newly created `toktickit_lab4_verify_release_source_<runid>` database. Installed dependencies are shared, but generated schemas/clients are distinct.
2. Insert active Requester/Staff, Ticket, category/system, attachment metadata, public comment and private note fixtures. Save all seven legacy tables and `_prisma_migrations`, then `pg_dump -Fc` before upgrade. Attachment fixture tests metadata preservation, not file-byte recovery.
3. Apply current Lab 4 migrations to the source database; successful applied-migration count changes from 4 to 5.
4. `pg_restore --exit-on-error -d <separate_empty_recovery_db> <preupgrade.dump>`. Compare every original field, FK ID, count and exact migration-history row. The recovered schema has no ActionTaken or Ticket version field.
5. Load the real baseline Express application with its own generated client against recovery. Supertest verifies health 200, unauthenticated 401, cookie login/me 200, Requester-owned list/detail/comments, Staff Queue/detail, Requester notes 403 and Staff private notes 200. This supplements the committed migration suite's earlier SQL-only checks and completes the previously Partial baseline-app requirement.
6. Disconnect and drop only the two exact disposable database names created by the rehearsal. Preserve the source application database. No use of `resolve --rolled-back` on successful migrations or manual edits to migration history.

The first local rehearsal assumed fixture IDs began at 1 and failed an FK; changed to returned IDs. The next probe incorrectly expected Staff to use the Requester list route; corrected to the unchanged baseline `/api/staff/tickets`. Both were harness mistakes, not application changes or weakened assertions. Final real baseline smoke and preservation checks pass. Supplemental screenshot fixture initially omitted required workCycle; fixed to 1 and final 10 scenarios pass.

## Visual/accessibility evidence

Real browser evidence covers Staff/Admin/Requester Dashboards, Actions list/form and lifecycle/failure states. Captures at 390x900, 768x900 and 1280x900 accompany the existing four-width 320/390/768/1280 regression. Keyboard traps/Escape/restoration, semantic labels, dirty-draft protection, long text, internal table scrolling, rendered solid-text contrast and CSS zoom=2 pass. This is not a claim of native Chrome-menu zoom, full assistive-technology/WCAG certification or image/gradient contrast coverage. Actual PDF pages are rendered and inspected separately.

## Actual integration and evidence boundary

PRs #52-#58 have actual PpAnpt approvals and staging merges. #58 reviewer reports 279 backend/performance and 109 client passes on a separate database; explicitly did not rerun E2E. Author reply: https://github.com/BBINGOAL/toktickit/pull/58#issuecomment-6527514521. Generic dialog class naming and a more explicit SQL helper comment remain optional nonblocking refactors; current upload failure sanitization was inspected. No source change followed #58 approval.

Documentation/release PRs #59/#60 are merged; peer review was waived by the student for this workflow. REL-01 and AC-18 now have actual main execution, seven reviewed product increments and the Part 1-9 report. This final evidence update is documentation only on a branch from main; it does not change the already verified application code. No report images, PDF/MD, temporary scripts, dumps or local database files are committed.
