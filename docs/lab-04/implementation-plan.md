# Lab 4 Implementation Plan

Status: #44/#45/#46 integrated through reviewed PRs #52/#53/#54; latest staging merge 10dd684. #47 Ticket Workflow is In review through PR #55 from feature4/lab4-ticket-workflow-resolution; PpAnpt requested after backend 209/209, UI 61/61 and Actions/workflow E2E 13/13. #48-#51 have not started. See workflow-verification.md for isolated native PostgreSQL 18.1 results; Docker recovery is not claimed.
Source: `SE+Lab+4.md`. Baseline: Lab 3 main commit `2b8531b`.

## Sprint goal

Complete Actions Taken, the Ticket lifecycle, and role dashboards while preserving Labs 1-3 data and behavior. Deliver verified source on main and one concise PDF with Answer Part 1-9.

## Git and issue decomposition

Use one feature branch and one reviewed PR per issue. Total: **8 issues**, GitHub #44-#51 respectively for rows 1-8 below. Commit in meaningful steps, request PpAnpt review for each completed issue PR, and wait for approval and staging integration before starting the next issue.

Flow: `main -> lab4-staging -> featureN/lab4-* -> PR into lab4-staging -> final PR into main`.
Create subsequent feature branches from the latest integrated staging commit. Run targeted tests with each feature, all regression on staging, and final verification on merged main.

| No. | Proposed issue title | Branch | Scope and acceptance |
|---|---|---|---|
| 1 | Lab4 Sprint 4 Engineering Contract | `feature1/lab4-sprint4-engineering-contract` | Write specification.md, api-spec.md, ui-spec.md and tests.md before feature implementation; numbered FR/BR/AC, role matrix, workflow, metric formulas, decisions and Product DoD. |
| 2 | Lab4 Actions Taken Foundation and Migration | `feature2/lab4-actions-taken-foundation-migration` | Add model, preserved-data migration, safe idempotent seed, authorized create/list/update/assign/lifecycle API, concurrency and retry handling; API and migration tests. |
| 3 | Lab4 Actions Taken UI | `feature3/lab4-actions-taken-ui` | Ticket Detail list/create/edit/assign/complete/cancel; auto actor; requester read-only visibility; validation, failure preservation, responsive and component/E2E tests. |
| 4 | Lab4 Ticket Workflow and Resolution | `feature4/lab4-ticket-workflow-resolution` | Final transition matrix, resolution gate, advisory requester flag, atomic stale-update checks, append-only history, permitted controls, API/UI/E2E tests. |
| 5 | Lab4 Requester Dashboard | `feature5/lab4-requester-dashboard` | Backend-owned metrics and recent tickets, ownership enforcement, dashboard navigation, filtered drill-down, all feedback states, API/UI/E2E tests. |
| 6 | Lab4 IT Staff and Administrator Dashboard | `feature6/lab4-staff-dashboard` | Operational counts, current-user Actions Taken, recent/urgent tickets, staff/admin access and drill-down; metric/query comparison and API/UI/E2E tests. |
| 7 | Lab4 Final Regression and Product Hardening | `feature7/lab4-final-hardening-regression` | Labs 1-3 regression, Staff Queue sorting/pagination, stable ordering, retry/double-submit, security, accessibility, responsive/style inspection, performance smoke and failure states. |
| 8 | Lab4 Documentation Evidence and Release Integration | `feature8/lab4-docs-release` | README, actual test traceability, real review records and AI reflection, screenshots, concise MD/PDF Answer Part 1-9, staging release checks and post-merge main evidence. |

Kanban: Backlog -> Ready -> In progress -> In review -> Done. Done requires acceptance tests and reviewed integration. Release issue stays open until final main verification succeeds. All issues #44-#51 are on the existing private Project 4: #44/#45/#46 Done; #47 In review linked to PR #55; #48-#51 Backlog. Projects permission has been granted. Do not mark issues Done merely because a PR is open.

## Must-have versus stretch and complexity limits

The eight issues are reviewable work packages, not a promise that every package is small. Lab 4 is the authority for new requirements; Lab 3 supplies preservation/security constraints. Review highlighted complexity added by our own design choices. Distinguish required product outcomes from the minimal mechanisms selected by this contract:

