# Lab 4 AI Use and Reflection

Status: initial factual record for the engineering-contract issue; expand as the sprint proceeds.

## Tool and roles

Issue #49 (2026-10-28) began after the student's actual "เพื่อน merge มาละทำต่อได้เลย" and verification of PR #56 staging merge cdc2a65. Codex created feature6/lab4-staff-dashboard, moved #48 Done/#49 In progress on the existing board, and committed tests/backend/UI/E2E in separate steps. Implemented Staff/Admin metrics, assigned-work pagination, exact Queue drill-down/URL state and a bounded read-only linked-action endpoint/dialog; followed the actual four PR #56 suggestions. Final results: backend 278/278, client 93/93, Chromium 32/32, types/builds/drift checks pass; two existing lint warnings remain. Test-only status-marker/matcher failures were corrected and recorded in staff-dashboard-verification.md. Runtime captures were inspected and remain uncommitted. No new peer approval, final-main result, Docker recovery or student reflection was fabricated.

Issue #48 (2026-10-28) followed the student's actual instruction, "เพื่อน merge มาเเล้วครับ ทำissue ถัดไปได้เลย", after verifying PR #55 merged into lab4-staging as be6e14f. Codex created feature5/lab4-requester-dashboard, updated the existing Kanban and committed tests, backend, UI, PR #55 follow-ups and E2E separately. Implemented scoped snapshot metrics, Bangkok dates, matching URL drill-down and stale-response protection. Actual final results: backend 244/244, client 72/72, combined Chromium 20/20, types/builds and drift checks pass. Initial fixture-count/selector/typecheck/keyboard-test issues and a transient workflow hook timeout are recorded in requester-dashboard-verification.md. Real captures remain local; no student reflection, peer approval, final-main result or Docker recovery was invented.

LLM: OpenAI GPT-6 through Codex. Specification-agent work: read the Lab 4 handout and existing Lab 3 code, propose issue/branch decomposition, identify handout/rubric ambiguity, and draft FR/BR/AC, API/UI rules and test traceability. Coding-agent work for issue #45 implements the additive data model, Actions Taken APIs, seed preservation and automated validation/API/concurrency/migration/recovery tests after issue #44 integration.

## Selected actual prompts

These are excerpts from real student requests in this conversation, not invented later prompts.

| No. | Student prompt excerpt | Use/outcome |
|---|---|---|
| 1 | "อย่างเเรกลองอ่านไฟล์ md ที่ชื่อ SE+Lab+4.md ว่าแลปนี้ต้องทำไร คุณลองทำ implementation plan มาให้ผมดูก่อน" | Read the handout, inspect baseline code, propose eight issues and one branch per issue. |
| 2 | "commit ทีละสเตปนะ พอเสดเเล้ว issueนึงให้ไปสร้าง PR พร้อมทั้งเขียน Discription ... request บัญชีเพื่อนที่ชื่อ PpAnpt มารีวิว ... รอเพื่อนรีวิวก่อนค่อยทำต่อ" | Adopt incremental commits, one issue/PR at a time and a peer-review gate before the next issue. |
| 3 | "อย่าไปcommit พวกที่เป็นรูปของเอกสารตอนจะส่งlab พวกรูปรายงาน" | Commit an explicit documentation allowlist and keep report/capture assets local. |
| 4 | "เพื่อนรีวืวมาเเล้ว ... คุณลองอ่านเเละดูหน่อยเเต่มันขึ้นสถานะ approve นะ" | Read actual GitHub review, verify APPROVED status and distinguish suggestions from completed work. |
| 5 | "คือผมเเค่งงว่าทำไมถุึงมาอ้างอิงจากlab3" | Explain that Lab 4 governs new functionality while earlier labs supply preservation/security constraints; identify the completed-action minimum as our added design decision. |
| 6 | "เเก้ไขตามที่เพื่อน review มาก่อนมะ หรือสามารถ ให้เพื่อนmerged ให้ได้เลย" | Clarify the reviewed contract in the same PR and request confirmation before staging integration. |
| 7 | "คุณลองรันเเล้ว ลองทำ issue2 นี้ต่อสิ" | Recover verification after Docker became available, use isolated PostgreSQL, fix real seed/schema issues, and verify the foundation before requesting peer review. |

