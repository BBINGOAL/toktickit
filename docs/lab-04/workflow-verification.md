# Issue #47 — Ticket workflow verification

Date: 2026-10-20 (Asia/Bangkok). Branch: `feature4/lab4-ticket-workflow-resolution`, from merged PR #54 at `10dd684`. Implementation follows BR-13–19 and the reviewed transition matrix. Feature-branch evidence only; not final main.

## Delivered

- Strictly versioned status/owner/priority/advisory APIs, public Ticket detail with allowed next statuses/gate summary, and read-only paginated workflow history. Obsolete unversioned backend handlers and client helpers removed, not bypassed for older callers.
- Resolution requires an active Staff/Admin Ticket owner, nonblank summary, completed current-cycle work/result, no pending actions and no unresolved completed-action follow-up chain. Requester indication remains advisory and repeat calls preserve time/version/event count.
- Reopen increments workCycle and clears resolution/advisory/cancellation fields. Historical actions remain visible but cannot satisfy the new cycle. Already resolved legacy zero-action Tickets can close without invented actions.
- Cancellation atomically cancels unfinished current-cycle actions with their events; completed actions remain unchanged. Ticket event/state/action events/idempotency response commit together or roll back together.
- Ticket-before-User sorted locks, actor/owner revalidation, bounded transaction retry and exact request replay. Same-version competitors and action-create-versus-resolve serialize; no successful resolution with new pending work sneaking in.
- Staff UI uses API-provided transitions, explicit Apply status, summary/reason validation, versioned owner/priority operations, gate feedback and public history. Requesters have only the permitted advisory control.
- Pending-submit protection, exact-intent workflow retry, stale reload with preserved drafts, field labels/linked errors and safe failure text. Actions refresh their Ticket version after workflow changes.

## Actual results

| Check | Result |
|---|---|
| Workflow unit/API first targeted run | 83/83; 64 pure matrix combinations plus gate cases, API roles/matrix, concurrent writes, replay, privacy and rollback |
| Full backend final rerun | **209/209**, 20 files; start 15:24:51, duration 66.24s (85 workflow checks plus earlier 124); includes legacy zero-action close and tied-history pagination |
| Full client regression | **61/61**, 16 files, start 15:20:45, duration 28.59s |
| Chromium Actions + workflow E2E | **13/13**, one worker, 4 files; latest transcript under tmp/lab4-workflow-verification |
| Client/server types and production builds | Passed; server checks repeated after final backend run |
| Schema drift | No difference detected, exit 0 in final rerun |
| Responsive / keyboard | Existing 320/390/768/1280px assertions pass unchanged, including focus restoration after Escape |

Database: **native PostgreSQL 18.1**, new isolated test cluster previously created on B:, bound to `127.0.0.1:55434`, database `toktickit_lab4_verify_20261014_actions`. API and E2E fixtures inherit the same DATABASE_URL. `LAB4_PG_BIN` selects the already installed native pg_dump/pg_restore for recovery tests. No localdb migration/seed/reset, original Docker volume mutation or .env change. Docker recovery is not asserted. Temporary API/client processes stop with Playwright; the owned PostgreSQL cluster is stopped after verification.

## Reproduce

Set DATABASE_URL to an isolated `toktickit_lab4_verify_*` database. Apply the five existing migrations and repeat-safe seed there if new. No new migration is needed for this issue; its fields/event tables were added in #45. Use one worker to limit local memory pressure.

```powershell
# Optional installed PostgreSQL recovery tools; unset retains Docker default.
$env:LAB4_PG_BIN = 'C:\Program Files\PostgreSQL\18\bin'
cd server
node node_modules/vitest/vitest.mjs run --fileParallelism=false --pool=threads --maxWorkers=1
node node_modules/typescript/bin/tsc
node node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
cd ../client
node node_modules/vitest/vitest.mjs run --fileParallelism=false --maxWorkers=1
node node_modules/typescript/bin/tsc -b --noEmit
node node_modules/vite/bin/vite.js build
cd ../e2e
node node_modules/@playwright/test/cli.js test --config lab4-workflow.config.ts
```

Logs/exit-code JSON: `tmp/lab4-workflow-verification/`. Runtime images remain under `artifacts/lab-04/screenshots/`. Both are uncommitted. Screenshot inspection confirms the input timezone hint is visible and the modal remains within narrow/tablet viewports. This is not the final PDF/report or a claim of whole-product visual/zoom completion.

## Review feedback carried forward

PR #54 was APPROVED by PpAnpt for latest head `2cb79da` on 2026-10-20 and merged at `10dd684`; actual review and author thanks are linked in reviewer.md. Three nonblocking suggestions are addressed here: explicit input/display timezone hint, uncertain Action-dialog close warning plus authoritative refresh, and submission intent stored in React state rather than read from a ref during render. The general ActionsTaken file split remains a readability follow-up for #50; Ticket workflow is already a separate component/service.

PR #53 seed consistency decision: retain version=0 for a newly inserted demo snapshot. It is a concurrency token, not a count of existing actions or fictional past transitions. Keep owner and action-assignee independent: an unowned OPEN Ticket may have assigned actions but cannot resolve until an eligible owner and all other gates exist. No old demo/User/Ticket data is rewritten, and no fake events are backfilled. Gate, owner and legacy-zero-action tests enforce these boundaries. Optional DB CHECK/redundant-index review remains #50.

## Failures found and fixed

- Red phase: workflow-rules tests initially failed to import the not-yet-implemented rule module; implementation then passed.
- The first full E2E run passed lifecycle cases but failed four focus-restoration assertions. Refreshing every dialog close disabled the trigger before focus returned. Refresh now happens for uncertain submissions only, with deferred focus restoration after reload; clean close retains ordinary modal restoration. Existing assertions were not weakened. Final 13-case rerun passes.
- One client rerun exposed a mount-effect race resetting a just-selected status; synchronization now happens only when authoritative status/priority actually changes. The full 61-test rerun passes.
- A non-fatal pg adapter concurrent-query deprecation warning appears in native PostgreSQL tests; no dependency upgrade was attempted and it is not concealed as zero warnings.

## Remaining scope

Peer review/integration gate still applies before #48. Dashboards, queue drill-down hardening, complete old E2E regression, whole-product contrast/200% zoom, performance smoke, final-main verification and report delivery remain later issues. No new reviewer approval or student reflection is invented. No screenshots/report/PDF/tmp/storage-management files are included in commits.