| Area | Must-have delivery / minimum selected mechanism | Owner issue | Stretch: not required or scheduled |
|---|---|---|---|
| Retry protection | One persistent unique-key response record for action creation and Ticket status requests; no generic platform | #45 foundation, #47 workflow | Global middleware for all APIs, key-expiry workers, distributed cache/queue |
| Concurrency | Version check and one parent-Ticket transaction; short User eligibility locks coordinated with admin changes; safe bounded conflict handling | #45 foundation, #47 workflow; relevant admin regression in #50 | Application-wide lock framework, distributed locks or automatic merge of drafts |
| Follow-up | Existing same-Ticket/cycle predecessor relation and a small cycle-safe completion predicate | #45 data/validation, #47 gate | Graph editor, dependencies across Tickets, scheduler/notifications or assignment engine |
| Reopening | Integer workCycle to ensure old completed work cannot silently satisfy a new resolution | #45 field, #47 behavior | Parallel work branches, configurable cycle engine or historical snapshot browser |
| Append-only evidence | Two small immutable event models and paginated read-only history endpoints; plain list UI | #45 action history, #47 Ticket history | Event-sourcing architecture, replay/rebuild engine, export/report builder |
| Dashboards | Exact counts, bounded previews, matching drill-down, Requester/Staff role checks | #48, #49 | Extra Admin account cards, charts, custom reporting or advanced BI |

These mechanisms are **contract design choices**, not claims that the handout mandates those exact tables/locks/fields. They remain in the current acceptance contract so documents/API/tests do not contradict each other. If implementation shows they are disproportionate, propose a simpler mechanism and update affected BR/API/AC/test rows for peer review before changing the scope. Never silently demote duplicate prevention, stale-write safety, historical attribution or required rubric evidence to stretch. Optional items above must not delay required delivery.

## Existing implementation and work to preserve

- React/TypeScript, Express, PostgreSQL and Prisma remain the stack; reuse authentication, role middleware, design tokens, Ticket Detail, attachments, comments and notes.
- TicketStatus already contains all eight required values. Existing backend transition checks are a starting point; current status update reads then writes without a version check and has no Actions Taken resolution gate.
- Actions Taken and dashboards do not exist yet. Requester resolution indication already exists and must remain advisory.
- Staff Queue currently fetches page 1 with pageSize 50; add sorting/pagination so dashboard drill-down can expose all matching data.
- Issue #45 changed seed upserts to update: {}: repeat seed preserves existing user credentials, roles, activity, names and Tickets, and creates demo records only when absent. Rerunning seed is not a demo-password/account reset operation. Use authorized account-management operations to change credentials.
- Existing E2E database guard accepts Lab 3 verification names only. Extend test configuration safely to explicitly allow isolated Lab 4 verification databases and ensure API/tests use the same DB.

## Proposed contract decisions to finalize in issue 1

The handout lists simple action fields in sections 4/8 but its submission rubric also requires assign, status transition, complete, cancel, inactive-assignee rejection, stable ordering and append-only behavior. Cover all of these explicitly rather than treating an action as only a free-text comment.

1. Action Taken: ticketId, actionDateTime, description, result, performedById (authenticated actor), assigneeId (separate active IT Staff/Admin), followUpRequired, followUpNote, attachmentNotes, status, createdAt, updatedAt and integer version. Proposed states: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED. The final spec defines required fields and allowed transitions for each state.
2. Requesters see every Action Taken on their own tickets, read-only. Staff/Admin can work on accessible tickets without being the primary Ticket Owner. Backend rejects requester writes, cross-owner reads and inactive/non-staff assignment.
3. Keep action records; no hard-delete endpoint. Record edits and transitions in append-only audit events with actor and before/after state. Order actions deterministically by actionDateTime and id; history by timestamp and id. Current editable state and immutable history are distinct.
4. Resolution gate: active Staff/Admin Ticket owner, nonblank summary, completed action/result and no unfinished work or unresolved follow-up in the current work cycle. Reopen starts a new cycle. Linked completed follow-up actions resolve earlier follow-up requirements. Cancelled actions do not qualify. Requiring at least one completed action is our stricter product choice: legacy active zero-action Tickets need documented work before a new resolution; old resolved/closed records stay valid without fake backfill actions. See specification.md sections 7/11 and updated regression fixtures.
5. Start from the Lab 3 transition matrix and document every role and transition, including reopening closed/cancelled tickets. Clear stale advisory resolution flags when work is reopened. Final approval of these product choices belongs in the contract.
6. Use atomic version comparisons and transactions for workflow/action changes and append-only events; return 409 on stale updates with refresh/retry guidance. Use request idempotency keys for action creation so retried requests cannot create duplicate actions.
7. Store timestamps in UTC; interpret displayed dates and dashboard windows in Asia/Bangkok. Define a seven-calendar-day recent window, exact boundaries, asOf timestamp, small bounded recent lists, and deterministic tie-break ordering.
8. Proposed Requester cards: active tickets (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED), waiting-for-requester tickets, recently updated tickets, recently resolved tickets. A status-history event supplies the resolution date; document legacy fallback and avoid presenting updatedAt as an exact historic resolution timestamp.
9. Proposed Staff cards: unassigned active tickets, my active tickets, counts by status/IT priority (including unset priority), my unfinished actions, recent/urgent tickets. Administrator reuses Staff Dashboard. Every count has the same predicate as its drill-down query.

