# Actions Taken UI — issue #46 verification

Date: 2026-10-20, Asia/Bangkok. Branch: `feature3/lab4-actions-taken-ui`, based on staging merge 3465088 (PR #53). Prepared for peer review after feature-branch verification; not final main. Wait for review and integration before #47.

[PR #54](https://github.com/BBINGOAL/toktickit/pull/54) is open into lab4-staging, linked to issue #46, with PpAnpt requested and Project 4 In review. Approval/integration are pending. The temporary PostgreSQL cluster was stopped cleanly after testing; Docker recovery remains unconfirmed.

## Implemented

Typed list/create/update/history/assignee APIs and a shared paginated Ticket Detail section. Separate actor/assignee/work cycle/work time/recorded time; read-only chronological history. Staff/Admin create/edit/reassignment, separate Start/Complete, result validation, cancellation reason/confirmation, and linked follow-up. Requester and terminal records are read-only; no delete. Earlier attachments/comments/private notes remain.

Pending-submit guard; exact key/body retry after uncertain response; explicit conflict reload that keeps the draft; compare/load current saved values with recoverable previous draft; inactive-assignee errors and refreshed choices. Unchanged assignee omitted from PATCH so historical edit/cancel is not accidental reassignment; Start/Complete eligibility remains server-enforced. History displays assignee names.

Responsive token-based styles, labels/errors, focus cycle/Escape/restore, dirty-draft confirmation and internal modal scrolling. Fixed oversized checkbox and long Ticket header after real image inspection.

## Actual results

All database results below used a **new temporary native PostgreSQL 18.1 cluster on B:, bound to 127.0.0.1:55434**, database toktickit_lab4_verify_20261014_actions. This is neither the Docker verification database at port 5434 nor localdb. No .env, existing service or volume was changed.

| Check | Actual feature-branch result |
|---|---|
| Fresh migration deploy and seed | All 5 migrations and seed passed |
| Backend regression | **124/124**, 18 files; 13:11:50, duration 48.17s |
| Migration/recovery/repeat seed | Included above; native pg_dump/pg_restore, legacy field/FK preservation and repeat-seed checks passed |
| Schema drift | No difference detected; exit 0 |
| Complete client regression | **53/53**, 15 files; 13:14:29, duration 26.78s (22 new action checks plus 31 earlier checks) |
| Client/server typecheck and production build | Passed, exit 0 |
| Chromium Actions E2E | **9/9**, 3 files, one worker; final run 13:15:01–13:15:30, Playwright duration 29.1s |
| Runtime page errors | No uncaught application errors in all 9 scenarios |
| Responsive/keyboard | 320/390/768/1280px: no page/dialog horizontal overflow, dialog within viewport, keyboard cycle/Escape/restore and reachable bottom submit |

E2E covers two contributors on one Ticket, create/edit/reassignment/start/complete/follow-up/cancel, immutable performer/unchanged owner and Requester read-only history. Failure tests cover a lost response **after database commit** replaying the same key without a duplicate, stale create with explicit reload/retained draft, assignee deactivation, and an injected list 500 with safe retry/no false empty state.

Logs and exit-code JSON remain local under tmp/lab4-ui-verification; screenshots under artifacts/lab-04/screenshots/actions-taken. Neither is committed. Images were inspected, not merely generated. Modal top/bottom captures show internal scrolling and reachable submit. Long element crops may include the sticky navbar: full-page and viewport-form captures are the intended evidence, not a claim that every crop is suitable for the final report.

## Reproduction

Use an isolated toktickit_lab4_verify_* DATABASE_URL inherited by API and fixtures. Never migrate/reseed localdb. Use one worker. Optional LAB4_PG_BIN selects installed pg_dump/pg_restore; without it the recovery test retains its original Docker local-postgres path. Native tools are optional test tooling, not an application dependency.

```powershell
# Set DATABASE_URL to your isolated test server/database first.
# Optional for native PostgreSQL recovery tools:
$env:LAB4_PG_BIN = 'C:\Program Files\PostgreSQL\18\bin'
cd server
node node_modules/prisma/build/index.js migrate deploy
node node_modules/tsx/dist/cli.mjs prisma/seed.ts
node node_modules/vitest/vitest.mjs run --fileParallelism=false --pool=threads --maxWorkers=1
node node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
cd ../client
node node_modules/vitest/vitest.mjs run --fileParallelism=false --maxWorkers=1
node node_modules/typescript/bin/tsc -b --noEmit
node node_modules/vite/bin/vite.js build
cd ../e2e
node node_modules/@playwright/test/cli.js test --config lab4-actions.config.ts
```

E2E starts its own API/client, refuses unknown running servers, probes /api/health and cleans only owned fixtures. Lab 3 E2E config is unchanged. Temporary servers are stopped after testing; cluster files remain only in uncommitted tmp for reproducibility.

## Findings and environment boundary

- Corrected erasableSyntaxOnly parameter properties, lost datetime milliseconds, hidden focus targets in collapsed details, assignment-history rendering, unchanged-assignee PATCH, checkbox and long-header layout.
- Initial multiworker UI attempt exhausted memory; single-worker full reruns pass. Interrupted attempts are not passes.
- C: initially had 0 free bytes. Student separately authorized moving Unity; B: copy and original-path junction were verified. No Unity/storage script is part of this PR.
- Docker remained at **Engine stopping** after normal restart. No reset, prune or volume deletion. Current DB/E2E evidence explicitly uses native PostgreSQL 18.1; **Docker recovery is not claimed**.
- Verification TEMP/TMP/npm cache use B: for these processes only; Windows environment settings/production data were not changed.

## Peer feedback and remaining scope

PR #53's assignee fixture test searches its unique name, with matching inactive/Requester control prefixes. It no longer assumes inclusion in the first 50 global users and passed in the 124-test rerun.

Repeat seed uses update: {}: existing demo passwords/roles/names/activity/Tickets are preserved; seed is not an account-reset tool. README consolidation remains #51. Demo version/owner consistency is recorded for #47; optional CHECK constraints/redundant-index review for #50.

Formal Ticket workflow/resolution, dashboards, whole-product contrast/200% zoom inspection, earlier full E2E regression and final-main verification are later issues. These 9 E2E passes cover Actions Taken only, not all Labs 1–4 or final main. No student reflection/reviewer approval/final report evidence was invented.
