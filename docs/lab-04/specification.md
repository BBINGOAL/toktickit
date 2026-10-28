# Lab 4 Specification: Actions Taken, Dashboards and Final Regression

Status: PpAnpt approved commit 02420fc on 2026-10-14; the revised contract was merged through PR #52 into lab4-staging at 7922e0e. Implementation and final-main verification follow the staged issue plan.
Baseline: Lab 3 `main` commit `2b8531b`. Source: SE Lab 4 handout, sections 1-14.
This document specifies intended behavior; it does not assert that features or tests already pass.

## 1. Sprint Goal

Complete the service-desk workflow with accountable Actions Taken, validated Ticket resolution, and role dashboards, while preserving earlier data and making the complete application demonstrable on desktop, tablet and mobile.

## 2. Stakeholder Request

Staff need to record and coordinate actual work on a Ticket, including contributions from people other than its primary owner. Requesters need a concise view of their own work and attention required. Staff need accurate operational summaries linked to the detailed screens. Earlier authentication, collaboration and administration must keep working.

## 3. Scope

Included: Actions Taken with assignment/lifecycle/audit, final Ticket transitions, authoritative dashboards, additive migration and repeat-safe seed, concurrency/retry handling, regression, Zen Green responsive/accessibility polish and final documentation.

Excluded: SLA clocks/escalation, external notifications, inventory/purchasing/cost accounting, billing/payroll, multilevel approvals/signatures, advanced BI/report exports, multitenancy and cloud operations. Attachment Notes describe files already attached to the Ticket; they are not a new file-storage feature.

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Staff/Admin shall list, create, assign, edit, start, complete and cancel Actions Taken on accessible Tickets. |
| FR-02 | Actions shall store action date/time, description, result, auto performer, follow-up flag/note and attachment notes. |
| FR-03 | Requesters shall read all Actions Taken on their own Tickets and shall not change actions. |
| FR-04 | Different staff may perform actions without changing the Ticket's primary owner. |
| FR-05 | Backend shall enforce action and Ticket state transitions, assignment rules and the resolution gate. |
| FR-06 | Requester resolution indication shall remain advisory; formal resolution requires Staff/Admin. |
| FR-07 | Backend shall reject stale writes and preserve append-only action/Ticket history and deterministic ordering. |
| FR-08 | Repeated action-create requests shall not create duplicates; recoverable UI failures shall preserve entered data. |
| FR-09 | Requester Dashboard shall return only current-user metrics and bounded recent/attention lists. |
| FR-10 | Staff/Admin Dashboard shall return operational metrics, current-user actions and bounded recent/urgent lists. |
| FR-11 | Dashboard counts shall come from backend queries, with matching filtered drill-down and zero states. |
| FR-12 | Migration shall preserve all earlier entities; seed shall be idempotent without resetting existing credentials or activity. |
| FR-13 | Earlier features, health, authorization and safe failure behavior shall remain available to permitted roles. |
| FR-14 | Major screens shall meet Zen Green, responsive, keyboard, semantic-label and modal requirements. |
| FR-15 | Staff Queue shall expose sorting/pagination and consume dashboard query filters without losing matches. |
| FR-16 | Final main shall have traceable passing tests, migration/recovery evidence, reviewed PRs and a concise Part 1-9 report. |

## 5. Business Rules

### 5.1 Actions Taken and access

