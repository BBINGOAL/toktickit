# Lab 4 Final Regression and Product Hardening Verification

Issue [#50](https://github.com/BBINGOAL/toktickit/issues/50), branch `feature7/lab4-final-hardening-regression`. Started on 2026-10-29 only after the student's continue instruction and verified reviewed PR #57 staging merge `85a06ed67f7a30bc06ae605c8e7031bea1de0cf6`. This is feature-branch verification, not final-main release evidence.

Submitted as [PR #58](https://github.com/BBINGOAL/toktickit/pull/58) into lab4-staging, Development-linked to #50. PpAnpt is requested; actual review is pending. Incremental commits separate regression tests, link/component work, performance tests/optimization, legacy UI, full E2E, evidence and PR metadata. Subsequent evidence/metadata commits do not alter the tested application source.

## Environment and isolation

Windows x64, Node v24.14.0, native PostgreSQL 18.1, AMD Ryzen 5 7535HS (12 logical CPUs), 15.32 GiB RAM. The existing owned B: test cluster runs on `127.0.0.1:55434`; database `toktickit_lab4_verify_20261014_actions`. The owned test cluster was stopped cleanly after verification; postmaster.pid was absent. No original localdb, .env, Docker volume or report asset was reset or staged. Docker recovery is not claimed.

Tests use one worker. Database/migration/seed tests require an explicit isolated Lab 4 DB; recovery uses installed PostgreSQL binaries through LAB4_PG_BIN. E2E starts its own API and Vite servers with reuseExistingServer=false and the same database. Generic external example.spec.ts is excluded; all application specs under e2e/lab-02, lab-03 and lab-04 are included.

## Changes and review follow-up

| Source | Implemented disposition |
|---|---|
| PR #57 malformed action link | Client validates positive safe integer syntax before GET, uses link-specific error feedback and clears stale link errors on navigation. Server validation and non-enumerating ownership checks remain authoritative. |
| PR #57 dialog close URL | Close/Escape removes only actionId using router replace. Unrelated query values and history length are preserved; reload does not reopen. Component and real-browser regressions cover both paths. |
| PR #57 unused Staff windowStart | Kept compatible metadata; api-spec explicitly says Staff metrics/previews are all-time predicates and do not use this as a seven-day filter. |
| PR #57 snapshot/current Queue | Cards already showed asOf; added adjacent explicit wording that Queue/My Actions links fetch current data and may change after the snapshot. |
| PR #54 large ActionsTaken | Split list, editor, details, history, pager and presentation; share one accessible Dialog. Existing lifecycle/draft/idempotency/focus tests remain. |
| Earlier app hardening | Accessible Admin and removal dialogs, dirty-draft confirmation, pending locks, latest-search response guard, labelled comments/private notes, safe errors/retry, retained inputs, keyboard upload button and responsive forms. |
| Create Ticket partial failure | After a successful Ticket save and failed file upload, keep the success number and upload warning/navigation instead of offering a second creation submission. E2E injects a real HTTP 500 only for upload and verifies the saved Ticket remains in My Tickets. |
| Rendered contrast/zoom | Darker role badge, hint/warning/active-user text and attachment counter; responsive detail/create grids; dialog height relative to its backdrop so 200% CSS zoom stays inside the viewport. |

No JWT revocation feature is claimed: preserved Lab 3 logout clears the cookie. Regression verifies cookie removal and unauthenticated me=401; first-password restriction, DB-backed current role/activity, private-note denial and cross-owner 404 are exercised separately.

## Actual checks

All times below are Asia/Bangkok on 2026-10-29. Raw transcripts, result JSON, traces and images remain local under tmp/lab4-hardening-verification and artifacts/lab-04/screenshots; they are not committed.

| Check | Result | Time / scope |
|---|---|---|
| Backend unit/API/concurrency/migration/seed/recovery regression | **278/278**, 24 files | 20:55:54-20:56:42; separate performance file excluded from this run |
| Performance smoke | **1/1**, 1 file | 21:16:22-21:16:26; run separately without other suites |
| Client component/transport regression | **109/109**, 20 files | 21:16:40-21:17:22 |
| Server types and production build | Pass | After backend change; source/seed type configuration and production tsc |
| Client types and production build | Pass | After frontend changes; final CSS build recorded below |
| Prisma schema drift | None, exit 0 | Existing migrations/schema retained |
| Client lint | Exit 0 | One existing AuthContext only-export-components warning; UserManagement dependency warning removed by the guarded effect |
| Chromium all application E2E | **49/49**, 14 files | 21:28:24-21:30:19; all earlier app specs plus Lab 4; no retries |
| Focused accessibility | **3/3** | 21:28:06-21:28:24; final theme/contrast and 200% dialog bounds |

Backend total is **279 tests across 25 files in two sequential runs**, not one combined invocation. Client and browser suites are separate evidence; none of these numbers is a final-main result.

Reproducible commands (from the listed directory; set the isolated DATABASE_URL/JWT_SECRET and LAB4_PG_BIN first):

```text
server: node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1 --fileParallelism=false --exclude **/dashboard-performance.test.ts
server: node node_modules/vitest/vitest.mjs run tests/lab-04/dashboard-performance.test.ts --pool=threads --maxWorkers=1 --fileParallelism=false
client: node node_modules/vitest/vitest.mjs run --maxWorkers=1 --fileParallelism=false --reporter=dot
client: node node_modules/typescript/bin/tsc -b --noEmit
client: node node_modules/vite/bin/vite.js build
client: node node_modules/oxlint/bin/oxlint
server: node node_modules/typescript/bin/tsc
server: node node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
e2e: node node_modules/@playwright/test/cli.js test --config lab4-hardening.config.ts
```

The local orchestration script redirects temporary files and logs to B:, sets TZ=Asia/Bangkok, guards the exact verification DB/host/port, records start/end/exit codes and runs each requested job serially. It is not a repository dependency or a committed report script.

## Measured dashboard smoke

Fixture adds **1000 Tickets and 3000 Actions** to the guarded test DB while retaining its existing demo rows. It covers all eight Ticket states, HIGH/MEDIUM/LOW/UNSET, owned/unassigned Tickets and both pending/finished action states. Cleanup discovers only its random prefix, removes FK children first, then its users. Each role gets two warmups and 20 sequential HTTP requests; timing includes authentication, database work, JSON and local HTTP. SQL is counted at pg Client.query, including auth, BEGIN/isolation and COMMIT. A >0 assertion prevents a silent instrumentation pass.

| Role | p95 ms | Maximum SQL/request | Maximum JSON bytes |
|---|---:|---:|---:|
| Requester | 11.11 | 10 | 2953 |
| IT Staff | 19.94 | 12 | 5240 |
| Administrator | 17.36 | 12 | 5238 |

Contract limits remain <=1000 ms p95, <=12 SQL statements and <=51200 bytes. First real measurement found Staff=13 queries; an additional Ticket relation fetch caused the excess. The five-row parameterized JOIN removes that lookup while retaining role scope, the same active-parent/assignee/state predicates, stable ties and repeatable-read snapshot. Independent metric/drill-down and concurrent-snapshot regression still pass. Thresholds were not changed. Results are local smoke evidence, not a load or production capacity claim.

## Schema/index review from PR #53

Read actual pg_indexes: Ticket has requesterId and ownerId single-column indexes as well as requesterId/status and ownerId/status composites. They are candidates for consolidation, but no index is dropped in this issue: existing earlier read paths remain, and the representative workload already meets its budget. This review does not claim an EXPLAIN/production workload comparison proved the single-column indexes useless.

No CHECK migration is added. Field/state/eligibility/date rules are enforced at the transactional application write boundary and covered by API/direct-request/concurrency tests; cross-record owner/assignee/current-cycle conditions cannot be represented by a simple row CHECK. Extra row-level constraints are possible defense in depth, not a claim that raw privileged SQL is prevented. Avoid modifying already-applied migrations or adding a partial, unreviewed schema rule in this hardening PR. FKs, enum types, unique idempotency scope and versioned writes remain. This is the explicit disposition of the optional suggestion, not a silently unfinished migration.

## Responsive, visual and accessibility scope

Product browser checks cover Login plus Requester Dashboard/My Tickets/Create Ticket/Detail, Staff Dashboard/Queue/Detail and Admin Dashboard/Queue/Detail/Users. Real populated fixtures are used. Each page is checked at **320,390,768,1280 CSS px** for page overflow and reachable navigation. Existing Lab 4 specs additionally exercise long unbroken names, internal table scrolling, action modes and keyboard card navigation.

The new resize smoke applies **CSS zoom=2 at a 1280x900 browser viewport** and verifies it is applied. It checks navigation and page overflow, plus dialog x/y/width/height, focus/escape/restoration for Action and Admin forms. This is an automated CSS enlargement/reflow test, not a claim that native Chrome menu zoom, every browser or every assistive technology was tested. Earlier responsive assertions and the dialog bounds are retained.

Rendered solid-text contrast uses the [W3C minimum contrast rules](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) (4.5:1 normal / 3:1 large). It audits visible text and ancestor solid backgrounds, excluding disabled controls, hidden content and decorative text. It is not a complete WCAG certification, image/gradient/opacity audit or screen-reader assessment. Resize intent is guided by [W3C Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text). Statuses and private/shared sections retain text cues.

Real captures are produced locally in artifacts/lab-04/screenshots/hardening, including 200% action/user dialogs. Actually opened final Requester Create Ticket, Staff Action dialog and Admin user dialog at 200%. Green/outlined buttons, readable labels/focus and bounded internal dialog scrolling were inspected; native menu zoom remains outside this check. Report images and PDFs remain excluded from commits.

## Failures and corrections

1. New linked-action tests were run red: **8 failed, 21 passed**. Invalid IDs were fetched, link errors persisted after removing the parameter, and Close/Escape did not call a route cleanup callback. The final mocked endpoint default returns a valid promise, so failures demonstrate behavior rather than an undefined mock. All 29 Action interface tests then passed.
2. Initial performance harness imported a named app export; corrected to the actual default export before measuring. The next run exposed the genuine 13-query budget failure above. Cleanup ran after both failed attempts.
3. Earlier E2E first run: **5 failed, 4 passed**, all five stopped at obsolete post-login /tickets or /staff/tickets assertions. Updated expectations to Lab 4 Dashboard landing, then still navigate to and exercise the old pages. Second run had **2 failed, 7 passed** due to duplicate My Tickets links; scoped selectors to the named application navigation. No product assertion was removed.
4. During legacy UI refactoring, an adjacent-JSX error in the upload branch and a missing useRef import were corrected. One run also reported a worker startup timeout; no timeout was increased. Final source types/builds and all 109 client tests pass.
5. First full browser run: **46 passed, 3 failed** on the same attachment counter contrast of **4.39:1**. Darkened that counter; the same 4.5:1 threshold then passed.
6. Strengthened 200% coverage to check modal bounds, not just page overflow. The next full run: **47 passed, 2 failed** because the Action dialog top was -418 px. Replaced viewport-unit max-height with a constrained backdrop grid and percentage height; the unchanged bound checks then passed for all three roles.

7. Opening real captures after an earlier 49/49 pass exposed Bootstrap loading after index.css: buttons were blue/gray despite the intended Zen Green tokens. Loaded Bootstrap first and added computed-color assertions for primary/secondary Create Ticket buttons. Restoring the actual page background exposed breadcrumb contrast 4.42:1 and Admin subtitle 4.49:1; darkened both instead of rounding the threshold. Focused 3/3 and final full 49/49 then pass on the final theme.
8. One focused browser invocation was started before an earlier run released port 4000; reuseExistingServer=false rejected it. Waited for that owned run to finish, then ran focused/full suites sequentially; no unrelated server was reused or stopped.

Existing pg concurrent-query deprecation and NO_COLOR/FORCE_COLOR notices remain in test logs; they are not hidden or counted as application assertion failures. There are no dependency upgrades or retries added to obtain passing results.

## Release boundary

Review and merge this issue PR into lab4-staging before #51 starts. README consolidation, actual final-main reruns, student-authored reflection/peer identity completion, report assembly and staging-to-main release remain #51. Do not mark those complete from feature-branch evidence.
