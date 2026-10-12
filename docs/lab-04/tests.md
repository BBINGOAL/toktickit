# Lab 4 Test Plan and Acceptance Traceability

Status: planned before implementation. All rows below are **Not run**. Paths are planned until their issue implements them; they are not links to existing test files. Baseline Lab 3 reported results are not Lab 4 passing evidence.

## Coverage and traceability

| Test ID | Type | FR / AC | What is tested | Expected result | Planned test file | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | FR-05 / AC-03, AC-06 | Action/Ticket transition matrices and resolution predicate | Every allowed edge passes; other edges and same-state writes reject | server/tests/lab-04/workflow-rules.test.ts | Not run |
| UNIT-02 | Unit | FR-02 / AC-03 | Trim/limits, date offsets/bounds, completion result, follow-up note | Valid boundary accepted, missing/invalid values rejected | server/tests/lab-04/action-validation.test.ts | Not run |
| UNIT-03 | Unit | FR-09, FR-10 / AC-10, AC-11 | ACTIVE set, seven local dates and midnight UTC conversion | Exact predicates and inclusive bounds, including empty counts | server/tests/lab-04/dashboard-rules.test.ts | Not run |
| API-01 | API | FR-01, FR-02 / AC-01, AC-04 | Create by Staff/Admin, separate actor/assignee/owner and multiple contributors | Correct FK, immutable actor, no owner replacement | server/tests/lab-04/actions-taken.api.test.ts | Not run |
| API-02 | Authorization | FR-03 / AC-02 | No session, Requester write, other owner's reads and first-login/inactive session | 401/403, no mutation or leaked content | server/tests/lab-04/actions-taken.api.test.ts | Not run |
| API-03 | API | FR-05 / AC-03 | Bad date/text/follow-up/result, inactive/non-staff assignee and malicious actor fields | 400 field errors; no partial action/event | server/tests/lab-04/actions-taken.api.test.ts | Not run |
| API-04 | Workflow | FR-01, FR-07 / AC-03, AC-05 | Assign/start/edit/complete/cancel, terminal locks and no DELETE | Valid lifecycle, immutable history, terminal edit 409, DELETE 405 | server/tests/lab-04/actions-taken.api.test.ts | Not run |
| API-05 | API | FR-07 / AC-04, AC-05 | Equal action/event timestamps, pagination ties and event payload privacy | Deterministic ID tie-break, no notes/credentials | server/tests/lab-04/actions-taken.api.test.ts | Not run |
| API-06 | Workflow | FR-05 / AC-06 | Every Ticket edge per role plus missing resolution owner/summary/completed work and pending/follow-up work | Exact matrix, backend gate even when bypassing UI | server/tests/lab-04/ticket-workflow.api.test.ts | Not run |
| API-07 | Workflow | FR-06 / AC-07 | Advisory indication, repeated indication, reopen/new cycle and old work | Status unchanged; no duplicate event; old actions cannot resolve new cycle | server/tests/lab-04/ticket-workflow.api.test.ts | Not run |
| API-08 | Workflow | FR-05, FR-07 / AC-03, AC-06, AC-07 | Follow-up predecessor chain, completed successor, cancellation of unfinished work | Correct gate; cross-ticket/cycle links reject; cancellation/events atomic | server/tests/lab-04/ticket-workflow.api.test.ts | Not run |
| API-09 | Concurrency | FR-07 / AC-08 | Two same-version editors, action-create versus Ticket resolve, assignee deactivation | One consistent winner; loser conflicts; no lost state/orphan audit | server/tests/lab-04/concurrency.api.test.ts | Not run |
| API-10 | Retry | FR-08 / AC-09 | Same create/status key sequentially and concurrently, changed payload and different user | One mutation/event; exact replay; unsafe reuse 409 | server/tests/lab-04/idempotency.api.test.ts | Not run |
| API-11 | API | FR-09, FR-11 / AC-10 | Requester populated/zero metrics, ownership, recent/resolved window and exact drill-down | DB query/count match and no cross-owner data | server/tests/lab-04/requester-dashboard.api.test.ts | Not run |
| API-12 | API | FR-10, FR-11 / AC-11 | Staff/Admin groups, unset priority, current assignee actions, previews and view-all | Exact counts/zero keys, <=5 previews, role denial | server/tests/lab-04/staff-dashboard.api.test.ts | Not run |
| API-13 | API | FR-15 / AC-16 | Query filters, stable sorts/page boundaries and invalid pagination/date/owner inputs | All card matches reachable; invalid requests 400 | server/tests/lab-04/drill-down.api.test.ts | Not run |
| API-14 | Failure | FR-13 / AC-08, AC-14 | Inject transaction/query failure and inaccessible/missing resources | Rollback/no partial event, safe 500/403/404 | server/tests/lab-04/safe-failure.api.test.ts | Not run |
| MIG-01 | Migration | FR-12 / AC-12 | Upgrade disposable Lab 3 DB with users/tickets/attachments/comments/notes | Exact legacy data/relations preserved; zero-action default and resolvedAt approximation documented | server/tests/lab-04/migration.integration.test.ts | Not run |
| MIG-02 | Recovery | FR-12 / AC-12 | Dump before migration; restore separate DB; run Lab 3 checks | Counts/content match backup and baseline remains runnable | server/tests/lab-04/recovery.integration.test.ts | Not run |
| SEED-01 | Integration | FR-12 / AC-13 | Seed twice over custom password/role/inactive/status data | No reset/duplication, required representative data present | server/tests/lab-04/seed.integration.test.ts | Not run |
| UI-01 | Component | FR-01, FR-02 / AC-01, AC-03, AC-14 | Action list/create/edit, auto actor, active options and conditional required fields | Correct modes and field feedback | client/src/lab-04-tests/ActionsTaken.test.tsx | Not run |
| UI-02 | Component | FR-03, FR-07, FR-08 / AC-02, AC-05, AC-09, AC-14 | Requester read-only/terminal display, duplicate click, 409/500 and draft recovery | No forbidden controls/duplicate requests; input retained | client/src/lab-04-tests/ActionsTaken.test.tsx | Not run |
| UI-03 | Component | FR-05, FR-06 / AC-06, AC-07, AC-14 | Allowed transitions, gate, summary/reason, advisory and conflict refresh | Controls match API, state refresh and advisory wording correct | client/src/lab-04-tests/TicketWorkflow.test.tsx | Not run |
| UI-04 | Component | FR-09, FR-11 / AC-10, AC-14 | Requester cards/links, window, previews and loading/zero/403/500 | Bounded API values displayed; correct URLs; no false zero during load | client/src/lab-04-tests/RequesterDashboard.test.tsx | Not run |
| UI-05 | Component | FR-10, FR-11 / AC-11, AC-14 | Staff/Admin cards/groups/My Actions pagination and all feedback | Current-user actions/filters/zero labels and safe retry | client/src/lab-04-tests/StaffDashboard.test.tsx | Not run |
| UI-06 | Component | FR-15 / AC-16 | Queue/My Tickets URL filters, sorting, page reset and pagination | Filters survive navigation and all matches accessible | client/src/lab-04-tests/DrillDown.test.tsx | Not run |
| STYLE-01 | Style | FR-14 / AC-15 | Tokens, text status cues, contrast, editable/read-only and private/shared distinction | Zen Green consistency and measurable readable contrast | client/src/lab-04-tests/ZenGreen.test.tsx plus actual visual inspection | Not run |
| A11Y-01 | UI/E2E | FR-14 / AC-15 | Card links, labels/errors, keyboard, focus trap/Escape/restore, zoom 200% | No keyboard trap/hidden focus; correct accessible names | client/src/lab-04-tests/Accessibility.test.tsx; e2e/lab-04/responsive-accessibility.spec.ts | Not run |
| E2E-01 | E2E | FR-01, FR-03 / AC-01, AC-02, AC-03, AC-04, AC-05 | Two staff, one Ticket, create/assign/edit/start/complete/cancel and Requester view | Multiple contributions visible; owner preserved; role rules enforced | e2e/lab-04/actions-taken-flow.spec.ts | Not run |
| E2E-02 | E2E | FR-05, FR-06 / AC-06, AC-07, AC-08 | Failed gate, follow-up, valid resolve/close/reopen and stale edit | Complete lifecycle and new-cycle safety | e2e/lab-04/ticket-resolution.spec.ts | Not run |
| E2E-03 | E2E | FR-09, FR-10, FR-11 / AC-10, AC-11, AC-16 | Both dashboards, exact DB metric comparison and drill-down | Correct scope/counts and linked detailed views | e2e/lab-04/dashboards.spec.ts | Not run |
| E2E-04 | E2E | FR-08, FR-14 / AC-09, AC-14, AC-15 | Delay/double-click, 404/403/injected500, conflict and form drafts | No duplicate/lost draft; explicitly labeled injected failures | e2e/lab-04/failure-states.spec.ts | Not run |
| RESP-01 | Responsive | FR-14 / AC-15 | Dashboards and action list/form at 390/768/1280 plus 320 and zoom smoke | No page overflow/clipping/overlap; reachable table controls | e2e/lab-04/responsive-accessibility.spec.ts | Not run |
| REG-01 | Regression | FR-13 / AC-16 | All existing Labs 1-3 unit/API/UI tests updated for versioned requests | Earlier capabilities remain correct | server/tests/lab-01,lab-02,lab-03; client/src/lab-02-tests,lab-03-tests; client/src/App.test.tsx | Not run |
| REG-02 | E2E regression | FR-13 / AC-16 | Auth/password gate, Requester create/list/detail/files/comments, Staff notes/queue, Admin accounts | Real app scenarios pass with disposable fixtures | e2e/lab-02; e2e/lab-03; e2e/lab-04/legacy-regression.spec.ts | Not run |
| PERF-01 | Performance smoke | FR-11 / AC-17 | Warm dashboards on 1000 Tickets/3000 actions, 20 sequential requests per role | <=50KB JSON, <=12 DB queries/request, p95 <=1000ms on documented local hardware | server/tests/lab-04/dashboard-performance.test.ts | Not run |
| REL-01 | Release | FR-16 / AC-18 | Contract precedes feature PRs, peer approvals, final main builds/tests and report | Actual SHAs/results/links and truthful documentation | GitHub PR records; local verification transcripts | Not run |