| ID | Rule |
|---|---|
| BR-01 | Each Action Taken belongs to exactly one Ticket; ticketId cannot be moved after creation. |
| BR-02 | Ticket owner coordinates the Ticket; action assignee/performer may be another active IT_STAFF or ADMIN. |
| BR-03 | All writes require authenticated, active Staff/Admin who completed required password change. Owned-ticket Requester reads are enforced by backend. On read routes the role otherwise permits, access by a non-owner Requester returns the same 404/code/message as a missing resource, including Ticket, action/history, comment and attachment URLs. Role-level denial (including Staff-only notes) returns 403 before resource lookup regardless of ID existence. |
| BR-04 | `performedById` is the authenticated creator and immutable. `assigneeId` is the person currently responsible; events identify each later editor/completer. Client cannot spoof actor fields. |
| BR-05 | Action date/time is required, offset-qualified, not in the future at validation time and not earlier than Ticket creation. Server stores UTC. |
| BR-06 | Trim description (1-2000 chars), result (0-2000), follow-up note (0-2000) and attachment notes (0-1000). Required follow-up implies a nonblank follow-up note. Completion also requires nonblank result. |
| BR-07 | Assignee defaults to the creator and must be active Staff/Admin on create, reassignment or start/complete. Never erase historical actors when a user becomes inactive. |
| BR-08 | Action states: PLANNED -> IN_PROGRESS or CANCELLED; IN_PROGRESS -> COMPLETED or CANCELLED. Each request may traverse only one edge: PLANNED -> COMPLETED is rejected even with a result. Starting and completing require separate successful requests with refreshed versions. COMPLETED/CANCELLED are terminal and read-only. Cancellation needs a trimmed reason (1-1000 chars). |
| BR-09 | New/edited actions require a Ticket in NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER or REOPENED. Resolve/close/cancel locks actions; reopen the Ticket before recording new work. |
| BR-10 | No action hard-delete API. All creates, edits, assignments and state changes append immutable audit events with actor/time and before/after values. Public action history never exposes Internal Notes, credentials or idempotency records. |
| BR-11 | All Staff/Admin can edit a nonterminal accessible action, including one assigned to another staff member; auto actor/audit and concurrency checks prevent silent attribution or overwrite. |
| BR-12 | Cancelled actions do not count as completed work. Completed follow-up-required actions remain visible as requiring follow-up. A follow-up requirement is resolved when a chain of linked COMPLETED actions ends at a COMPLETED action with followUpRequired=false. Every link is within the same Ticket/current cycle, has at most one predecessor, and cannot form a cycle. PLANNED/IN_PROGRESS/CANCELLED successors cannot satisfy the requirement. |

### 5.2 Ticket workflow

The matrix retains the existing Lab 3 transitions. Only active Staff/Admin may make these transitions. Requesters cannot formally change status. A same-status request is rejected (409); an exact successful retry with the same workflow idempotency key replays its result.

| Current | Permitted next |
|---|---|
| NEW | OPEN, CANCELLED |
| OPEN | IN_PROGRESS, WAITING_FOR_REQUESTER, CANCELLED |
| IN_PROGRESS | WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| WAITING_FOR_REQUESTER | IN_PROGRESS, RESOLVED, CANCELLED |
| RESOLVED | CLOSED, REOPENED |
| CLOSED | REOPENED |
| REOPENED | IN_PROGRESS, CANCELLED |
| CANCELLED | REOPENED |

| ID | Rule |
|---|---|
| BR-13 | A transition to RESOLVED requires an active Staff/Admin Ticket owner, nonblank resolutionSummary (1-2000 chars), at least one COMPLETED action with a nonblank result in the current work cycle, and no PLANNED/IN_PROGRESS actions or unresolved follow-up in that cycle. |
| BR-14 | Initial cycle is 1. Reopening increments `workCycle`, clears requesterResolved/requesterResolvedAt and resolutionSummary, and records history. Old completed work remains visible but does not satisfy the new cycle's resolution gate. |
| BR-15 | Resolution indication belongs only to an owned-ticket Requester. Permit it on OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED or RESOLVED; repeated indication is a no-op preserving its original time. It never changes formal status. |
| BR-16 | Cancellation requires a reason and atomically cancels unfinished actions in the current cycle with corresponding events. Completed actions remain unchanged. Closing requires RESOLVED; cancelled/closed work can only continue after REOPENED. |
| BR-17 | Ticket workflow/action mutations lock the parent Ticket in a transaction, compare expected versions, recheck gates/assignees, and write state+history atomically. Actor/assignee eligibility is checked with User row locks shared with admin deactivation/role changes; use a consistent lock order and retry bounded deadlocks safely. Action writes also increment parent Ticket version and updatedAt. No partial events or race allowing action creation after resolution. |
| BR-18 | Ticket workflow events are append-only and visible to its Requester and Staff/Admin, with only public fields. Notes remain Staff/Admin-only. Order actions by actionDateTime ASC,id ASC and events by createdAt ASC,id ASC. |
| BR-19 | Stale writes return 409 and the current version. Reusing an idempotency key with a different validated payload returns 409; identical replay returns the original result. Unauthorized users cannot replay another user's response. |

