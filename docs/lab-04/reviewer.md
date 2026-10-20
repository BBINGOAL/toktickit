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

Record the exact PR/review/comment URLs, reviewer identity, feedback and author response after they occur. A request to review is not approval. Do not start issue #45 until this contract receives peer approval and is integrated into lab4-staging.

Issue #45 is Done on Project 4 after PR #53 integration. Issue #46 started on 2026-10-20 only after the student confirmed the merge and GitHub verified it; branch feature3/lab4-actions-taken-ui starts at 3465088. Backend 124/124, UI 53/53 and Actions E2E 9/9 pass using isolated native PostgreSQL 18.1. Peer approval and integration remain pending; see ui-verification.md.

### PR #53 feedback and follow-up

Reviewer: PpAnpt, APPROVED on 2026-10-19 at 14:27 Asia/Bangkok, for the latest head f6bae9e. The reviewer reports 124/124 tests twice on a newly migrated/seeded isolated database and no Prisma schema drift. This is the reviewer's reported verification, not a new author rerun. All four suggestions were explicitly nonblocking. GitHub merge is 3465088cd7f38bca224b5a99ce86fc19da929d61 into lab4-staging on 2026-10-20.

| Suggestion | Follow-up status |
|---|---|
| Assignee test depends on the fixture user appearing in the first 50 global matches | Issue #46 searches its unique staff name with matching inactive/Requester control prefixes, retaining meaningful exclusion assertions. Changed test passes in the 124/124 native PostgreSQL 18.1 rerun on 2026-10-20. |
| Repeat seed uses update: {} and no longer resets Lab 3 demo accounts | Documented explicitly in implementation-plan.md and ui-verification.md; keep current credentials/roles/activity and do not use repeat seed as a password reset. README consolidation remains #51. |
| Demo Tickets have version 0 despite actions; OPEN sample has no owner but assigned actions | Recorded for seed/workflow consistency review in #47. No existing user data or demo records were rewritten in #46. Ticket owner and action assignee remain separate relationships; any changed demo-state assumptions must be documented and tested. |
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
