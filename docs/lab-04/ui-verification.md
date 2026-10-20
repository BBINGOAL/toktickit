# Actions Taken UI — issue #46 checkpoint

Date: 2026-10-20, Asia/Bangkok. Branch: `feature3/lab4-actions-taken-ui`, based on staging merge `3465088` (PR #53). Issue remains **In progress**, not ready for peer approval or integration.

## Implemented

- Typed action/list/history/assignee APIs, credentialed requests, safe error messages, versions and stable idempotency keys.
- Shared Ticket Detail section, pagination, work/recorded timestamps, actor versus assignee, read-only details and chronological paginated audit history.
- Staff/Admin create/edit/assignment, separate Start/Complete edges, result validation, cancellation reason/confirmation, and linked follow-up creation from completed current-cycle work.
- Requester read-only controls; terminal-parent/terminal-action restrictions; existing attachments/comments/private notes retained.
- Pending submission guard, frozen exact request on uncertain transport failure, explicit retry of the same key/body, conflict reload with draft preservation and current saved-state comparison, inactive-assignee feedback/choice refresh.
- Responsive token-based styles, labels/field errors, keyboard focus trap, Escape/dirty-draft confirmation and focus restoration. Runtime visual/keyboard verification is still pending.

## Actual verification

| Check | Result on this branch |
|---|---|
| Initial transport tests | 4/4 passed |
| Focused Actions Taken component/transport tests | 19/19 passed after fixes |
| Complete client regression, worker 1 | **50/50**, 15 files; start 12:36:57, duration 23.88s |
| `tsc -b client --noEmit` | Passed |
| `npm run build` in client | Passed; Vite production bundle generated |
| Playwright discovery with `--config lab4-actions.config.ts --list` | 7 tests discovered in 3 files; **not executed** |
| New E2E flows and runtime screenshots | Pending; no runtime screenshots or responsive pass claimed |
| Changed backend assignee test | Pending rerun; no new backend pass claimed |

Client regression command (repository root):

```powershell
node client/node_modules/vitest/vitest.mjs run --root client --fileParallelism=false --maxWorkers=1 --reporter=dot
node client/node_modules/typescript/bin/tsc -b client --noEmit
```

Current E2E setup intentionally uses its own `lab4-actions.config.ts`, one worker, explicit `toktickit_lab4_verify_*` guard and API/client processes that inherit the same DATABASE_URL. It refuses to reuse an already running server. Existing Lab 3 E2E configuration is unchanged. Tests clean only their own action/event/key/User/Ticket fixtures through the Lab 4 helper. No reset/reseed/migration was run against localdb.

After the environment is healthy, verify isolated migrations/reference data before running:

```powershell
# Set DATABASE_URL to an isolated toktickit_lab4_verify_* database, never localdb.
cd e2e
node node_modules/@playwright/test/cli.js test --config lab4-actions.config.ts
```

## Failures found and corrected

- TypeScript's erasableSyntaxOnly disallowed parameter properties in the new error class; replaced with explicit fields.
- Editing work dated exactly at Ticket creation lost milliseconds in datetime-local serialization, incorrectly making it predate Ticket creation; preserve milliseconds.
- Focusable-control selection needed explicit disabled/tabIndex filtering; component focus cycle/Escape/restore tests now pass. Real Chromium keyboard verification remains pending.
- Initial multiworker full UI attempt ran out of memory. Single-worker rerun passed all 50 tests; do not present the interrupted attempt as a pass.

## Environment blocker — not an application test failure

Docker Desktop initially started successfully (Engine 29.2.1, existing local-postgres on port 5434). npm then reported ENOSPC, and a Windows disk query confirmed **C: free space = 0 bytes**, while B: had approximately 36.7GB free. A Docker `SELECT 1` diagnostic against the existing isolated verification database did not return. No further database writes or E2E execution were attempted.

Process-local npm cache and TEMP/TMP were redirected to `tmp/lab4-ui-verification/` on B: for the subsequent UI/build checks. This does not move Docker storage or free C:. No personal files, volumes, downloads or Unity installations were deleted/moved. The hung Docker diagnostic client was stopped separately; Docker services/other containers were left untouched. Free space on C: and restore database responsiveness before continuing; do not factory-reset Docker or remove its data volume to bypass this blocker.

## Peer feedback carried forward

PR #53's assignee fixture test now searches a unique fixture name (including renamed inactive/Requester controls) rather than assuming inclusion in the first 50 global staff. Its rerun is pending. Repeat seed uses `update: {}`: it preserves existing demo passwords/roles/activity/names and does **not** reset accounts. Demo-version/owner consistency is recorded for #47; optional CHECK constraints/redundant-index review for #50. See reviewer.md for actual review provenance.

## Remaining before issue #46 PR

Run backend regression including the changed fixture test, execute all seven E2E scenarios, inspect actual screenshots at 320/390/768/1280 widths and check browser console/keyboard behavior. Address findings, update tests.md/ui-spec.md with real results, push meaningful commits, open/link the PR into lab4-staging, request PpAnpt and set Project 4 to In review. Do not start #47 before review and integration.

Screenshots/report files/tmp remain uncommitted. This checkpoint is engineering documentation, not the student submission report or a final-main test result.