### 5.3 Dashboard definitions

| ID | Rule |
|---|---|
| BR-20 | All metrics use one server asOf and a repeatable-read snapshot. ACTIVE = NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED. Recent window is local midnight six days before the Asia/Bangkok date of asOf through asOf (seven calendar dates); timestamps are UTC in API responses. Count distinct Tickets, never action-join duplicates. |
| BR-21 | Requester recent list: owned Tickets ordered updatedAt DESC,id DESC; attention list: owned WAITING_FOR_REQUESTER with same ordering. Staff recent list: all accessible Tickets with same ordering; urgent list: ACTIVE with itPriority=HIGH, ordered updatedAt DESC,id DESC. Each preview is capped at five items, with a matching view-all filter. |
| BR-22 | Staff My Actions preview returns five items with action links, ordered updatedAt DESC,id DESC; paged view-all supports pageSize 10/25/50. Administrator reuses Staff Dashboard; no optional user metrics in this sprint. |
| BR-23 | Empty counts are 0, empty lists [], status/priority groups include zero-valued keys. Drill-down carries scope, filters, sort, page=1 and date bounds. Backend reapplies current role/ownership. Passing another requesterId is rejected. |
| BR-24 | resolvedAt is set on successful formal resolution and preserved on close; cleared on reopen. Legacy RESOLVED/CLOSED records receive updatedAt as an explicitly documented approximate backfill, not a fabricated historical event. |

| Role / key | Exact predicate / calculation | Drill-down |
|---|---|---|
| Requester `activeTickets` | requesterId=current user AND status in ACTIVE | My Tickets, scope=active |
| Requester `waitingForRequester` | requesterId=current user AND status=WAITING_FOR_REQUESTER | My Tickets, status filter |
| Requester `recentlyUpdated` | requesterId=current user AND updatedAt >= windowStart AND <= asOf | My Tickets, updated-since/until |
| Requester `recentlyResolved` | owned, current status RESOLVED/CLOSED AND resolvedAt in window | My Tickets, resolved-since/until |
| Staff `unassignedActive` | status in ACTIVE AND ownerId IS NULL | Queue, scope=active,owner=unassigned |
| Staff `myActiveTickets` | status in ACTIVE AND ownerId=current user | Queue, scope=active,owner=me |
| Staff `byStatus` | all accessible Tickets grouped by each of eight statuses | Queue, status filter |
| Staff `activeByPriority` | ACTIVE Tickets grouped by itPriority LOW/MEDIUM/HIGH/UNSET | Queue, scope=active,priority filter |
| Staff `myPendingActions` | ACTIVE parent AND assignee=current user AND state PLANNED/IN_PROGRESS | Dashboard paged My Actions list linking to Ticket/action |

## 6. UI Specification Summary

See [ui-spec.md](ui-spec.md). Add `/dashboard` for Requester and `/staff/dashboard` for Staff/Admin. Preserve all old navigation and screens. Ticket Detail adds action list, read-only view, form, state controls and public workflow timeline. API returns allowed next statuses; UI does not infer extra permitted transitions. All important forms retain drafts on recoverable errors and expose conflict refresh controls.

## 7. Data Changes and Migration