## Execution strategy

For each feature: write the meaningful acceptance tests before/alongside implementation, observe relevant failure where practicable, implement, then run targeted tests and touched earlier regressions. No application test executions are required for this documentation-only issue. Contract validation checks FR/BR/AC references, test mapping, file links and the reviewed diff.

Use isolated databases named `toktickit_lab4_verify_*`. Update shared E2E/test helpers to explicitly accept those and existing Lab 3 verification DBs. API and E2E must use the same database. Never run migration/recovery/seed suites against localdb. Generate Prisma Client after migration. Fixtures clean only their own records in FK order; physical uploads are removed only when created by the test. Frozen server clocks and deterministic fixtures cover recent-window/date ties.

Before staging release: server build/type checks, client build/type/lint, all unit/API/UI suites, migration/recovery/seed tests and application-only E2E. Repeat required release checks on actual merged main. External example.spec.ts is not application evidence. Capture command, exit code, SHA, environment, timestamp and output. Do not reuse Lab 3 pass counts as current results.

Performance smoke runs separately to avoid parallel CPU noise. Document machine/Docker/PostgreSQL versions, warmup and fixture sizes. If a threshold fails, investigate query/payload behavior and record the result; do not silently weaken thresholds to manufacture a pass. No load/production-scale guarantee is implied.

## Final evidence

Keep runtime screenshots and test-output images locally, excluded from commits. Main transcripts, actual metrics versus SQL/Prisma checks, migration/recovery comparison and actual visual checklist feed the Part 1-9 PDF. Update each row from Not run only after execution; record failures and reruns accurately. Planned paths may change with implementation, but update this mapping in the same PR.
