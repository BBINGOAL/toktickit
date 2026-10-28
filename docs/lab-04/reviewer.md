# Lab 4 Peer Review Record

## My Information

- Name: Siwarak Chatvichai
- Student ID: 67070501086
- GitHub: [BBINGOAL](https://github.com/BBINGOAL)

## My Peer Reviewer

- GitHub: [PpAnpt](https://github.com/PpAnpt)
- Name/student ID: to be confirmed for the Lab 4 record.

## Reviews received

| Issue / scope | PR | Reviewer request | Actual comments / responses | Approval |
|---|---|---|---|---|
| [#44 Sprint 4 Engineering Contract](https://github.com/BBINGOAL/toktickit/issues/44) | [PR #52](https://github.com/BBINGOAL/toktickit/pull/52) into lab4-staging | PpAnpt requested on 2026-10-12 | [Review on 2026-10-14](https://github.com/BBINGOAL/toktickit/pull/52#pullrequestreview-5512844550), summarized below | APPROVED for commit 02420fc; revised PR merged as 7922e0e on 2026-10-14 (no separate later review recorded) |
| [#45 Actions Taken Foundation and Migration](https://github.com/BBINGOAL/toktickit/issues/45) | [PR #53](https://github.com/BBINGOAL/toktickit/pull/53) into lab4-staging | PpAnpt requested on 2026-10-14 | [Actual review](https://github.com/BBINGOAL/toktickit/pull/53#pullrequestreview-5568221570), 2026-10-19; four nonblocking suggestions below | APPROVED for f6bae9e; merged as 3465088 on 2026-10-20 |
| [#46 Actions Taken UI](https://github.com/BBINGOAL/toktickit/issues/46) | [PR #54](https://github.com/BBINGOAL/toktickit/pull/54) into lab4-staging | PpAnpt requested on 2026-10-20 | [Actual review](https://github.com/BBINGOAL/toktickit/pull/54#pullrequestreview-5581899545), nonblocking suggestions below; author replied | APPROVED for latest head 2cb79da; merged as 10dd684 on 2026-10-20 |
| [#47 Ticket Workflow and Resolution](https://github.com/BBINGOAL/toktickit/issues/47) | [PR #55](https://github.com/BBINGOAL/toktickit/pull/55) into lab4-staging | PpAnpt requested on 2026-10-20 | [Review](https://github.com/BBINGOAL/toktickit/pull/55#pullrequestreview-5638567438) and [author response](https://github.com/BBINGOAL/toktickit/pull/55#issuecomment-6459305158); follow-up below | APPROVED for latest head d1f9e72 on 2026-10-24; merged be6e14f on 2026-10-28 |
| [#48 Requester Dashboard](https://github.com/BBINGOAL/toktickit/issues/48) | [PR #56](https://github.com/BBINGOAL/toktickit/pull/56) into lab4-staging, Development link verified | PpAnpt requested on 2026-10-28; verified in metadata | Backend 244/244, client 72/72, combined Chromium 20/20; actual review awaited | Pending |

Record exact PR/review/comment URLs, reviewer identity, feedback and author response only after they occur. A review request is not approval. Wait for peer review and staging integration before starting each next issue.

Issues #44-#47 are Done after reviewed integration. Issue #48 started only after the student's merge/continue instruction and verification of PR #55 merge be6e14f; feature5/lab4-requester-dashboard starts there. Its approval remains pending, with results in requester-dashboard-verification.md.

### PR #55 feedback and follow-up in #48

PpAnpt approved d1f9e72 on 2026-10-24 at 21:17 Asia/Bangkok, reporting server 209/209 on a new isolated DB and client 61/61 plus typecheck; E2E was explicitly not rerun by the reviewer. The author replied with thanks and dispositions on 2026-10-28. Student subsequently confirmed merge; GitHub records be6e14f into lab4-staging on 2026-10-28 at 16:58 Asia/Bangkok. Approval was for PR #55, not the subsequent #48 changes.

| Suggestion | Actual follow-up |
|---|---|
| Removed attachments now reappear with time/reason; verify intent | Preserve Lab 2 BR-19/AC-17 visible soft-removal metadata. Added reload/Requester/Staff regression and blocked-download checks. Corrected removed download to authorized 410 and missing/non-owned identical 404 before disk/removal-state checks. No removed content is exposed. |
| Confirm owner/priority edits on CLOSED/CANCELLED | Documented as metadata-only versioned/history-recorded edits; two terminal-state tests ensure Ticket status and completed Actions remain unchanged. |
| Confirm Resolve actor need not equal Ticket owner | Explicit spec/API clarification and non-owner Staff resolve test, retaining eligible owner gate and actual actor attribution. |
| Document cross-requester 403 to 404 compatibility change | tests.md and API compatibility section now explicitly state Lab 2/3 behavior change; role-level denial remains 403. |

The later 410/404 correction is part of #48's reviewable diff and will receive its own peer review. The earlier author reply accurately said these follow-ups were not yet implemented at the time it was posted.

### PR #54 feedback and response

PpAnpt APPROVED latest head 2cb79da on 2026-10-20 at 14:20 Asia/Bangkok. Reviewer reports client 53/53, TypeScript and server 124/124 passed; reviewer explicitly did **not** rerun E2E. All four suggestions were nonblocking. PR merged at 10dd684 on 2026-10-20 at 14:45 Asia/Bangkok.

| Suggestion | Follow-up in issue #47 |
|---|---|
| Clarify input timezone versus Bangkok display | Explicit Intl input timezone and Asia/Bangkok display hint in the Action form; runtime images inspected |
| Uncertain submission may have committed when closing dialog | Warning explains possible prior success, refreshes authoritative list/parent; test verifies warning/refresh; focus restored after reload |
| frozen reads intent ref in render | Submission intent is React state; ref remains only for synchronous double-submit lock |
| Split ActionsTaken.tsx later | Recorded for #50 readability hardening; Ticket workflow is a separate component/service already |

Actual author replies: [PR #53 response](https://github.com/BBINGOAL/toktickit/pull/53#issuecomment-6286073824), [PR #54 response](https://github.com/BBINGOAL/toktickit/pull/54#issuecomment-6286074513). Going forward, read the review and reply with thanks plus accurate dispositions before recommending merge; never claim pending suggestions were already fixed.

### PR #53 feedback and follow-up

Reviewer: PpAnpt, APPROVED on 2026-10-19 at 14:27 Asia/Bangkok, for the latest head f6bae9e. The reviewer reports 124/124 tests twice on a newly migrated/seeded isolated database and no Prisma schema drift. This is the reviewer's reported verification, not a new author rerun. All four suggestions were explicitly nonblocking. GitHub merge is 3465088cd7f38bca224b5a99ce86fc19da929d61 into lab4-staging on 2026-10-20.

| Suggestion | Follow-up status |
|---|---|
| Assignee test depends on the fixture user appearing in the first 50 global matches | Issue #46 searches its unique staff name with matching inactive/Requester control prefixes, retaining meaningful exclusion assertions. Changed test passes in the 124/124 native PostgreSQL 18.1 rerun on 2026-10-20. |
| Repeat seed uses update: {} and no longer resets Lab 3 demo accounts | Documented explicitly in implementation-plan.md and ui-verification.md; keep current credentials/roles/activity and do not use repeat seed as a password reset. README consolidation remains #51. |
| Demo Tickets have version 0 despite actions; OPEN sample has no owner but assigned actions | #47 documents the initial-snapshot decision: version is a concurrency token, not child count; unowned Tickets may have assigned work but cannot resolve until owner/work gates pass. Gate/owner/legacy-zero-action tests pass. No demo rewrite or fictional historical events; see specification section 7 and workflow-verification.md. |
| Consider DB CHECK constraints and remove redundant single-column requesterId/ownerId indexes | Recorded for measured schema/index review in #50; not silently added to the UI change and not claimed completed. |

Positive review notes: Ticket-before-User lock ordering, idempotency scope/payload digest, concurrency tests, and non-owner Requester 404. Reviewer's AI-tool usage cannot be verified from GitHub metadata.

### PR #52 feedback and response

Reviewer: PpAnpt. GitHub state: APPROVED, submitted 2026-10-14 at 10:50 Asia/Bangkok, reviewing commit 02420fc. Reviewer's use of any AI tool is not verifiable from the review metadata.

| Reviewer feedback | Author response in revised documents |
|---|---|
| Non-owner Requester 403 vs missing resource 404 reveals existence | Shared API rules/BR-03 now require indistinguishable 404 for non-owned/missing resources; role-level denial stays 403 before lookup. API-02 and earlier-regression expectations updated. |
| BR-13 completed-action minimum is stricter and affects zero-action legacy Tickets | Retained as an explicit Sprint 4 product choice, not a quoted Lab 3 mandate; added assumptions plus seed/migration/regression consequences and zero-action gate tests. |
| BR-08 conflicts with wording allowing start/complete in one PATCH | One edge per request; direct PLANNED -> COMPLETED rejects even with result. Separate start/complete, refreshed versions; UNIT-01/API/UI clarified. |
| Extra mechanisms may exceed reasonable scope | Added must-have/minimal-mechanism/stretch table with issue ownership. Existing contracted safety behavior retained; generic platforms, graph editor, optional Admin metrics and advanced UI excluded from required delivery. |
| FR-04 lacks explicit test reference | Added FR-04 to API-01 and E2E-01; behavior was already covered via AC-04. |
| BR-20 absent from BR table | Dashboard BR-20 through BR-24 now use a consistent BR table. |
| Clarify actionDateTime vs createdAt display/order | Action list uses work time actionDateTime/id; details label createdAt as Recorded at; history uses createdAt/id. API-05 plan explicitly tests differing timestamps. |
| Kanban needs #44-#51 | Already present in original Project 4; #44 linked to PR #52 and In review. Updated stale plan/PR status information. |

Author response: [PR comment addressing all review points](https://github.com/BBINGOAL/toktickit/pull/52#issuecomment-6160807329), posted 2026-10-14 after clarification commit 1c7b55e was pushed.

The student subsequently confirmed that the friend merged the revised PR; GitHub reports merge 7922e0e on 2026-10-14. Initial approval is recorded accurately and is not presented as a separate approval of later commits. Issue #45 began only after that integration and the student's instruction to continue.

## Reviews I performed

No Lab 4 peer reviews recorded yet. Add only actual reviews and links as they occur.
