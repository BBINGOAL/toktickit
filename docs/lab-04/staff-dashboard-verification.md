# Issue #49 Staff/Admin Dashboard verification

Date: 2026-10-28, Asia/Bangkok. Branch: `feature6/lab4-staff-dashboard`, based on reviewed PR #56 staging merge `cdc2a655ba9464cfc7a488a99f1ef48aa80ba294`. Issue: [#49](https://github.com/BBINGOAL/toktickit/issues/49). [PR #57](https://github.com/BBINGOAL/toktickit/pull/57) targets lab4-staging, has a verified Development link to #49 and verified PpAnpt review request. Status: In review. No approval/final-main result is claimed.

## Delivered behavior

Staff and Administrator share /staff/dashboard, landing there after sign-in or required password change. Keep Queue and Admin Users navigation. The Dashboard shows unassigned active Tickets, my active Tickets, my unfinished assigned Actions, complete status/active IT-priority groups including zero/UNSET, and bounded My Actions/recent/urgent previews. My Actions uses the current assignee, not performer, and requires an active parent. Urgent means HIGH IT priority and active Ticket. Counts are backend-owned and independent of the five-item preview cap.

One repeatable-read transaction computes the Dashboard from eight aggregate/preview queries, one server asOf and the existing Bangkok date metadata. A real separate committed update between queries is tested to prove snapshot consistency. Public previews omit notes/credentials/full Ticket bodies. Staff/Admin APIs reject Requesters, missing/inactive/password-change sessions and identity/query manipulation. Independent Prisma counts are compared with every status/priority/card filter and exact Queue totals for both roles.

Staff Queue now supports scope, owner=me/unassigned, nullable priority via UNSET, existing category/status/search/explicit ownerId, strict date/query/sort/pagination validation and stable ID ties. Count/rows share a snapshot. Its URL is authoritative through search/filter/sort/page changes, refresh and Back/Forward; filter changes reset page atomically. It has labeled keyboard controls, 10/25/50 sizes, empty/error/retry/out-of-range feedback and an internal scrollable table.

My Actions view-all is a paged Dashboard mode with page/size in the URL. One bounded authorized GET resolves a linked Action independently of Ticket list page one. The named public details/history dialog receives focus and supports Escape close; inaccessible links have generic feedback and explicit retry. New GET does not change Staff-only mutation rights or Requester ownership rules.

## PR #56 follow-ups

| Feedback | Actual disposition |
|---|---|
| Shared Requester handler switches on req.path | Replaced with separate explicit Dashboard/list handlers, extended for Staff/My Actions; shared role/error helpers retain authorization and safe output. Earlier Requester API regression passes. |
| Positive timezone offsets need encoded plus | api-spec.md now includes `%2B07%3A00` example and equivalent UTC Z. Transport test proves URLSearchParams retains +07:00 when decoded. |
| RoleRoute affects every protected route | tests.md/API/PR compatibility notes describe authenticated Access denied versus signed-out redirect. Two App regression cases verify protected-route behavior. |
| Confirm UI does not require removed-download 404 | Transport regression proves 410 rejects before blob handling. Removed rows hide Download/Remove; the generic error path handles non-2xx. The prior author's code-inspection response remains accurately distinguished from this new test. |

Compatibility is explicit: Queue pageSize=1 is replaced by supported 10/25/50 and its earlier fixture is updated. Unknown/repeated/invalid filters now reject 400 rather than permissive parseInt/ignored arguments. Explicit ownerId/category filters remain. A new read-only single-action endpoint supplements PATCH. No migration/dependency upgrade is introduced.

## Actual environment and results

Windows; native PostgreSQL **18.1**, existing isolated cluster on B: under local tmp/lab4-ui-verification/pg18-data, bound to **127.0.0.1:55434**. Guarded database **toktickit_lab4_verify_20261014_actions**. The same test database is used by API, fixtures and E2E. Original localdb/.env/Docker volumes were not reset, migrated or reseeded. Docker was not used or checked for these results. The owned test cluster was stopped after verification; postmaster.pid is absent.

