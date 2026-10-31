# Peer Review Information

**My Information:**
- **Name:** ศิวรักษ์ ฉัตรวิชัย (Siwarak Chatvichai)
- **Student ID:** 67070501086
- **GitHub Username:** [BBINGOAL](https://github.com/BBINGOAL)

**My Peer Reviewer (คนที่มาตรวจโค้ดให้ผม):**
- **Name:** อนพัช บรรเจิดศิลป์
- **Student ID:** 67070501049
- **GitHub Username:** [PpAnpt](https://github.com/PpAnpt)

Review statements below come from the actual Lab 4 GitHub submissions; a reviewer-reported run is distinguished from the author's run.

## PR #52: Engineering contract

- **Link to PR they reviewed for me:** [PR #52](https://github.com/BBINGOAL/toktickit/pull/52)
- **Their Review Comment:** [APPROVED](https://github.com/BBINGOAL/toktickit/pull/52#pullrequestreview-5512844550), 2026-10-14T03:50:51Z (UTC).

| Subject | Actual record |
|---|---|
| Reviewer comment | อ่านครบทั้ง 7 ไฟล์เทียบกับ Lab 4 labsheet แล้ว โครงสร้างครบทุกหัวข้อตาม §9 และ AC-01..18 ทุกข้อมีเทสต์รองรับ matrix ตรงกับโค้ด Lab 3 จริง สรุป Approve ครับ มีข้อที่อยากให้ช่วยดูก่อนเริ่ม Issue 2:<br><br>1. **403 vs 404 (api-spec "Shared rules")** — ตอบ 403 เมื่อเป็นตั๋วของคนอื่น แต่ 404 เมื่อไม่มีตั๋ว ทำให้เดาได้ว่าตั๋วมีอยู่จริง ซึ่ง Lab 3 §6.2 ให้หลีกเลี่ยง แนะนำให้ non-owner Requester ได้ 404 เหมือนตั๋วที่ไม่มี และใช้ 403 เฉพาะบทบาทไม่มีสิทธิ์<br>2. **BR-13** — บังคับต้องมี action COMPLETED อย่างน้อย 1 รายการ ซึ่งเข้มกว่ากฎ Lab 3 ("ห้าม Resolve ขณะ Actions Taken ยังไม่เสร็จ") ตั๋วเดิมที่ไม่มี action จะ Resolve ไม่ได้ ช่วยเพิ่มใน Assumptions และบอกผลต่อ seed/regression ด้วยครับ<br>3. **BR-08 vs PATCH action** — BR-08 ไม่ให้ PLANNED→COMPLETED ตรงๆ แต่ api-spec เขียนว่า "started/completed in one patch" ช่วยระบุให้ชัดและเพิ่มใน UNIT-01<br>4. **ขอบเขต** — idempotency table, lock ทั้ง Ticket/User, followsUpActionId chain, workCycle, history endpoints อาจหนักเกิน 8 issue ลองแยก must-have / stretch ใน implementation-plan<br><br>ข้อเล็ก: FR-04 ไม่มีเทสต์อ้างอิง, BR-20 ไม่อยู่ในตาราง BR, ควรบอกว่าแสดงและเรียงด้วย actionDateTime หรือ createdAt, และ Kanban ต้องมี issue #44-#51 ก่อนส่ง (`gh auth refresh -s project`)<br> |
| My Response | [Actual author reply](https://github.com/BBINGOAL/toktickit/pull/52#issuecomment-6160807329): ขอบคุณสำหรับรีวิวครับ @PpAnpt ปรับเอกสารตามข้อเสนอแนะใน PR เดิมแล้ว ขอให้ช่วยยืนยันส่วนที่แก้อีกครั้งก่อน merge เข้า `lab4-staging` ครับ<br><br>1. **403/404:** non-owner Requester บน resource read ที่บทบาทอ่านได้ จะได้ 404/code/message เหมือน resource ที่ไม่มี ส่วน role-level denial เช่น action writes/Staff-only notes เป็น 403 ก่อน lookup ทุก ID อัปเดต API/BR-03/แผน regression แล้ว<br>2. **BR-13:** ยังคง completed-action minimum เป็น product decision ของ Sprint 4 พร้อมเหตุผลใน Assumptions ไม่อ้างว่า labsheet บังคับตรง ๆ หรือ Lab 3 เคย implement แล้ว ระบุผลต่อ seed/regression: legacy active zero-action Ticket ต้องมีงานจริงก่อน Resolve ใหม่; legacy RESOLVED/CLOSED ไม่ถูกสร้าง fake action ย้อนหลัง และยังอ่าน/close ได้ตามกฎเดิมจนกว่าจะ reopen<br>3. **BR-08/PATCH:** หนึ่ง transition ต่อ request; PLANNED -> COMPLETED ต้อง reject แม้มี result ต้อง Start แล้ว Complete คนละ request พร้อม version ใหม่ แก้ API/UI/UNIT-01 ชัดเจน<br>4. **Scope:** เพิ่มตาราง must-have/minimal mechanism/stretch และ owner issue ใน implementation-plan โดยแยก safety outcome ที่ต้องทำออกจากกลไกที่เราเลือก และไม่เพิ่ม generic lock/idempotency/event platform หรือ graph UI ถ้าต้องลดกลไกในภายหลังจะเสนอแก้ contract/tests ให้ตรงกันก่อน<br>5. เพิ่ม FR-04 ใน API-01/E2E-01; จัด BR-20..24 เป็นตาราง<br>6. ระบุ action list แสดง/เรียง `actionDateTime,id`; `createdAt` แสดงแยกเป็น Recorded at และใช้เรียง audit history แผน API-05 ตรวจเวลาสองชนิดที่ไม่ตรงกันด้วย<br>7. Kanban เดิมมี #44-#51 ครบแล้ว; #44 เชื่อม PR #52 และอยู่ In review แก้ข้อความสถานะเก่าในแผนแล้ว<br><br>ตรวจโครงเอกสาร/ลิงก์/traceability ผ่าน: FR 16, BR 24, AC 18, planned tests 37 แถว ยังไม่มี application implementation จึงคงผล feature tests เป็น Not run ตามจริงครับ<br><br>บันทึก initial APPROVED ที่ commit 02420fc แยกจาก revision ล่าสุดไว้ใน reviewer.md แล้ว รอบนี้ยังไม่ merge และยังไม่เริ่ม issue #45 ครับ<br> |

## PR #53: Actions Taken foundation and migration

- **Link to PR they reviewed for me:** [PR #53](https://github.com/BBINGOAL/toktickit/pull/53)
- **Their Review Comment:** [APPROVED](https://github.com/BBINGOAL/toktickit/pull/53#pullrequestreview-5568221570), 2026-10-19T07:27:19Z (UTC).

| Subject | Actual record |
|---|---|
| Reviewer comment | Approved ✅<br><br>ผมรันเทสบน DB แยก (สร้างใหม่ + migrate + seed) ผ่าน 124/124 สองรอบ และ `prisma migrate diff` ไม่มี drift<br><br>ข้อเสนอแนะ (ไม่ block การ merge):<br>1. เทส `lists only active staff/admin assignees` ใน `actions-taken.api.test.ts` พึ่งพาว่า staff ที่สร้างในเทสอยู่ใน 50 คนแรก ถ้ามี user ค้างใน DB เกิน 50 เทสจะล้ม แนะนำให้ใช้ `search` ด้วยชื่อ user ในเทส<br>2. `seed.ts` เปลี่ยนเป็น `update: {}` รัน seed ซ้ำจะไม่ reset บัญชีเดโม Lab 3 แล้ว ควรบันทึกไว้ใน docs<br>3. Ticket ที่ seed ใน `seed-lab4.ts` มี `version=0` ทั้งที่มี action อยู่ และ ticket OPEN ที่ไม่มี owner แต่มี action assign ให้ staff<br>4. พิจารณา CHECK constraint ระดับ DB ภายหลัง และลบ index `requesterId`/`ownerId` เดี่ยวที่ซ้ำกับ composite index ใหม่<br><br>จุดที่ดี: ลำดับ lock Ticket → User กัน deadlock, idempotency scope + payload digest, เทส concurrency ครอบคลุม, non-owner Requester ได้ 404<br> |
| My Response | [Actual author reply](https://github.com/BBINGOAL/toktickit/pull/53#issuecomment-6286073824): ขอบคุณสำหรับรีวิวและที่ช่วยรันเทสยืนยันให้อีกสองรอบครับ @PpAnpt 🙏<br><br>รับข้อเสนอแนะครบทั้ง 4 ข้อครับ สถานะติดตามคือ:<br><br>- ปรับเทส assignee ให้ค้นหาด้วยชื่อ fixture แล้ว ไม่พึ่งการอยู่ใน 50 คนแรก พร้อมคงกรณี inactive/Requester ให้ตรวจการกรองได้จริง แก้ใน PR #54 และ backend rerun ผ่าน 124/124 ครับ<br>- ระบุพฤติกรรม seed ที่ไม่ reset รหัสผ่าน/role/activity ของบัญชีเดิมไว้ในเอกสาร Lab 4 แล้ว ส่วน README จะรวมในงานเอกสารท้ายแลปครับ<br>- ความสอดคล้องของ version/owner ในข้อมูล demo ยังเป็นงานติดตามใน issue #47 ครับ<br>- CHECK constraints และ index ที่อาจซ้ำกัน รับไว้ตรวจใน issue #50 ยังไม่ได้อ้างว่าแก้เสร็จครับ<br><br>ขอบคุณที่ช่วยตรวจทั้งความปลอดภัยและความน่าเชื่อถือของชุดทดสอบครับ คำแนะนำช่วยให้เห็นจุดที่ต้องเก็บต่อได้ชัดขึ้นครับ<br> |

## PR #54: Actions Taken UI

- **Link to PR they reviewed for me:** [PR #54](https://github.com/BBINGOAL/toktickit/pull/54)
- **Their Review Comment:** [APPROVED](https://github.com/BBINGOAL/toktickit/pull/54#pullrequestreview-5581899545), 2026-10-20T07:20:06Z (UTC).

| Subject | Actual record |
|---|---|
| Reviewer comment | Approved ✅<br><br>ผมรันเทสแล้ว client 53/53 + `tsc -b` ผ่าน และ server 124/124 บน DB แยกที่สร้างใหม่ (E2E ไม่ได้รันเอง ใช้ตามที่รายงานใน PR) ขอบคุณที่แก้ข้อเสนอแนะจาก #53 ครบ<br><br>ข้อเสนอแนะ (ไม่ block):<br>1. Timezone: ช่องกรอกบอก "local timezone" แต่การแสดงผลเป็น Asia/Bangkok เสมอ ควรให้สอดคล้องกัน หรือใส่ป้ายบอกโซนข้างช่องกรอก<br>2. ปิด dialog ตอนมี submission ที่ไม่แน่ใจ (response หาย): ควร refresh รายการ หรือเตือนว่า request เดิมอาจสำเร็จไปแล้ว<br>3. `frozen` อ่านจาก `intent.current` (ref) ใน render ควรเก็บเป็น state<br>4. พิจารณาแยก `ActionsTaken.tsx` (301 บรรทัด) เป็นหลายไฟล์ภายหลัง<br><br>จุดที่ดี: idempotency key + exact-intent retry, เก็บ draft เมื่อ conflict, focus trap ครบ, ไม่แสดง error ดิบจาก server<br> |
| My Response | [Actual author reply](https://github.com/BBINGOAL/toktickit/pull/54#issuecomment-6286074513): ขอบคุณสำหรับรีวิวและที่ช่วยยืนยัน client 53/53, TypeScript และ server 124/124 ครับ @PpAnpt 🙏<br><br>รับทราบข้อเสนอแนะทั้ง 4 ข้อครับ ทั้งป้าย timezone ของช่องกรอก, การเตือน/refresh เมื่อปิด dialog หลัง response หาย, การใช้ state สำหรับสถานะ submission แทนอ่าน ref ใน render และการแยก ActionsTaken.tsx ให้ดูแลง่ายขึ้น จะนำไปติดตามในงานปรับปรุงถัดไปพร้อมทดสอบพฤติกรรมเดิมซ้ำครับ ตอนนี้ยังไม่ได้แก้สี่ข้อนี้ จึงไม่ขอสรุปว่าเรียบร้อยแล้วครับ<br><br>ขอบคุณที่แยกชัดเจนด้วยว่า E2E อ้างอิงผลที่รายงานใน PR ไม่ใช่ชุดที่ reviewer รันเอง และขอบคุณสำหรับคำแนะนำเรื่อง retry/draft/focus ครับ<br> |

## PR #55: Ticket workflow and resolution

- **Link to PR they reviewed for me:** [PR #55](https://github.com/BBINGOAL/toktickit/pull/55)
- **Their Review Comment:** [APPROVED](https://github.com/BBINGOAL/toktickit/pull/55#pullrequestreview-5638567438), 2026-10-24T14:17:58Z (UTC).

| Subject | Actual record |
|---|---|
| Reviewer comment | Approved ✅<br><br>ผมรันเทสแล้ว server 209/209 (DB แยกที่สร้างใหม่) และ client 61/61 + typecheck ผ่าน (E2E ไม่ได้รันเอง ใช้ตามที่รายงานใน PR) ขอบคุณที่ตอบข้อเสนอแนะจาก #53/#54 ครบ<br><br>ข้อเสนอแนะ (รบกวนตอบกลับด้วยครับ โดยเฉพาะข้อ 1):<br>1. `detailInclude` ใน `workflow.ts` ไม่กรอง `isRemoved:false` เหมือน route เดิมใน `GET /tickets/:id` และเพิ่ม `removedAt`/`removalReason` ใน select ทำให้ไฟล์ที่ถูกลบกลับมาในรายการ และ Requester เห็นเหตุผลที่ staff ลบ ถ้าไม่ได้ตั้งใจให้ใส่ `where: { isRemoved: false }` กลับ ถ้าตั้งใจควรมีเทสและบันทึกใน spec<br>2. owner/priority แก้ได้ทุกสถานะ รวมถึง CLOSED/CANCELLED ช่วยยืนยันว่าตรงกับ spec<br>3. Resolve ไม่ได้บังคับว่าผู้กดต้องเป็น owner ถ้า spec ต้องการ owner เท่านั้นต้องเพิ่มเงื่อนไข<br>4. ควรบันทึกใน PR/`tests.md` ว่า 403→404 สำหรับ cross-requester เป็นการเปลี่ยนพฤติกรรมของ Lab 2/3<br><br>จุดที่ดี: ลำดับ lock Ticket → User, cancel ticket ยกเลิก pending actions ใน transaction เดียว, reopen เพิ่ม workCycle และล้างค่าเก่า, resolution gate ตรวจ follow-up แบบ recursive, idempotency replay/digest mismatch<br> |
| My Response | [Actual author reply](https://github.com/BBINGOAL/toktickit/pull/55#issuecomment-6459305158): ขอบคุณครับ @PpAnpt สำหรับการรีวิวและรันทดสอบให้ครับ ผมตรวจข้อเสนอแนะทั้ง 4 ข้อแล้ว:<br><br>1. GET detail เปลี่ยนจาก route เดิมที่กรองเฉพาะ active attachments จริงครับ แต่ `docs/lab-02/specification.md` BR-19 และ AC-17 กำหนดให้ไฟล์ที่ soft-remove แล้วยังแสดง metadata และเหตุผล โดยดาวน์โหลด/preview ไม่ได้ และหน้า Ticket Detail มีการแสดง REMOVED/เหตุผลอยู่แล้ว จึงไม่ควรใส่ตัวกรองกลับโดยไม่พิจารณาข้อกำหนดนี้ ควรเพิ่มเทสเฉพาะว่า metadata คงอยู่หลังโหลดใหม่และดาวน์โหลดไฟล์ที่ลบไม่ได้ พร้อมอธิบายในเอกสาร Lab 4 ก่อนแนะนำ merge ครับ ขณะนี้ยังไม่ได้เพิ่มเทสหรือแก้เอกสารดังกล่าว<br>2. โค้ดปัจจุบันอนุญาต Staff/Admin เปลี่ยน owner/priority ได้ทุกสถานะ รวม CLOSED/CANCELLED โดยตรวจ version และบันทึก event ไม่เปลี่ยนสถานะหรือปลดล็อก Actions เอกสารไม่ได้กำหนดข้อห้ามตามสถานะไว้ แต่ควรเขียนนโยบายให้ชัดและเพิ่ม coverage ของ terminal states ครับ<br>3. BR-13 บังคับให้ Ticket มี owner ที่เป็น active Staff/Admin และผ่าน resolution gate แต่ไม่ได้กำหนดว่าผู้กด Resolve ต้องเป็น owner ผู้กดต้องเป็น Staff/Admin ที่ผ่านการตรวจสิทธิ์ และ history บันทึก actor จริงครับ ควรชี้แจงความแตกต่างระหว่าง eligible Ticket owner กับผู้ดำเนินการให้ชัดขึ้น<br>4. เห็นด้วยครับ `api-spec.md` และ BR-03 ระบุนโยบาย 404 แบบไม่เปิดเผยการมีอยู่ของ Ticket แล้ว แต่ควรเพิ่มใน PR/`tests.md` อย่างชัดเจนว่าเปลี่ยนพฤติกรรมเดิมของ Lab 2/3 จาก ownership 403 เป็น 404 สำหรับ cross-requester resource access; role-level denial ยังเป็น 403<br><br>รับข้อเสนอแนะไว้เป็นงานติดตามก่อนแนะนำ merge ครับ ขอบคุณที่ช่วยชี้จุดด้าน compatibility และขอบเขตสิทธิ์ครับ<br> |

## PR #56: Requester Dashboard

- **Link to PR they reviewed for me:** [PR #56](https://github.com/BBINGOAL/toktickit/pull/56)
- **Their Review Comment:** [APPROVED](https://github.com/BBINGOAL/toktickit/pull/56#pullrequestreview-5682178217), 2026-10-28T11:55:19Z (UTC).

| Subject | Actual record |
|---|---|
| Reviewer comment | Approved ✅<br><br>ผมรันเทสแล้ว server 244/244 (DB แยกที่สร้างใหม่) และ client 72/72 + typecheck ผ่าน (E2E ไม่ได้รันเอง ใช้ตามที่รายงานใน PR) ขอบคุณที่ตอบข้อเสนอแนะจาก #55 ครบพร้อมเทส<br><br>ข้อเสนอแนะ (ไม่ block):<br>1. `router.get(['/dashboards/requester', '/tickets'])` ใช้ handler เดียวแยกพฤติกรรมด้วย `req.path` แนะนำให้แยกเป็นสอง handler<br>2. `updatedSince`/`resolvedSince` รับ offset `+07:00` แต่ `+` ที่ไม่ได้ encode จะกลายเป็นช่องว่างแล้วได้ 400 ควรเขียนใน `api-spec.md` ว่าต้อง encode เป็น `%2B`<br>3. `RoleRoute` เปลี่ยนจาก redirect ไป `/` เป็นแสดง "Access denied" ในทุกหน้าที่ใช้ ควรบันทึกใน `tests.md`/PR<br>4. ดาวน์โหลดไฟล์ที่ลบแล้วเปลี่ยนจาก 404 เป็น 410 ช่วยยืนยันว่า UI ไม่ได้พึ่ง 404<br><br>จุดที่ดี: ตัวเลขการ์ดตรงกับรายการ drill-down ผ่าน `asOf` เดียวกัน, query ทุกตัวผูกกับ requesterId, ตรวจ query string เข้มงวด<br> |
| My Response | [Actual author reply](https://github.com/BBINGOAL/toktickit/pull/56#issuecomment-6468406174): ขอบคุณครับ @PpAnpt สำหรับการรีวิวและรัน server 244/244, client 72/72 พร้อม typecheck ให้ครับ ผมตรวจข้อเสนอแนะทั้ง 4 ข้อแล้ว:<br><br>1. เห็นด้วยครับ การแยก Dashboard กับ Ticket list เป็นคนละ handler จะอ่านและขยายต่อได้ชัดกว่า รับไว้ทำตอนต่อ Staff Dashboard (#49) โดยคง role checks, validation และ safe error behavior เดิม ขณะนี้ยังไม่ได้ refactor ครับ<br>2. ยืนยันว่า offset `+07:00` ใน query string ต้อง encode เครื่องหมาย `+` เป็น `%2B` ครับ ตัวแอปใช้ URLSearchParams ซึ่งจัดการ encoding ให้อยู่แล้ว และลิงก์จาก Dashboard ใช้ UTC `Z` จึงไม่เจอปัญหานี้ จะเพิ่มตัวอย่างสำหรับผู้เรียก API เองใน api-spec.md ของ increment ถัดไปครับ<br>3. ยืนยันว่า RoleRoute ทุกหน้าที่ใช้งานเปลี่ยนเป็นแสดง Access denied เมื่อผู้ใช้มี session แต่ role ไม่ตรง ส่วนผู้ไม่มี session ยัง redirect ไปหน้า sign-in ตามเดิมครับ ui-spec.md ระบุ wrong-role protected routes ไว้แล้ว แต่ควรเพิ่มบันทึก compatibility ใน tests.md/PR ของ increment ถัดไปให้ชัดเจนตามที่แนะนำ<br>4. ตรวจโค้ด UI แล้วไม่ได้แยกกรณีด้วย status 404 ครับ AttachmentRow ซ่อน Download/Remove เมื่อ isRemoved=true; downloadAttachment ตรวจ `!res.ok` สำหรับทุก non-2xx ก่อนอ่าน blob และหน้าจอจับข้อผิดพลาดแบบทั่วไป ดังนั้น 410 ยังเข้า error path เดิม ไม่มีการดาวน์โหลดหรืออ่าน blob ต่อ สำหรับกรณีข้อมูลบนหน้าจอเก่าก่อนที่ไฟล์จะถูกลบ backend ยังปฏิเสธด้วย 410 ครับ เทส API ใน PR ยืนยัน 410 สำหรับ authorized reader และ identical 404 สำหรับ missing/non-owned แล้ว ส่วนคำยืนยันเรื่อง UI นี้มาจากการตรวจโค้ด ไม่ใช่การอ้างว่ารัน UI 410 test ใหม่<br><br>ข้อเสนอแนะระบุว่าไม่ block และจากการตรวจไม่พบเหตุที่ต้องหยุด merge ครับ Approval ตรงกับ head 947e090 และ GitHub แสดง CLEAN/MERGEABLE จึงแนะนำให้ merge เข้า lab4-staging ได้ โดยเก็บข้อ 1-3 เป็น follow-up ใน increment ถัดไป ขอบคุณครับ<br> |

## PR #57: Staff/Admin Dashboard

- **Link to PR they reviewed for me:** [PR #57](https://github.com/BBINGOAL/toktickit/pull/57)
- **Their Review Comment:** [APPROVED](https://github.com/BBINGOAL/toktickit/pull/57#pullrequestreview-5683665723), 2026-10-28T13:47:17Z (UTC).

| Subject | Actual record |
|---|---|
| Reviewer comment | Approved ✅<br><br>ผมรันเทสแล้ว server 278/278 (DB แยกที่สร้างใหม่) และ client 93/93 + typecheck ผ่าน (E2E ไม่ได้รันเอง ใช้ตามที่รายงานใน PR) ขอบคุณที่แก้ข้อเสนอแนะจาก #56 ครบ<br><br>ข้อเสนอแนะ (ไม่ block):<br>1. `?actionId=abc` ได้ 400 และ client แสดง "Check the action fields below." ซึ่งชวนสับสน ควรตรวจที่ client หรือใช้ข้อความเฉพาะกรณีลิงก์<br>2. `?actionId=` ค้างใน URL หลังปิด dialog ทำให้ refresh แล้วเปิดซ้ำ ควรลบ param ตอนปิด (replace)<br>3. `windowStart` ใน Staff Dashboard ไม่ได้ใช้ ควรตัดออกหรืออธิบายใน api-spec<br>4. การ์ด Staff เป็น snapshot แต่ลิงก์เข้า Queue เป็นข้อมูลสด ควรแสดง "as of" ใกล้การ์ด<br><br>จุดที่ดี: role middleware ครบทุก endpoint, My Actions นับตาม assignee และ ticket ที่ยัง active, เทส independent count ของทุกการ์ดเทียบกับ DB<br> |
| My Response | [Actual author reply](https://github.com/BBINGOAL/toktickit/pull/57#issuecomment-6471169069): ขอบคุณครับ @PpAnpt สำหรับการรีวิวและรัน backend 278/278, client 93/93 พร้อม typecheck ให้ครับ ผมตรวจข้อเสนอแนะกับโค้ดปัจจุบันแล้ว:<br><br>1. ยืนยันว่า actionId ที่ผิดรูปแบบถูก backend ปฏิเสธ 400 แต่ใช้ข้อความกลางสำหรับฟอร์ม Action จึงสับสนกับการเปิดลิงก์ครับ รับไว้ใน #50 ให้ตรวจ ID/ใช้ข้อความเฉพาะลิงก์ พร้อม regression ที่ไม่เปิด dialog หรือส่งคำขอที่ไม่เหมาะสม<br>2. ยืนยันว่าปิด dialog ตอนนี้ล้างเฉพาะ view state ยังไม่ลบ actionId ที่มีค่าออกจาก URL ทำให้ reload แล้วเปิดซ้ำได้ครับ รับไว้ใน #50 ให้ปิดผ่าน callback ที่ลบเฉพาะ actionId ด้วย replace โดยคง query อื่น และทดสอบ Close/Escape/reload ไม่เพิ่ม history ที่ไม่จำเป็น (กรณี actionId ว่างเปล่าปัจจุบันถูกมองเป็น undefined และไม่เปิด dialog)<br>3. windowStart มาจาก metadata helper ที่แชร์กับ Requester จริง แต่ไม่ได้เป็นตัวกรอง metrics ของ Staff ครับ Staff counts ใช้ predicate สถานะ/owner/assignee ตาม spec ส่วน recent preview เรียง updatedAt ทุกช่วงเวลา จะชี้แจงใน api-spec ของ #50 ว่า windowStart เป็น metadata ที่ไม่ได้ใช้จำกัด Staff metrics เพื่อไม่ให้เข้าใจว่าเป็นยอดเจ็ดวัน และคง response compatibility<br>4. ปัจจุบันมีข้อความ Snapshot พร้อม asOf/timezone อยู่ก่อนการ์ดแล้วครับ แต่ยังควรเพิ่มคำอธิบายชัด ๆ ว่าลิงก์ Queue/My Actions ดึงข้อมูลปัจจุบัน ยอดจึงอาจต่างหลังมีการเปลี่ยนแปลง รับปรับข้อความและ coverage ใน #50 ครับ ไม่ควรอ้างว่าเป็นการเปิด historical snapshot<br><br>ข้อเสนอแนะทั้งสี่ระบุว่าไม่ block และไม่พบการข้ามสิทธิ์หรือความผิดพลาดในสูตรจากจุดที่ตรวจครับ Approval ตรง head ล่าสุด 191e425 และ GitHub แสดง CLEAN/MERGEABLE จึงแนะนำให้ merge PR นี้เข้า lab4-staging ได้ แล้วเก็บรายละเอียดข้างต้นใน issue #50 ตามลำดับงาน ยังไม่ได้แก้โค้ดหรืออ้างว่าทดสอบการแก้ไขเหล่านี้แล้วครับ ขอบคุณครับ<br> |

## PR #58: Final regression and product hardening

- **Link to PR they reviewed for me:** [PR #58](https://github.com/BBINGOAL/toktickit/pull/58)
- **Their Review Comment:** [APPROVED](https://github.com/BBINGOAL/toktickit/pull/58#pullrequestreview-5701988526), 2026-10-29T17:16:21Z (UTC).

| Subject | Actual record |
|---|---|
| Reviewer comment | Approved ✅<br><br>อัปเดตจากรีวิวก่อนหน้า: ผมรันเทสเองแล้ว<br>- server 279/279 (25 ไฟล์ รวม performance smoke) บน DB แยกที่สร้างใหม่ + `tsc --noEmit` ผ่าน<br>- client 109/109 (20 ไฟล์) + `tsc -b` ผ่าน<br>ตรงกับตัวเลขใน PR body (backend 278 + perf 1) E2E 49/49 ไม่ได้รันเอง ใช้ตามที่รายงานใน PR<br><br>ข้อเสนอแนะเดิม 3 ข้อยังเหมือนเดิมและไม่ block การ merge (คอมเมนต์ชี้ predicate My Actions ใน raw SQL ไปที่ `myActionsQuery`, เปลี่ยนชื่อ class `action-*` ใน `Dialog.tsx`, ตรวจข้อความ error ของการอัปโหลดต่อไฟล์)<br> |
| My Response | [Actual author reply](https://github.com/BBINGOAL/toktickit/pull/58#issuecomment-6527514521): ขอบคุณสำหรับการรีวิวและรันเทสยืนยันครับ @PpAnpt ผมอ่านทั้งรีวิวแรกและอัปเดต Approved แล้ว ผล server 279 (backend 278 + performance 1) และ client 109 ตรงกับหลักฐานใน PR ส่วน E2E 49 เคสเป็นผลที่ผมรันไว้ ไม่ได้ถือว่าเพื่อนรัน E2E ซ้ำครับ<br><br>ตรวจข้อเสนอแนะทั้ง 3 ข้อแล้ว:<br>1. raw SQL preview ใช้ current assignee + pending Action + active parent ตรงกับ myActionsQuery ปัจจุบัน และมี comment รักษา predicate เดียวกับ My Actions แล้ว การระบุชื่อ myActionsQuery/dashboard-rules.ts ให้ชัดขึ้นจะช่วยบำรุงรักษาได้ครับ<br>2. action-backdrop/action-dialog เป็นชื่อเดิมที่นำมาใช้ร่วมกับ Admin และ attachment removal การเปลี่ยนเป็นชื่อกลาง dialog-* เป็น refactor ที่เหมาะสม แต่ไม่ได้เปลี่ยนพฤติกรรมหรือเป็น blocker ของ PR นี้ครับ<br>3. ตรวจ uploadAttachment -> responseError และ endpoint แล้ว: ข้อความ 5xx/response ที่อ่าน JSON ไม่ได้ถูกแทนด้วย Failed to upload attachment; responseError อนุญาตข้อความ validation เฉพาะ 400/409/422 และ endpoint upload ส่งข้อความที่กำหนดไว้ ไม่ส่ง exception ดิบ ตัว helper เดียวกันมี transport regression ตรวจ 500 ที่ใส่ SQL PRIVATE passwordHash ใน write API อื่น และ E2E มี upload 500 แล้วรักษาหน้า saved-number; ยังไม่ได้อ้างว่ามี upload-specific PRIVATE-message test จึงไม่พบการรั่วข้อความภายในตามกรณีที่ทักครับ ขอบเขตนี้ไม่ได้อ้างว่ากรองข้อความจากทุกแหล่งหรือทุก API ทั้งระบบ<br><br>รับทราบข้อเสนอแนะเรื่องชื่อ/comment ไว้สำหรับปรับการอ่านโค้ดต่อครับ ตอนนี้ยังไม่ได้แก้หรือ push เพิ่มจาก head 98bc6cf ที่ได้รับ Approved และจะรอ staging merge ก่อนเริ่ม issue ถัดไป ขอบคุณครับ<br> |
| Initial review | [COMMENTED before reviewer reran tests](https://github.com/BBINGOAL/toktickit/pull/58#pullrequestreview-5701869502). Three nonblocking suggestions: identify myActionsQuery next to the SQL predicate, use generic dialog-* class names, and check per-file upload error text. |
| Disposition | Predicate parity was inspected; the existing comment already states the shared My Actions rule. Generic class naming is optional and remains unchanged. Upload calls responseError: outage/non-JSON text becomes a safe fallback, while known validation messages remain. The helper has PRIVATE-message checks on other write transports; no claim of a dedicated upload PRIVATE-message test. No source change followed approval. |
| Integration | Approved 98bc6cf; merged as e25284be30c35a679069491092c356b574afc7aa into lab4-staging on 2026-10-31 at 01:36 Asia/Bangkok. |

## Follow-up implementation evidence

### PR #57 feedback and follow-up in #50

PpAnpt approved exact head 191e425 on 2026-10-28 at 20:47 Asia/Bangkok, reporting backend 278/278 on a fresh isolated DB, client 93/93 and typecheck; E2E was explicitly not rerun by the reviewer. Author replied with thanks and accurate dispositions at 21:06. GitHub merged PR #57 into lab4-staging as 85a06ed on 2026-10-29 at 20:32. All four suggestions were nonblocking.

| Suggestion | Actual follow-up in #50 |
|---|---|
| Invalid actionId uses form error | Client validates IDs and gives link-specific feedback before GET; regression covers malformed values and inaccessible-link retry. |
| Closing details leaves actionId in URL | Callback removes only actionId with replace; Close/Escape/reload/unrelated-query/history-length regressions. Literally empty actionId already opened no dialog. |
| Staff windowStart is unused | API doc explains compatible shared metadata, never a Staff seven-day predicate; no formula changed. |
| Card snapshot versus live Queue | Existing asOf retained; adjacent current-data explanation and component coverage added. |

See [hardening verification](hardening-verification.md). These changes are submitted for a new peer review, not claimed covered by PR #57's approval.

### PR #56 feedback and follow-up in #49

PpAnpt approved latest head 947e090 on 2026-10-28 at 18:55 Asia/Bangkok, reporting backend 244/244 on a fresh isolated DB, client 72/72 and typecheck. Reviewer explicitly did not rerun E2E. All four suggestions were nonblocking. Author replied with thanks/dispositions at 18:59; GitHub records staging merge cdc2a65 at 19:03. These are actual review records, not inferred AI-tool use.

| Suggestion | Actual follow-up |
|---|---|
| Split shared req.path-switching Requester handler | Separate explicit Dashboard/list handlers with shared role/error helpers, extended for Staff; earlier Requester regression passes. |
| Document encoded + in timezone offsets | api-spec.md adds %2B example and equivalent Z; transport test verifies the decoded value and credentialed request. |
| Document global RoleRoute behavior change | tests.md/UI/spec and PR compatibility notes distinguish authenticated Access denied from signed-out redirect; two App regression cases pass. |
| Confirm removed-download 410 UI compatibility | Prior author reply inspected code only; #49 now adds a transport regression asserting 410 rejects before blob handling. No false claim that this test existed during the earlier response. |

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
| Split ActionsTaken.tsx later | #50 splits list/editor/details/history/pager/presentation and reuses the accessible Dialog; lifecycle/draft/focus regressions retained |

Actual author replies: [PR #53 response](https://github.com/BBINGOAL/toktickit/pull/53#issuecomment-6286073824), [PR #54 response](https://github.com/BBINGOAL/toktickit/pull/54#issuecomment-6286074513). Going forward, read the review and reply with thanks plus accurate dispositions before recommending merge; never claim pending suggestions were already fixed.

### PR #53 feedback and follow-up

Reviewer: PpAnpt, APPROVED on 2026-10-19 at 14:27 Asia/Bangkok, for the latest head f6bae9e. The reviewer reports 124/124 tests twice on a newly migrated/seeded isolated database and no Prisma schema drift. This is the reviewer's reported verification, not a new author rerun. All four suggestions were explicitly nonblocking. GitHub merge is 3465088cd7f38bca224b5a99ce86fc19da929d61 into lab4-staging on 2026-10-20.

| Suggestion | Follow-up status |
|---|---|
| Assignee test depends on the fixture user appearing in the first 50 global matches | Issue #46 searches its unique staff name with matching inactive/Requester control prefixes, retaining meaningful exclusion assertions. Changed test passes in the 124/124 native PostgreSQL 18.1 rerun on 2026-10-20. |
| Repeat seed uses update: {} and no longer resets Lab 3 demo accounts | Documented explicitly in implementation-plan.md and ui-verification.md; keep current credentials/roles/activity and do not use repeat seed as a password reset. README consolidation remains #51. |
| Demo Tickets have version 0 despite actions; OPEN sample has no owner but assigned actions | #47 documents the initial-snapshot decision: version is a concurrency token, not child count; unowned Tickets may have assigned work but cannot resolve until owner/work gates pass. Gate/owner/legacy-zero-action tests pass. No demo rewrite or fictional historical events; see specification section 7 and workflow-verification.md. |
| Consider DB CHECK constraints and remove redundant single-column requesterId/ownerId indexes | #50 inspects actual indexes and measures the representative workload; retains legacy indexes and application validation without a new migration. Explicit rationale/limits are in hardening-verification.md; no claim of production query-plan proof or privileged-SQL protection. |

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


## Who I Reviewed (คนที่ผมไปตรวจโค้ดให้เขา)

- **Name:** อนพัช บรรเจิดศิลป์
- **Student ID:** 67070501049
- **GitHub Username:** [PpAnpt](https://github.com/PpAnpt)
- **Link to PR I reviewed for them:** [PR #37: Sprint 4 engineering contract](https://github.com/PpAnpt/toktickit/pull/37)

### CHANGES_REQUESTED: 2026-10-29T13:44:57Z

[GitHub record](https://github.com/PpAnpt/toktickit/pull/37#pullrequestreview-5698709294)

ขอบคุณที่เตรียม engineering contract และ test plan ก่อน implementation ครับ ผมตรวจ diff ครบทั้ง 5 ไฟล์ที่ commit e2ba4cc เทียบกับ Lab4_Labsheet.md ใน PR และสัญญา API/Prisma ของ base branch ของ repo นี้แล้ว

ตรวจโครงสร้างได้ 16 FR, 28 BR, 30 AC และ 111 แถว planned tests; ทุก AC มี mapping และ test IDs ที่อ้างในตาราง traceability มีอยู่จริง จุดที่ดีคือ ownership/non-disclosure, ขอบเขต Asia/Bangkok, independent database counts, legacy migration และการเก็บ input เมื่อเกิด conflict ถูกระบุไว้

ขอ Request changes ก่อน merge contract เนื่องจากมี 3 ประเด็นใน inline comments: (1) Action assignment/lifecycle ไม่ครอบคลุมหลักฐาน Part 6 ของ labsheet (2) ยังไม่มีข้อกำหนดประวัติ append-only ที่ตรวจสอบย้อนหลังได้ตาม Part 7 และ (3) Recently Resolved drill-down ใช้คนละ predicate กับ metric

ขอแก้ specification, API, UI และ AC/test mapping ให้สอดคล้องกันใน PR นี้ก่อนเริ่ม implementation ครับ ไม่จำเป็นต้องใช้รูปแบบ implementation เดียวกับ repo ผม แต่ต้องอธิบายและทดสอบข้อกำหนดของ labsheet ให้ครบ

ข้อเสนอแนะเพิ่มเติม: PERF-01/02 ควรกำหนดขนาด fixture, จำนวน request, วิธีสรุปเวลา และสภาพแวดล้อมให้วัดซ้ำได้; Actions list ควรมีขอบเขต/pagination เมื่อข้อมูลมากขึ้น ส่วน concurrency ควรระบุให้ชัดว่า stale check กับ write เป็น atomic และมี parallel-edit test ไม่ใช่ตรวจ timestamp แล้วเขียนแยกกัน

การตรวจครั้งนี้เป็น document/contract review และ static traceability check เท่านั้น ยังไม่ได้รัน server/client/E2E ของ PR เพื่อน และไม่ได้เปลี่ยนโค้ดหรือ merge ให้ครับ

### Their Response: 2026-10-29T14:36:22Z

[GitHub record](https://github.com/PpAnpt/toktickit/pull/37#issuecomment-6499616614)

ขอบคุณสำหรับ review ครับ แก้ครบทั้ง 3 ประเด็นและข้อเสนอแนะเพิ่มเติมแล้ว (commits 85fdfdb, 1d821f2, 9194546 และล่าสุดของ tests.md):

**P1: Action assignee และ lifecycle**: เพิ่ม `assigneeId` (active staff/admin แยกจาก Performed by และ Ticket Owner) และ `status` (Planned / In Progress / Completed / Cancelled) พร้อมกฎ transition, Result บังคับเมื่อ Complete/Cancel, inactive-assignee rejection, auto-cancel เมื่อ Ticket ถูก Cancelled และ resolution gate ใหม่ (`RESOLUTION_GATE_FAILED`) → spec BR-29..32, FR-17/18, AC-31..33, AC-39; API 2.3/2.4; UI 4.3; tests API-17..23, UI-26/27/30, E2E-13/15/16

**P2: append-only history**: แยก current-state record ออกจากหลักฐานประวัติ เพิ่ม `ActionTakenRevision` (before/after snapshot, actor, เวลา, revisionNo) และ `TicketEvent` (status/owner/priority) เขียนใน transaction เดียวกับการเปลี่ยนแปลง มี DB trigger ห้าม UPDATE/DELETE และ API/UI ดูประวัติเฉพาะ staff → BR-33..37, FR-19, AC-34..37; API 2.6/2.7; tests HIST-01..10, UI-28, E2E-14

**P2: Recently Resolved drill-down**: เพิ่ม `recent=updated|resolved` ใน My Tickets ใช้ predicate/window เดียวกับ metric (รวม Resolved→Closed ใน window และตัด Resolved เก่าออก) ทำให้ทุกการ์ด Requester มี exact drill-down → BR-39, AC-20; tests DASH-09/10, WF-15, E2E-09

**ข้อเสนอแนะเพิ่มเติม**
- Concurrency: ระบุเป็น atomic `UPDATE ... WHERE updatedAt = expected` ใน transaction เดียวกับ history และ token ใหม่ = `GREATEST(now, previous + 1ms)` → BR-20; tests UNIT-07, WF-13 (parallel edits), WF-14 (rollback)
- Pagination: actions list และ history → BR-38, AC-38; tests API-24, HIST-10, UI-29
- Performance: กำหนด fixture (5,000 tickets / 20,000 actions, seed คงที่), 3 warm-up + 30 requests, ผ่านเมื่อ p95 < 1s และเก็บ summary → tests.md ข้อ 6, AC-30

รบกวน re-review ครับ

### CHANGES_REQUESTED: 2026-10-29T14:46:48Z

[GitHub record](https://github.com/PpAnpt/toktickit/pull/37#pullrequestreview-5699694394)

ขอบคุณครับ @PpAnpt ผมอ่าน reply และตรวจ 4 commits ที่เพิ่มจาก e2ba4cc ถึง b749842 แล้ว ทั้ง 3 ประเด็นเดิมแก้ใน contract ครบ: Action มี assignee/lifecycle พร้อม API/UI/seed/tests, มี revision+Ticket event history และ immutability, และ recent=updated|resolved ใช้ predicate เดียวกับ metric รวม Closed ใน window ครับ

ข้อเสนอแนะเพิ่มเติมเรื่อง atomic compare-and-set/token ที่เปลี่ยนอย่างน้อย 1ms, pagination และ performance fixture/warmup/p95 ก็ระบุชัดขึ้นแล้ว ตรวจ static traceability ได้ 19 FR, 39 BR, 39 AC และ 144 planned test rows; ทุก AC มี mapping และไม่มี test ID ที่อ้างแล้วหาไม่พบ ทั้งนี้ยังไม่ได้รัน application tests เพราะ PR นี้เป็นเอกสารก่อน implementation

ขอแก้ก่อน Approve อีก 1 จุดใน specification.md ข้อ 7.4 และ MIG-02: ขั้นตอน rollback/recovery ยังใช้ migrate resolve --rolled-back หลังย้อน migration ที่สำเร็จแล้ว ซึ่ง Prisma 7 ไม่รองรับ รายละเอียดและทางเลือกที่ทำซ้ำได้อยู่ใน inline comment ครับ ประเด็นนี้เป็นข้อผิดพลาดของขั้นตอนที่กำหนดใน contract ไม่ใช่การขอเพิ่ม product feature หรือบังคับให้ใช้แบบเดียวกับ repo ผม

เพิ่มเติมเล็กน้อยที่ไม่ block: ปรับ PR description ให้ตรง FR/BR/AC ล่าสุดและเอาข้อความ assign=Ticket Owner/no Action status เดิมออก เพื่อให้ผู้ตรวจอ่าน scope ได้ตรงกับไฟล์ที่แก้แล้วครับ

Review scope: documentation/contract and static traceability only. No peer application tests were run, and no approval/merge of this PR is claimed. The three initial findings were addressed; the re-review requested a correction to successful-migration recovery in specification 7.4 and MIG-02.
