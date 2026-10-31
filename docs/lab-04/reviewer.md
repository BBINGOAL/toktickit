# Peer Review Information

**My Information:**
- **Name:** ศิวรักษ์ ฉัตรวิชัย (Siwarak Chatvichai)
- **Student ID:** 67070501086
- **GitHub Username:** [BBINGOAL](https://github.com/BBINGOAL)

**My Peer Reviewer (คนที่มาตรวจโค้ดให้ผม):**
- **Name:** อนพัช บรรเจิดศิลป์
- **Student ID:** 67070501049
- **GitHub Username:** [PpAnpt](https://github.com/PpAnpt)

สรุปด้านล่างถอดความจากคอมเมนต์จริง โดยแยกข้อเสนอแนะ คำตอบ และผลที่แก้ตาม ไม่อ้างว่า reviewer รันทดสอบส่วนที่เขาระบุว่าไม่ได้รัน

## PR #52: Engineering contract

- **Link to PR they reviewed for me:** [PR #52](https://github.com/BBINGOAL/toktickit/pull/52)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/52#pullrequestreview-5512844550)

| Subject | Record |
|---|---|
| Reviewer feedback | 403/404 เปิดเผยการมีอยู่ของ Ticket; completed-action minimum เข้มกว่าข้อความเดิม; BR-08/PATCH ขัดกัน; แยก must-have/stretch; เพิ่ม FR-04 mapping, BR-20 table, นิยามเวลาที่ใช้เรียง และ Kanban ให้ครบ |
| My Response / follow-up | [คำตอบจริง](https://github.com/BBINGOAL/toktickit/pull/52#issuecomment-6160807329): ปรับ non-owner เป็น 404 เหมือน missing และคง role-level 403; บันทึก completed-action minimum เป็น product decision พร้อมผลต่อ legacy/seed/regression; หนึ่ง transition ต่อ request; เพิ่ม scope table, mapping และนิยาม actionDateTime/createdAt ตรวจโครงเอกสาร 16 FR/24 BR/18 AC/37 test rows ผ่าน |
| Approval / integration | Initial APPROVED ที่ 02420fc; แก้เอกสาร 1c7b55e แล้วรวมเป็น 7922e0e โดยไม่อ้างว่ามี review ใหม่แยกจาก approval เดิม |

## PR #53: Actions Taken foundation and migration

- **Link to PR they reviewed for me:** [PR #53](https://github.com/BBINGOAL/toktickit/pull/53)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/53#pullrequestreview-5568221570)

| Subject | Record |
|---|---|
| Reviewer feedback | เทส assignee พึ่ง 50 คนแรก; seed ไม่ reset บัญชีเดิม; demo version=0 และ Ticket ไม่มี owner แต่ action มี assignee; พิจารณา CHECK constraints/index ที่ซ้ำ |
| My Response / follow-up | [คำตอบจริง](https://github.com/BBINGOAL/toktickit/pull/53#issuecomment-6286073824): PR #54 ใช้ search ชื่อ fixture; ระบุ seed update:{} ไม่ reset credentials/roles/activity; PR #55 ชี้แจง version เป็น concurrency token และ assignee แยกจาก owner; hardening ตรวจ indexes/วัด performance แล้วคง schema เดิมโดยบันทึกขอบเขต application validation |
| Approval / integration | APPROVED f6bae9e; reviewer รายงาน server 124/124 สองรอบและไม่มี drift; merged 3465088 |

## PR #54: Actions Taken UI

- **Link to PR they reviewed for me:** [PR #54](https://github.com/BBINGOAL/toktickit/pull/54)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/54#pullrequestreview-5581899545)

| Subject | Record |
|---|---|
| Reviewer feedback | ระบุ input timezone ให้ตรงการแสดง Bangkok; ปิด dialog หลัง response หายควร refresh/เตือน; frozen อ่าน ref ใน render; แยก ActionsTaken.tsx |
| My Response / follow-up | [คำตอบจริง](https://github.com/BBINGOAL/toktickit/pull/54#issuecomment-6286074513): PR #55 เพิ่ม timezone hint, เตือนและ refresh authoritative state เมื่อปิด uncertain submission และใช้ React state เก็บ intent; PR #58 แยก list/editor/details/history/pager/presentation และใช้ shared Dialog พร้อม regression |
| Approval / integration | APPROVED 2cb79da; reviewer รัน server 124/124, client 53/53 และ types ผ่าน ไม่ได้รัน E2E; merged 10dd684 |

## PR #55: Ticket workflow and resolution

- **Link to PR they reviewed for me:** [PR #55](https://github.com/BBINGOAL/toktickit/pull/55)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/55#pullrequestreview-5638567438)

| Subject | Record |
|---|---|
| Reviewer feedback | removed attachments กลับมาใน detail; owner/priority แก้ได้บน CLOSED/CANCELLED; Resolve ไม่บังคับ actor=owner; บันทึก cross-requester 403->404 compatibility |
| My Response / follow-up | [คำตอบจริง](https://github.com/BBINGOAL/toktickit/pull/55#issuecomment-6459305158): คง soft-removal metadata/time/reason ตามกฎเดิม โดยไฟล์จริงดาวน์โหลดไม่ได้; เพิ่ม reload/role/410 checks และ indistinguishable missing/non-owned 404 ใน PR #56; บันทึก terminal metadata-only policy และทดสอบ; eligible owner เป็น gate ไม่ใช่ข้อจำกัด actor พร้อม non-owner Staff resolve test |
| Approval / integration | APPROVED d1f9e72; reviewer รัน server 209/209, client 61/61 และ types ผ่าน ไม่ได้รัน E2E; merged be6e14f |

## PR #56: Requester Dashboard

- **Link to PR they reviewed for me:** [PR #56](https://github.com/BBINGOAL/toktickit/pull/56)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/56#pullrequestreview-5682178217)

| Subject | Record |
|---|---|
| Reviewer feedback | แยก handler ที่ใช้ req.path; encode offset + เป็น %2B; RoleRoute เปลี่ยนเป็น Access denied; removed-download เปลี่ยน 404->410 ต้องตรวจ client |
| My Response / follow-up | [คำตอบจริง](https://github.com/BBINGOAL/toktickit/pull/56#issuecomment-6468406174): PR #57 แยก explicit handlers; เพิ่มเอกสารและ transport test ของ offset; บันทึกพร้อมทดสอบ signed-out redirect/authenticated forbidden; เพิ่ม 410 rejects-before-blob test โดยไม่อ้างว่าเทสนี้มีอยู่ตอนตอบครั้งแรก |
| Approval / integration | APPROVED 947e090; reviewer รัน server 244/244, client 72/72 และ types ผ่าน ไม่ได้รัน E2E; merged cdc2a65 |

## PR #57: Staff/Admin Dashboard

- **Link to PR they reviewed for me:** [PR #57](https://github.com/BBINGOAL/toktickit/pull/57)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/57#pullrequestreview-5683665723)

| Subject | Record |
|---|---|
| Reviewer feedback | actionId ผิดรูปแบบใช้ข้อความฟอร์มที่สับสน; Close/Escape ควรลบ query ด้วย replace; windowStart ไม่ได้กรอง Staff; อธิบาย snapshot กับรายการสด |
| My Response / follow-up | [คำตอบจริง](https://github.com/BBINGOAL/toktickit/pull/57#issuecomment-6471169069): PR #58 ตรวจ positive safe ID ก่อน GET และใช้ link-specific error; ปิด dialog ลบเฉพาะ actionId คง query อื่นและไม่เพิ่ม history; windowStart คงเพื่อ compatibility พร้อมอธิบายว่าไม่จำกัด Staff metrics; เพิ่มคำอธิบาย snapshot/current-list โดย actionId ว่างเดิมไม่เปิด dialog อยู่แล้ว |
| Approval / integration | APPROVED 191e425; reviewer รัน server 278/278, client 93/93 และ types ผ่าน ไม่ได้รัน E2E; merged 85a06ed |

## PR #58: Final regression and product hardening

- **Link to PR they reviewed for me:** [PR #58](https://github.com/BBINGOAL/toktickit/pull/58)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/58#pullrequestreview-5701988526)

| Subject | Record |
|---|---|
| Reviewer feedback | ระบุ myActionsQuery ใกล้ raw SQL predicate; เปลี่ยน shared dialog class action-* เป็นชื่อกลาง; ตรวจ err.message ของแต่ละไฟล์ที่ upload ไม่สำเร็จ |
| My Response / follow-up | [คำตอบจริง](https://github.com/BBINGOAL/toktickit/pull/58#issuecomment-6527514521): ตอบขอบคุณและตรวจ parity ของ assignee/pending/active-parent กับ myActionsQuery แล้ว มี shared-rule comment เดิม; generic class naming และการระบุ helper ให้ชัดเป็น optional refactor ยังไม่ได้เปลี่ยน; uploadAttachment ใช้ responseError ที่แทน 5xx/non-JSON ด้วย safe fallback และ endpoint validation ไม่ส่ง exception ดิบ helper มี PRIVATE-message tests ใน write API อื่น แต่ไม่อ้างว่ามี upload-specific PRIVATE-message test |
| Approval / integration | เริ่ม COMMENTED แล้วเปลี่ยนเป็น APPROVED 98bc6cf หลัง reviewer รัน server 279/279 รวม performance และ client 109/109/types ผ่านบน DB แยก; ไม่ได้รัน E2E; merged e25284b วันที่ 2026-10-31 01:36 Asia/Bangkok |

---

## Who I Reviewed (คนที่ผมไปตรวจโค้ดให้เขา)

- **Name:** อนพัช บรรเจิดศิลป์
- **Student ID:** 67070501049
- **GitHub Username:** [PpAnpt](https://github.com/PpAnpt)
- **Link to PR I reviewed for them:** [PR #37: Sprint 4 engineering contract](https://github.com/PpAnpt/toktickit/pull/37)

| Subject | Record |
|---|---|
| My Review Comment | [CHANGES_REQUESTED รอบแรก](https://github.com/PpAnpt/toktickit/pull/37#pullrequestreview-5698709294), e2ba4cc: ต้องมี action assignee/lifecycle ตาม rubric; ต้องมี append-only history ที่เก็บค่าเดิม/actor; Recently Resolved drill-down ต้องรวม Resolved+Closed ใน window เดียวกับ metric |
| Further suggestions | กำหนด performance fixture/warmup/p95 ให้ทำซ้ำได้; จำกัด/paginate list/history; ให้ stale check กับ write เป็น atomic พร้อม parallel-edit test |
| Their Response | [เพื่อนตอบและขอ re-review](https://github.com/PpAnpt/toktickit/pull/37#issuecomment-6499616614): เพิ่ม assignee/lifecycle, revision/Ticket event history, recent=updated/resolved, atomic timestamp token, pagination และ performance protocol |
| My Re-review | [CHANGES_REQUESTED รอบสอง](https://github.com/PpAnpt/toktickit/pull/37#pullrequestreview-5699694394), b749842: ตรวจแล้ว 3 ข้อเดิมและข้อเสนอแนะเพิ่มแก้ครบ มี 19 FR/39 BR/39 AC/144 planned rows ทุก AC mapped; เหลือขั้นตอน recovery ที่ใช้ migrate resolve --rolled-back กับ successful migration ซึ่งใช้ไม่ได้ใน Prisma 7 |
| Requested correction | [Inline finding](https://github.com/PpAnpt/toktickit/pull/37#discussion_r4413824789): แยก failed migration recovery จาก successful rollback; ใช้ pre-upgrade backup restore พร้อม baseline/migration history หรือ compensating migration ใหม่ และแก้ MIG-02 ให้ตรวจ schema/data/history; อัปเดต PR description เก่าเป็นข้อเสนอแนะไม่ block |
| Review boundary | อ่านเอกสารและตรวจ traceability ไม่ได้รัน application tests ของเพื่อน ไม่อ้างว่ามี approval หรือ merge หลัง request changes |

## Documentation and release integration (no peer review required)

| PR | Actual integration | Review record |
|---|---|---|
| [#59 Documentation](https://github.com/BBINGOAL/toktickit/pull/59) | feature8/lab4-docs-release -> lab4-staging; merged 112497e on 2026-10-31 at 08:34:05 Asia/Bangkok | The student explicitly waived review; the PpAnpt request was withdrawn. No approval is fabricated. |
| [#60 Release](https://github.com/BBINGOAL/toktickit/pull/60) | lab4-staging -> main; merged 768975d on 2026-10-31 at 08:39:17 Asia/Bangkok | The student clarified release PRs do not require peer review in this workflow. Seven product PR reviews above remain valid; no separate release approval is claimed. |

Fresh main verification: backend 278/278 + separate performance 1/1, client 109/109, all application Chromium 49/49, types/builds/lint/schema pass. Native isolated PostgreSQL and real baseline recovery were verified; these are author runs on main, distinct from the earlier reviewer-reported runs.