The handout requires 6-10 selected prompts in the final submission. Seven actual excerpts are recorded; revise the selection later if later coding-agent prompts better demonstrate the final work.

## Decisions AI helped expose

- The submission rubric requires assign/complete/cancel although the opening Actions Taken description lists record fields. The contract therefore defines a lifecycle separately from recorded action content.
- Current seed rewrites passwords/activity on repeat execution; final seed must preserve existing users.
- Current Ticket status changes have no versioned atomic resolution gate. Action writes and Ticket transitions need shared parent locking and audit events.
- Staff Queue currently fixes page 1/pageSize 50. Dashboard drill-down needs filters/sorting/pagination that expose the full matching collection.
- Actual peer review exposed ownership error-message leakage, ambiguous action transition wording and missing direct FR-04 traceability. Contract revisions address those issues and document legacy zero-action behavior plus must-have/stretch boundaries. Approval of the initial commit does not automatically approve later revisions.
- Real issue #45 verification caught an advisory-lock void-result incompatibility, a seed.ts/older seed.js import collision, and a baseline User.updatedAt default mismatch. These were corrected and verified, not hidden by resetting the original database. Final branch checks passed 124 backend tests (60 new foundation tests) and 31 existing UI tests; later workflow/dashboard/UI features are still pending.

## My Reflection

Student-authored reflection is pending. The final reflection should discuss which specification-agent decisions were accepted or changed, how coding-agent output was checked against tests, and what the student learned from actual review/failures. This file does not claim a personal experience or final product result that has not occurred.

## Verification boundaries

Issue #47 started only after the actual student merge/continue instruction and verification that PR #54 merged as 10dd684 on 2026-10-20. Work covers the complete versioned Ticket lifecycle/gate, append-only events, advisory/reopen, atomic cancellation and client workflow controls. TDD began with a missing workflow-rules module (red), then unit/API matrix/gate/concurrency/rollback checks passed. Full UI is 61/61 and combined Actions/workflow E2E 13/13. A first E2E run exposed four focus-restoration failures; refreshing every dialog close disabled the trigger. This was fixed rather than weakening the assertions. A mount synchronization race was also fixed. Explicit timezone, React intent state and uncertain-close refresh address three PR #54 suggestions; the general ActionsTaken split remains #50. Native isolated PostgreSQL 18.1 on B: remains the verification environment; no original data/report assets are committed. Exact final backend counts/commands are recorded in workflow-verification.md after the final rerun.

Issue #46 began after the student's actual merge confirmation and verification of PR #53 as 3465088 on 2026-10-20. Coding-agent work added the typed action transport, shared list/history, accessible work dialog, one-edge transitions, exact-intent retry and draft comparison/recovery. Tests and image inspection exposed timestamp precision, focus-selection, unchanged-assignee PATCH, history-name and checkbox/long-header issues; these were fixed. Latest results: UI 53/53, backend 124/124, Actions E2E 9/9, schema drift none, client/server typechecks/builds pass. Docker remained stopping after C: filled; verification used a new isolated native PostgreSQL 18.1 cluster on B: at 127.0.0.1:55434, not localdb or Docker. Real screenshots were inspected and remain uncommitted. No approval, final-main result or student reflection was fabricated. Details: ui-verification.md.

PR #52 delivered the contract. Issue #45 delivers the verified backend foundation described in foundation-verification.md; Ticket resolution/dashboard/UI increments and E2E/final-main checks remain pending. Peer review approval for each PR is recorded only from the actual GitHub review. Report images/PDF are deliberately excluded from commits at the student's request.