| Check | Actual result | Bangkok time |
|---|---|---|
| Backend regression | **278/278**, 24 files; 65.83s | 19:24:12-19:25:19 |
| Server types + production build | Pass, exit 0 | 19:25:19 |
| Schema drift | No difference, exit 0 | 19:25:19-19:25:39 |
| Client regression | **93/93**, 19 files; 47.15s | 19:26:56-19:27:45 |
| Client TypeScript + production build | Pass, exit 0 | 19:27:45-19:27:50 |
| Chromium combined Actions/workflow/both dashboards | **32/32**, 6 files, one worker; about 1.9m | 19:26:29-19:28:23 |
| Client lint | Exit 0; two existing warnings in AuthContext/UserManagement, none in Dashboard/Queue | After final code checks |

Coverage added to #48: **34 backend** checks (32 Staff API + 2 zero-group unit), **21 client** checks (13 Staff/Queue + 4 transport + 2 linked-action + 2 RoleRoute), and **12 Staff/Admin E2E** cases. All earlier 20 combined Lab 4 E2E cases rerun unchanged.

Actual E2E includes card/list agreement, Queue page two/search/Back/reload, My Actions page two/reload, a target outside Ticket action-list page one with focused details, Admin Users navigation/zero assignments, Requester denial by UI and API, injected loading/500/retry/401, Staff first-password landing, plus **Staff and Admin separately at 320/390/768/1280px**. Each responsive case has long user names, an actual unassigned Ticket, real keyboard card activation and reachable internal Queue table scroll. No silent skip for empty results.

Runtime captures are local in `artifacts/lab-04/screenshots/staff-dashboard/{staff,admin}-{320,390,768,1280}.png`. Actual Admin 320px and Staff 768/1280px captures were inspected: long text/navigation wraps, cards remain within the page, focused links are visible. This is not a whole-product contrast/200% zoom certification. Images, reports, tmp scripts/DBs/logs remain uncommitted.

Local transcripts/results: tmp/lab4-staff-dashboard-verification/{backend,server-types,server-build,schema-drift,client-ui,client-types,client-build,e2e}.txt and matching .result.json; client-lint.txt, HTML report and failure artifacts in that same local directory.

## Reproduction

Use an isolated migrated/seeded toktickit_lab4_verify_* DB explicitly; never localdb. Native migration recovery tests need installed pg_dump/pg_restore. Stop unrelated app servers on 4000/5173 before Playwright, which refuses unknown running servers.

```powershell
$env:DATABASE_URL='postgresql://postgres:password@127.0.0.1:55434/toktickit_lab4_verify_20261014_actions'
$env:LAB4_PG_BIN='C:\Program Files\PostgreSQL\18\bin'

# server/
node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1 --fileParallelism=false
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc
node node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code

# client/
node node_modules/vitest/vitest.mjs run --maxWorkers=1 --fileParallelism=false
node node_modules/typescript/bin/tsc -b --noEmit
node node_modules/vite/bin/vite.js build
npm run lint

# e2e/, with the same explicit DATABASE_URL
node node_modules/@playwright/test/cli.js test --config lab4-staff-dashboard.config.ts
```

Local convenience runner additionally guards the exact DB name, redirects temp/cache to B: and records commands/times/exit codes. It is uncommitted and not required for reproduction.

## Failures and limitations

- Initial group test was red because staff-dashboard did not exist; implemented before recording green results.
- First focused client run: 22/23. The Location test helper used output, which itself has implicit status semantics, making the loading selector ambiguous. Replaced the test-only marker with a span; loading assertions remain.
- First full client run: 92/93. A new focus assertion used Playwright's toBeFocused name in jest-dom. Corrected to toHaveFocus; the actual focus requirement remains. Final **93/93** passed. Client failures did not change backend queries or acceptance rules.
- Chromium passed **32/32** in its first combined run. No assertion/timeout was weakened to manufacture a pass.
- Existing pg concurrent-query deprecation warnings and two lint warnings remain. No unsupported claim of warning-free execution, Docker recovery or production-scale performance.
- #50 still owns full earlier Labs 1-3 E2E, measured performance, whole-product zoom/contrast/accessibility and outstanding schema/readability hardening; #51 owns final README/report/release and merged-main verification. This PR must receive review and staging integration before #50 begins. No auto-merge.