## Database, API and UI approach

- Additive migration only: action and audit models plus version fields with safe defaults. Preserve Users, Tickets, Attachments, Public Comments and Internal Notes. Explain at least two choices: separate ticket owner/action assignee relationships and indexed/versioned records with append-only audit history.
- Test upgrade using a disposable database populated with Lab 3 records, compare record counts/relations/content before and after, test repeat seed, and rehearse documented backup/restore recovery in another disposable database. Never reset or reseed the student's localdb.
- Proposed routes: GET/POST `/api/tickets/:id/actions`, PATCH `/api/tickets/:id/actions/:actionId`, and GET `/api/dashboards/requester` and `/api/dashboards/staff`. Reuse existing status endpoint with version/resolution validation; document compatibility with old callers and tests. Contract fixes exact paths, payloads, error codes and limits before implementation.
- Dashboard APIs return aggregates and bounded summaries, never full collections. Add matching queue/My Tickets filters and preserve URL query parameters for drill-down.
- Reuse Zen Green components and add role-specific Dashboard navigation. Use semantic labels, keyboard-accessible forms/modals, visible focus and non-color status cues. Preserve entered form data on recoverable failures.

## Verification and deliverables

Create `docs/lab-04/{specification,api-spec,ui-spec,tests,reviewer,ai-use}.md`. Each AC maps to planned test IDs, real test-file paths and actual final results. No fabricated reviews, approvals or passing evidence.

- Unit: workflow predicates, dashboard/date rules, input validation.
- API/integration: actions authorization/ownership, inactive assignee, transitions/gate, concurrent writes, idempotency, scoped dashboards and metric queries.
- Migration/regression: preserved legacy records and zero-action tickets, repeat seed, backup/restore, all existing app tests.
- UI/style: forms, action states, dashboard drill-down and query state, loading/empty/forbidden/conflict/not-found/failure, keyboard/focus and modal behavior.
- E2E: actions-taken-flow.spec.ts, ticket-resolution.spec.ts and dashboards.spec.ts plus earlier app flows; create own disposable fixtures and clean only those fixtures.
- Responsive evidence: desktop/tablet/mobile for Staff Dashboard, Requester Dashboard and Actions Taken list/form. Save real captures under `artifacts/lab-04/screenshots/` with the visual/accessibility checklist.
- Performance smoke: bounded dashboard responses and query count, indexed queries on a documented representative dataset; set measured thresholds in the contract rather than claim production-scale performance.
- Final verification: server/client type/build checks, unit/API/UI suites and application-only E2E on main. Keep generic external Playwright examples separate from app coverage. Produce real transcripts, metric-versus-database comparisons and the single PDF.

## Implementation order

1. Complete and review issue 1 contract/test plan; record its commit before implementation PRs.
2. Deliver foundation/migration, then Actions UI and Ticket Workflow.
3. Deliver Requester Dashboard, then Staff Dashboard, with query-compatible drill-down.
4. Complete hardening/regression and visual inspection.
5. Finish review/reflection/evidence, integrate staging into main, then rerun final verification and update the report with actual main results.

Excluded: SLA/escalation, external notifications, inventory/cost/billing, multilevel approvals, advanced BI, multitenancy/cloud operations and unrelated new product features.