| Model/change | Fields and constraints |
|---|---|
| Ticket additions | version Int default 0; workCycle Int default 1; resolvedAt nullable timestamp; cancelledReason nullable text |
| ActionTaken | id; ticketId FK; workCycle; actionDateTime; description; result default empty; performedById FK; assigneeId FK; followUpRequired default false; followUpNote; attachmentNotes; followsUpActionId optional self-FK; status default PLANNED; cancellationReason; version default 0; createdAt; updatedAt |
| ActionTakenEvent | id, actionId FK, actorId FK, kind, before/after JSON limited to public action fields, createdAt |
| TicketWorkflowEvent | id, ticketId FK, actorId FK, kind/status before/after, public reason/summary, workCycle, createdAt |
| MutationRequest | authenticated userId, route scope, key, normalized payload digest, responseStatus and public response JSON, createdAt; unique(userId,scope,key) |

FKs restrict deletion of referenced Users/Tickets/actions/events. Application exposes no physical deletion of actions/history. Index actions on (ticketId,workCycle,actionDateTime,id), (assigneeId,status,updatedAt,id); events on parent/time/id; Ticket on requesterId/status, ownerId/status, itPriority/status and resolvedAt. Reuse existing updatedAt indexes or add as query plans require.

Migration is additive; existing versions/cycles use defaults and old Tickets have zero actions. Old resolved/closed records remain readable and valid; gate applies only to new resolution transitions. No manufactured completed actions or events. Backfill resolvedAt only as BR-24 states.

Design decisions: (1) separate Ticket owner from action actor/assignee to preserve coordination and attribution; (2) integer versions plus parent locking and immutable event records make concurrent changes detectable while permitting audit; (3) UTC storage with explicit local-date bounds avoids client-dependent dashboards.

Seed inserts missing demo records with deterministic keys and never updates existing passwords, roles, names, statuses or activity. Include all eight Ticket statuses, priorities including unset, assigned/unassigned owners, zero/one/many actions, multiple performers, pending/completed/cancelled/follow-up examples and a Requester with zero metrics. Repeated execution must preserve exact existing values and counts.

Seed clarification after PR #53 review: a newly inserted demo snapshot starts at version 0, independent of the number of child actions; version is an optimistic concurrency token, not a fabricated count of earlier mutations. An unassigned OPEN demo Ticket can have assigned Actions Taken because owner and assignee are separate responsibilities. This does not waive BR-13: it still cannot resolve until an eligible Ticket owner and all current-cycle work requirements exist. Preserve existing demo data rather than rewriting it or backfilling fictional workflow events.

Resolution-gate seed/regression impact: keep at least one legacy active Ticket with zero actions to demonstrate a 409 resolution rejection. New resolve-positive fixtures must explicitly create and start/complete a valid action in the current cycle, assign an eligible owner and provide a resolution summary. Do not insert fake work into old Tickets merely to make earlier tests pass; update the test setup for the new contract. Previously RESOLVED/CLOSED zero-action Tickets remain readable and can close if already RESOLVED, but after reopening must satisfy the new cycle's gate.

Before upgrade, backup the source DB using pg_dump. Rehearse recovery by restoring the backup to a separate disposable DB and starting baseline Lab 3 code. Do not drop new tables as an automatic rollback or reset localdb. Production-scale recovery is excluded, but this local recovery demonstration is required. Migration tests compare legacy content/relations/counts before and after and document snapshot limitations.

## 8. API Contract

See [api-spec.md](api-spec.md) for endpoints, validation, pagination, status codes, idempotency and compatibility. Every write is authorized server-side. Direct API requests must enforce identical gates to the screen.

## 9. Acceptance Criteria

