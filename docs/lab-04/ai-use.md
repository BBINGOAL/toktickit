# Lab 4 AI Use and Reflection

Status: initial factual record for the engineering-contract issue; expand as the sprint proceeds.

## Tool and roles

LLM: OpenAI GPT-6 through Codex. Specification-agent work: read the Lab 4 handout and existing Lab 3 code, propose issue/branch decomposition, identify handout/rubric ambiguity, and draft FR/BR/AC, API/UI rules and test traceability. Coding-agent work has not started for Lab 4 application features.

## Selected actual prompts

These are excerpts from real student requests in this conversation, not invented later prompts.

| No. | Student prompt excerpt | Use/outcome |
|---|---|---|
| 1 | "อย่างเเรกลองอ่านไฟล์ md ที่ชื่อ SE+Lab+4.md ว่าแลปนี้ต้องทำไร คุณลองทำ implementation plan มาให้ผมดูก่อน" | Read the handout, inspect baseline code, propose eight issues and one branch per issue. |
| 2 | "commit ทีละสเตปนะ พอเสดเเล้ว issueนึงให้ไปสร้าง PR พร้อมทั้งเขียน Discription ... request บัญชีเพื่อนที่ชื่อ PpAnpt มารีวิว ... รอเพื่อนรีวิวก่อนค่อยทำต่อ" | Adopt incremental commits, one issue/PR at a time and a peer-review gate before the next issue. |
| 3 | "อย่าไปcommit พวกที่เป็นรูปของเอกสารตอนจะส่งlab พวกรูปรายงาน" | Commit an explicit documentation allowlist and keep report/capture assets local. |

The handout requires 6-10 selected prompts in the final submission. Only three actual excerpts are available at this initial stage; record additional real prompts when they occur rather than invent them.

## Decisions AI helped expose

- The submission rubric requires assign/complete/cancel although the opening Actions Taken description lists record fields. The contract therefore defines a lifecycle separately from recorded action content.
- Current seed rewrites passwords/activity on repeat execution; final seed must preserve existing users.
- Current Ticket status changes have no versioned atomic resolution gate. Action writes and Ticket transitions need shared parent locking and audit events.
- Staff Queue currently fixes page 1/pageSize 50. Dashboard drill-down needs filters/sorting/pagination that expose the full matching collection.

## My Reflection

Student-authored reflection is pending. The final reflection should discuss which specification-agent decisions were accepted or changed, how coding-agent output was checked against tests, and what the student learned from actual review/failures. This file does not claim a personal experience or final product result that has not occurred.

## Verification boundaries

This PR delivers documents, not implemented Actions Taken or dashboards. API/UI/E2E tests are planned and remain Not run. Peer review approval will be recorded only from the actual GitHub review. Report images/PDF are deliberately excluded from commits at the student's request.