| ID | Observable acceptance |
|---|---|
| AC-01 | Staff/Admin creates a valid action under the correct Ticket, with authenticated immutable actor and active assignee. |
| AC-02 | Owned-ticket Requester reads all actions; cross-owner reads/requester writes/no-session writes are denied. |
| AC-03 | Action states, completion result, follow-up, date and assignee validation accept valid cases and reject invalid ones without changes. |
| AC-04 | Multiple staff contribute to one Ticket without replacing its owner; action ordering remains deterministic. |
| AC-05 | Edits/cancellation append history; terminal actions cannot be altered or removed, and private notes do not leak. |
| AC-06 | Every Ticket transition matches the role matrix; resolution gate survives direct API bypass attempts. |
| AC-07 | Advisory requester indication leaves formal status unchanged; reopen begins a new work cycle and old actions cannot resolve it. |
| AC-08 | Concurrent/stale writes return conflict without lost data or orphan events; resolution cannot race a new unfinished action. |
| AC-09 | Identical retries create one action/event; changed-payload key reuse conflicts; UI double-submit is prevented. |
| AC-10 | Requester metrics/lists/drill-down equal authoritative owned-data queries, including date boundaries and zero cases. |
| AC-11 | Staff/Admin metrics, current-user actions and drill-down equal database queries and enforce role access. |
| AC-12 | Legacy migration preserves earlier records/relations and supports zero-action Tickets; documented backup recovery works. |
| AC-13 | Repeated seed changes neither existing credentials/activity/content nor demo counts. |
| AC-14 | UI supports required modes and loading/empty/validation/forbidden/conflict/not-found/failure states while preserving drafts. |
| AC-15 | All major Lab 4 screens pass desktop/tablet/mobile and keyboard/modal/focus/overflow inspection. |
| AC-16 | Labs 1-3 regression and Staff Queue filter/sort/pagination work with stable ordering and no missing drill-down matches. |
| AC-17 | Dashboard payload/query work stays bounded and meets documented local performance-smoke limits. |
| AC-18 | Final reviewed main has passing unit/API/UI/E2E/build evidence, current docs and a real Part 1-9 report. |

Every AC is mapped in [tests.md](tests.md).

## 10. Product Definition of Done

- [ ] Issue 1 contract reviewed before coding subsequent feature issues.
- [ ] FR/BR/AC implemented with backend authority and documented decisions.
- [ ] Additive migration, safe repeated seed and backup recovery verified on isolated DBs.
- [ ] Planned meaningful tests and all app regression/build checks pass; no invented pass status.
- [ ] Dashboard count/query comparison and seven-day boundary evidence recorded.
- [ ] Accessible desktop/tablet/mobile screens, safe error states and retained drafts verified.
- [ ] Each issue has its own incremental commits, PR description and requested PpAnpt review; next issue waits for approval.
- [ ] Features merge into lab4-staging, then reviewed release merges into main; final checks rerun on main.
- [ ] README, tests, reviewer and AI records reflect actual work; one concise PDF has working links and readable evidence.
- [ ] Local report images, reports and captures are excluded from commits as requested by the student.

## 11. Assumptions and Decisions

The handout's Part 6 rubric requires assignment/lifecycle even though its opening field list describes recorded actions only. This contract includes both. Append-only means preserving immutable history and action existence, while permitting audited edits to nonterminal action state. Assignee and immutable performer are distinct. Following up completed work uses a new linked action instead of rewriting terminal records. These choices require peer review; they are not claims of requirements verbatim from the handout.

BR-13's requirement for at least one COMPLETED action is a deliberate Sprint 4 product decision, not an explicit handout mandate or an already-implemented Lab 3 rule. Lab 3 section 4 defers incomplete-action resolution blocking to Lab 4. Merely having no incomplete actions would allow a zero-action Ticket to resolve; this contract instead requires documented completed work for new resolution transitions. The preservation and fixture consequences are stated in section 7. Lab 4 requirements govern new behavior; earlier handouts are used only to preserve prior capabilities and security obligations.

The primary action-list date shown to users and used for its ASC ordering is actionDateTime (date/time work occurred), with id as tie-break. createdAt is the server record-creation timestamp, shown separately in details/audit. History uses server createdAt and id; dashboard recent actions use updatedAt and id as explicitly specified in BR-22. These timestamps are not interchangeable.

Version-required workflow writes intentionally replace the old unversioned mutation contract. Existing clients/tests are updated together; unversioned writes return validation error rather than silently bypassing concurrency safety. Preserve earlier user capabilities, not unsafe stale-write behavior. No application implementation or final test results are delivered in this contract-only PR.
