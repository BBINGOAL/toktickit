# Peer Review Information

**My Information:**
- **Name:** ศิวรักษ์ ฉัตรวิชัย (Siwarak Chatvichai)
- **Student ID:** 67070501086
- **GitHub Username:** [BBINGOAL](https://github.com/BBINGOAL)

**My Peer Reviewer (คนที่มาตรวจโค้ดให้ผม):**
- **Name:** อนพัช บรรเจิดศิลป์
- **Student ID:** 67070501049
- **GitHub Username:** [PpAnpt](https://github.com/PpAnpt)

ตารางข้อเสนอแนะและผลติดตามเป็นสรุป ส่วนหัวข้อ My Response / Their Response (ข้อความจริงจาก GitHub) คัดข้อความตอบเต็มตามต้นฉบับโดยไม่ย่อหรือเรียบเรียงใหม่ พร้อมผู้ตอบและลิงก์ต้นทาง ผลติดตามภายหลังแยกจากสิ่งที่ผู้ตอบระบุ ณ เวลานั้น ไม่อ้างว่า reviewer รันทดสอบส่วนที่เขาระบุว่าไม่ได้รัน

## Lab 4 PR Coverage

ตรวจรายการ PR, review submissions, inline comments และคำตอบบน GitHub วันที่ 31 ตุลาคม 2026 ขอบเขตครอบคลุม PR ของ Lab 4 ฝั่งผมที่มีอยู่ก่อนอัปเดตเอกสาร คือ #52-#61 พร้อม PR เอกสารฉบับนี้ #62 และ PR ของเพื่อนที่ผมไปรีวิวคือ #37 ไม่นำ PR ของ Lab 3 มานับรวม

| PR | Scope | Review status | Integration |
|---|---|---|---|
| [#52](https://github.com/BBINGOAL/toktickit/pull/52) | Sprint 4 engineering contract | PpAnpt APPROVED; มีเอกสารแก้ตามคำแนะนำหลัง initial approval | Merged into lab4-staging: `7922e0e` |
| [#53](https://github.com/BBINGOAL/toktickit/pull/53) | Actions Taken foundation / migration / APIs | PpAnpt APPROVED | Merged into lab4-staging: `3465088` |
| [#54](https://github.com/BBINGOAL/toktickit/pull/54) | Actions Taken UI | PpAnpt APPROVED | Merged into lab4-staging: `10dd684` |
| [#55](https://github.com/BBINGOAL/toktickit/pull/55) | Ticket workflow / resolution | PpAnpt APPROVED | Merged into lab4-staging: `be6e14f` |
| [#56](https://github.com/BBINGOAL/toktickit/pull/56) | Requester Dashboard | PpAnpt APPROVED | Merged into lab4-staging: `cdc2a65` |
| [#57](https://github.com/BBINGOAL/toktickit/pull/57) | Staff / Admin Dashboard | PpAnpt APPROVED | Merged into lab4-staging: `85a06ed` |
| [#58](https://github.com/BBINGOAL/toktickit/pull/58) | Regression / hardening / performance | PpAnpt COMMENTED แล้ว APPROVED หลังรัน server/client ยืนยัน | Merged into lab4-staging: `e25284b` |
| [#59](https://github.com/BBINGOAL/toktickit/pull/59) | Documentation / submission preparation | ไม่ขอ peer review ตามคำสั่งผู้ส่ง; ไม่มี review/comment ใน PR | Merged into lab4-staging: `112497e` |
| [#60](https://github.com/BBINGOAL/toktickit/pull/60) | Release lab4-staging to main | ไม่บังคับ peer review ตาม workflow ที่ผู้ส่งแจ้ง; ไม่มี review/comment ใน PR | Merged into main: `768975d` |
| [#61](https://github.com/BBINGOAL/toktickit/pull/61) | Actual main verification / final evidence docs | เอกสารเท่านั้น ไม่ขอ peer review; ไม่มี review/comment ใน PR | Merged into main: `4edff60` |
| [#62](https://github.com/BBINGOAL/toktickit/pull/62) | Technical AI Q&A / complete review records (ฉบับนี้) | ไม่ขอ peer review ตาม workflow เอกสาร; ยังไม่มี approval | Open; รอผู้ส่งรวมเข้า main |
| [Peer #37](https://github.com/PpAnpt/toktickit/pull/37) | Sprint 4 contract ของ PpAnpt | BBINGOAL CHANGES_REQUESTED สองรอบ; รายละเอียดด้านล่าง | ยัง Open ที่ `b749842`; ยังไม่ merge |

PR เอกสารที่ไม่มี review จะแสดงสถานะตามจริง ไม่เติมคำชม คำตอบขอบคุณ หรือ approval ที่ไม่มีบน GitHub

## PR #52: Engineering contract

- **Link to PR they reviewed for me:** [PR #52](https://github.com/BBINGOAL/toktickit/pull/52)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/52#pullrequestreview-5512844550)

| Subject | Record |
|---|---|
| Reviewer feedback 1: resource privacy | non-owner ได้ 403 ต่างจาก missing 404 ทำให้เดาได้ว่ามี Ticket ควรให้ non-owner resource read เป็น 404 และใช้ 403 สำหรับ role denial |
| Reviewer feedback 2: resolution assumption | completed-action minimum เข้มกว่าข้อความที่ reviewer อ้างจาก Lab 3 ควรบันทึกเป็น Assumption พร้อมผลต่อ legacy Tickets, seed และ regression |
| Reviewer feedback 3: Action transition | BR-08 ไม่อนุญาต PLANNED ไป COMPLETED ตรง ๆ แต่ PATCH contract เดิมสื่อว่า start/complete ใน request เดียว ต้องแก้ให้ตรงกันและเพิ่ม UNIT-01 |
| Reviewer feedback 4: scope | กลไก idempotency, Ticket/User locks, follow-up chain, work cycle และ history ควรแยก must-have/minimal mechanism/stretch ให้ขอบเขตไม่บาน |
| Reviewer feedback 5: traceability | เพิ่ม test reference ของ FR-04 และจัด BR-20 เป็นแถว business rule ให้ครบ |
| Reviewer feedback 6: timestamps | ระบุให้ชัดว่าแสดงและเรียงด้วย actionDateTime หรือ createdAt |
| Reviewer feedback 7: Kanban | เพิ่ม product issues ในบอร์ดเดิมและเชื่อม PR ให้ครบ; ณ เวลานั้นแผนมี #44-#51 ก่อนที่ผู้ส่งสั่งลบ Documentation issue #51 ภายหลัง |
| Reviewer noted strengths | โครงสร้างครบตามหัวข้อ spec, AC-01 ถึง AC-18 มี planned tests และ transition matrix สอดคล้องกับ baseline ที่ reviewer ตรวจ |
| ผลติดตามภายหลัง (สรุป) | [ต้นทางคำตอบ](https://github.com/BBINGOAL/toktickit/pull/52#issuecomment-6160807329): ปรับ non-owner เป็น 404 เหมือน missing และคง role-level 403; บันทึก completed-action minimum เป็น product decision พร้อมผลต่อ legacy/seed/regression; หนึ่ง transition ต่อ request; เพิ่ม scope table, mapping และนิยาม actionDateTime/createdAt ตรวจโครงเอกสาร 16 FR/24 BR/18 AC/37 test rows ผ่าน |
| Approval / integration | Initial APPROVED ที่ 02420fc; แก้เอกสาร 1c7b55e แล้วรวมเป็น 7922e0e โดยไม่อ้างว่ามี review ใหม่แยกจาก approval เดิม |

### My Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [BBINGOAL](https://github.com/BBINGOAL)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/BBINGOAL/toktickit/pull/52#issuecomment-6160807329)

> ขอบคุณสำหรับรีวิวครับ @PpAnpt ปรับเอกสารตามข้อเสนอแนะใน PR เดิมแล้ว ขอให้ช่วยยืนยันส่วนที่แก้อีกครั้งก่อน merge เข้า `lab4-staging` ครับ
>
> 1. **403/404:** non-owner Requester บน resource read ที่บทบาทอ่านได้ จะได้ 404/code/message เหมือน resource ที่ไม่มี ส่วน role-level denial เช่น action writes/Staff-only notes เป็น 403 ก่อน lookup ทุก ID อัปเดต API/BR-03/แผน regression แล้ว
> 2. **BR-13:** ยังคง completed-action minimum เป็น product decision ของ Sprint 4 พร้อมเหตุผลใน Assumptions ไม่อ้างว่า labsheet บังคับตรง ๆ หรือ Lab 3 เคย implement แล้ว ระบุผลต่อ seed/regression: legacy active zero-action Ticket ต้องมีงานจริงก่อน Resolve ใหม่; legacy RESOLVED/CLOSED ไม่ถูกสร้าง fake action ย้อนหลัง และยังอ่าน/close ได้ตามกฎเดิมจนกว่าจะ reopen
> 3. **BR-08/PATCH:** หนึ่ง transition ต่อ request; PLANNED -> COMPLETED ต้อง reject แม้มี result ต้อง Start แล้ว Complete คนละ request พร้อม version ใหม่ แก้ API/UI/UNIT-01 ชัดเจน
> 4. **Scope:** เพิ่มตาราง must-have/minimal mechanism/stretch และ owner issue ใน implementation-plan โดยแยก safety outcome ที่ต้องทำออกจากกลไกที่เราเลือก และไม่เพิ่ม generic lock/idempotency/event platform หรือ graph UI ถ้าต้องลดกลไกในภายหลังจะเสนอแก้ contract/tests ให้ตรงกันก่อน
> 5. เพิ่ม FR-04 ใน API-01/E2E-01; จัด BR-20..24 เป็นตาราง
> 6. ระบุ action list แสดง/เรียง `actionDateTime,id`; `createdAt` แสดงแยกเป็น Recorded at และใช้เรียง audit history แผน API-05 ตรวจเวลาสองชนิดที่ไม่ตรงกันด้วย
> 7. Kanban เดิมมี #44-#51 ครบแล้ว; #44 เชื่อม PR #52 และอยู่ In review แก้ข้อความสถานะเก่าในแผนแล้ว
>
> ตรวจโครงเอกสาร/ลิงก์/traceability ผ่าน: FR 16, BR 24, AC 18, planned tests 37 แถว ยังไม่มี application implementation จึงคงผล feature tests เป็น Not run ตามจริงครับ
>
> บันทึก initial APPROVED ที่ commit 02420fc แยกจาก revision ล่าสุดไว้ใน reviewer.md แล้ว รอบนี้ยังไม่ merge และยังไม่เริ่ม issue #45 ครับ


## PR #53: Actions Taken foundation and migration

- **Link to PR they reviewed for me:** [PR #53](https://github.com/BBINGOAL/toktickit/pull/53)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/53#pullrequestreview-5568221570)

| Subject | Record |
|---|---|
| Reviewer feedback 1: fixture isolation | เทส lists only active staff/admin assignees พึ่งว่า fixture อยู่ใน 50 คนแรก ถ้ามีข้อมูลค้างจะล้ม แนะนำค้นหาด้วยชื่อ fixture |
| Reviewer feedback 2: seed preservation | seed ใช้ update:{} แล้วไม่ reset บัญชี Lab 3 ควรบันทึกพฤติกรรมนี้ในเอกสาร |
| Reviewer feedback 3: demo consistency | ขออธิบาย Ticket version=0 ทั้งที่มี Action และ OPEN Ticket ที่ยังไม่มี owner แต่มี action assignee |
| Reviewer feedback 4: DB hardening | พิจารณา CHECK constraints ในอนาคต และตรวจ index requesterId/ownerId เดี่ยวที่อาจซ้ำ composite index |
| Reviewer noted strengths | Ticket ก่อน User lock order, idempotency scope/payload digest, concurrency coverage และ indistinguishable ownership 404 |
| ผลติดตามภายหลัง (สรุป) | [ต้นทางคำตอบ](https://github.com/BBINGOAL/toktickit/pull/53#issuecomment-6286073824): PR #54 ใช้ search ชื่อ fixture; ระบุ seed update:{} ไม่ reset credentials/roles/activity; PR #55 ชี้แจง version เป็น concurrency token และ assignee แยกจาก owner; hardening ตรวจ indexes/วัด performance แล้วคง schema เดิมโดยบันทึกขอบเขต application validation |
| Approval / integration | APPROVED f6bae9e; reviewer รายงาน server 124/124 สองรอบและไม่มี drift; merged 3465088 |

### My Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [BBINGOAL](https://github.com/BBINGOAL)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/BBINGOAL/toktickit/pull/53#issuecomment-6286073824)

> ขอบคุณสำหรับรีวิวและที่ช่วยรันเทสยืนยันให้อีกสองรอบครับ @PpAnpt 🙏
>
> รับข้อเสนอแนะครบทั้ง 4 ข้อครับ สถานะติดตามคือ:
>
> - ปรับเทส assignee ให้ค้นหาด้วยชื่อ fixture แล้ว ไม่พึ่งการอยู่ใน 50 คนแรก พร้อมคงกรณี inactive/Requester ให้ตรวจการกรองได้จริง แก้ใน PR #54 และ backend rerun ผ่าน 124/124 ครับ
> - ระบุพฤติกรรม seed ที่ไม่ reset รหัสผ่าน/role/activity ของบัญชีเดิมไว้ในเอกสาร Lab 4 แล้ว ส่วน README จะรวมในงานเอกสารท้ายแลปครับ
> - ความสอดคล้องของ version/owner ในข้อมูล demo ยังเป็นงานติดตามใน issue #47 ครับ
> - CHECK constraints และ index ที่อาจซ้ำกัน รับไว้ตรวจใน issue #50 ยังไม่ได้อ้างว่าแก้เสร็จครับ
>
> ขอบคุณที่ช่วยตรวจทั้งความปลอดภัยและความน่าเชื่อถือของชุดทดสอบครับ คำแนะนำช่วยให้เห็นจุดที่ต้องเก็บต่อได้ชัดขึ้นครับ


## PR #54: Actions Taken UI

- **Link to PR they reviewed for me:** [PR #54](https://github.com/BBINGOAL/toktickit/pull/54)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/54#pullrequestreview-5581899545)

| Subject | Record |
|---|---|
| Reviewer feedback 1: timezone | input บอก local timezone แต่แสดงผลเป็น Asia/Bangkok ควรทำให้สอดคล้องหรือใส่ป้ายโซนเวลา |
| Reviewer feedback 2: uncertain submission | ปิด dialog หลัง response หายควร refresh หรือเตือนว่า request อาจสำเร็จแล้ว |
| Reviewer feedback 3: render state | frozen อ่าน intent.current ใน render ควรเก็บสถานะ submission ใน React state |
| Reviewer feedback 4: maintainability | พิจารณาแยก ActionsTaken.tsx ที่ยาว 301 บรรทัดเป็นหลาย component |
| Reviewer noted strengths | exact-intent retry, retained conflict draft, focus trap และไม่แสดง server error ดิบ |
| ผลติดตามภายหลัง (สรุป) | [ต้นทางคำตอบ](https://github.com/BBINGOAL/toktickit/pull/54#issuecomment-6286074513): PR #55 เพิ่ม timezone hint, เตือนและ refresh authoritative state เมื่อปิด uncertain submission และใช้ React state เก็บ intent; PR #58 แยก list/editor/details/history/pager/presentation และใช้ shared Dialog พร้อม regression |
| Approval / integration | APPROVED 2cb79da; reviewer รัน server 124/124, client 53/53 และ types ผ่าน ไม่ได้รัน E2E; merged 10dd684 |

### My Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [BBINGOAL](https://github.com/BBINGOAL)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/BBINGOAL/toktickit/pull/54#issuecomment-6286074513)

> ขอบคุณสำหรับรีวิวและที่ช่วยยืนยัน client 53/53, TypeScript และ server 124/124 ครับ @PpAnpt 🙏
>
> รับทราบข้อเสนอแนะทั้ง 4 ข้อครับ ทั้งป้าย timezone ของช่องกรอก, การเตือน/refresh เมื่อปิด dialog หลัง response หาย, การใช้ state สำหรับสถานะ submission แทนอ่าน ref ใน render และการแยก ActionsTaken.tsx ให้ดูแลง่ายขึ้น จะนำไปติดตามในงานปรับปรุงถัดไปพร้อมทดสอบพฤติกรรมเดิมซ้ำครับ ตอนนี้ยังไม่ได้แก้สี่ข้อนี้ จึงไม่ขอสรุปว่าเรียบร้อยแล้วครับ
>
> ขอบคุณที่แยกชัดเจนด้วยว่า E2E อ้างอิงผลที่รายงานใน PR ไม่ใช่ชุดที่ reviewer รันเอง และขอบคุณสำหรับคำแนะนำเรื่อง retry/draft/focus ครับ


## PR #55: Ticket workflow and resolution

- **Link to PR they reviewed for me:** [PR #55](https://github.com/BBINGOAL/toktickit/pull/55)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/55#pullrequestreview-5638567438)

| Subject | Record |
|---|---|
| Reviewer feedback 1: removed attachments | detailInclude ไม่กรอง isRemoved:false และเพิ่ม removedAt/removalReason ทำให้ metadata และเหตุผลกลับมาใน detail หากตั้งใจต้องอธิบาย spec และเพิ่ม tests ไม่ใช่แก้ filter โดยไม่ตรวจ requirement เดิม |
| Reviewer feedback 2: terminal metadata | ยืนยันว่าการแก้ owner/priority บน CLOSED/CANCELLED ตรงกับ spec |
| Reviewer feedback 3: Resolve actor | Resolve ไม่บังคับผู้กดเป็น Ticket owner ขอให้ยืนยันสิทธิ์ตาม spec |
| Reviewer feedback 4: compatibility | บันทึกว่า cross-requester เปลี่ยนจาก 403 ของ Lab 2/3 เป็น non-disclosing 404 |
| Reviewer noted strengths | consistent locks, Ticket cancel กับ pending Actions อยู่ transaction เดียว, reopen work cycle, recursive follow-up gate และ replay/digest conflict |
| ผลติดตามภายหลัง (สรุป) | [ต้นทางคำตอบ](https://github.com/BBINGOAL/toktickit/pull/55#issuecomment-6459305158): คง soft-removal metadata/time/reason ตามกฎเดิม โดยไฟล์จริงดาวน์โหลดไม่ได้; เพิ่ม reload/role/410 checks และ indistinguishable missing/non-owned 404 ใน PR #56; บันทึก terminal metadata-only policy และทดสอบ; eligible owner เป็น gate ไม่ใช่ข้อจำกัด actor พร้อม non-owner Staff resolve test |
| Approval / integration | APPROVED d1f9e72; reviewer รัน server 209/209, client 61/61 และ types ผ่าน ไม่ได้รัน E2E; merged be6e14f |

### My Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [BBINGOAL](https://github.com/BBINGOAL)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/BBINGOAL/toktickit/pull/55#issuecomment-6459305158)

> ขอบคุณครับ @PpAnpt สำหรับการรีวิวและรันทดสอบให้ครับ ผมตรวจข้อเสนอแนะทั้ง 4 ข้อแล้ว:
>
> 1. GET detail เปลี่ยนจาก route เดิมที่กรองเฉพาะ active attachments จริงครับ แต่ `docs/lab-02/specification.md` BR-19 และ AC-17 กำหนดให้ไฟล์ที่ soft-remove แล้วยังแสดง metadata และเหตุผล โดยดาวน์โหลด/preview ไม่ได้ และหน้า Ticket Detail มีการแสดง REMOVED/เหตุผลอยู่แล้ว จึงไม่ควรใส่ตัวกรองกลับโดยไม่พิจารณาข้อกำหนดนี้ ควรเพิ่มเทสเฉพาะว่า metadata คงอยู่หลังโหลดใหม่และดาวน์โหลดไฟล์ที่ลบไม่ได้ พร้อมอธิบายในเอกสาร Lab 4 ก่อนแนะนำ merge ครับ ขณะนี้ยังไม่ได้เพิ่มเทสหรือแก้เอกสารดังกล่าว
> 2. โค้ดปัจจุบันอนุญาต Staff/Admin เปลี่ยน owner/priority ได้ทุกสถานะ รวม CLOSED/CANCELLED โดยตรวจ version และบันทึก event ไม่เปลี่ยนสถานะหรือปลดล็อก Actions เอกสารไม่ได้กำหนดข้อห้ามตามสถานะไว้ แต่ควรเขียนนโยบายให้ชัดและเพิ่ม coverage ของ terminal states ครับ
> 3. BR-13 บังคับให้ Ticket มี owner ที่เป็น active Staff/Admin และผ่าน resolution gate แต่ไม่ได้กำหนดว่าผู้กด Resolve ต้องเป็น owner ผู้กดต้องเป็น Staff/Admin ที่ผ่านการตรวจสิทธิ์ และ history บันทึก actor จริงครับ ควรชี้แจงความแตกต่างระหว่าง eligible Ticket owner กับผู้ดำเนินการให้ชัดขึ้น
> 4. เห็นด้วยครับ `api-spec.md` และ BR-03 ระบุนโยบาย 404 แบบไม่เปิดเผยการมีอยู่ของ Ticket แล้ว แต่ควรเพิ่มใน PR/`tests.md` อย่างชัดเจนว่าเปลี่ยนพฤติกรรมเดิมของ Lab 2/3 จาก ownership 403 เป็น 404 สำหรับ cross-requester resource access; role-level denial ยังเป็น 403
>
> รับข้อเสนอแนะไว้เป็นงานติดตามก่อนแนะนำ merge ครับ ขอบคุณที่ช่วยชี้จุดด้าน compatibility และขอบเขตสิทธิ์ครับ


## PR #56: Requester Dashboard

- **Link to PR they reviewed for me:** [PR #56](https://github.com/BBINGOAL/toktickit/pull/56)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/56#pullrequestreview-5682178217)

| Subject | Record |
|---|---|
| Reviewer feedback 1: route clarity | แยก Requester Dashboard และ Ticket list เป็นสอง handlers แทน handler เดียวสลับด้วย req.path |
| Reviewer feedback 2: URL encoding | updatedSince/resolvedSince ที่มี +07:00 ต้อง encode + เป็น %2B ไม่เช่นนั้นกลายเป็น space และถูกปฏิเสธ 400 |
| Reviewer feedback 3: role feedback | บันทึก RoleRoute ที่เปลี่ยนจาก redirect เป็น Access denied สำหรับ session ที่ role ไม่ตรง |
| Reviewer feedback 4: removed download | ยืนยันว่า UI ไม่พึ่ง 404 เมื่อ removed-file download เปลี่ยนเป็น 410 |
| Reviewer noted strengths | metric และ drill-down ใช้ขอบเขต asOf สอดคล้องกัน ทุก Requester query ผูก requesterId และ strict query validation |
| ผลติดตามภายหลัง (สรุป) | [ต้นทางคำตอบ](https://github.com/BBINGOAL/toktickit/pull/56#issuecomment-6468406174): PR #57 แยก explicit handlers; เพิ่มเอกสารและ transport test ของ offset; บันทึกพร้อมทดสอบ signed-out redirect/authenticated forbidden; เพิ่ม 410 rejects-before-blob test โดยไม่อ้างว่าเทสนี้มีอยู่ตอนตอบครั้งแรก |
| Approval / integration | APPROVED 947e090; reviewer รัน server 244/244, client 72/72 และ types ผ่าน ไม่ได้รัน E2E; merged cdc2a65 |

### My Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [BBINGOAL](https://github.com/BBINGOAL)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/BBINGOAL/toktickit/pull/56#issuecomment-6468406174)

> ขอบคุณครับ @PpAnpt สำหรับการรีวิวและรัน server 244/244, client 72/72 พร้อม typecheck ให้ครับ ผมตรวจข้อเสนอแนะทั้ง 4 ข้อแล้ว:
>
> 1. เห็นด้วยครับ การแยก Dashboard กับ Ticket list เป็นคนละ handler จะอ่านและขยายต่อได้ชัดกว่า รับไว้ทำตอนต่อ Staff Dashboard (#49) โดยคง role checks, validation และ safe error behavior เดิม ขณะนี้ยังไม่ได้ refactor ครับ
> 2. ยืนยันว่า offset `+07:00` ใน query string ต้อง encode เครื่องหมาย `+` เป็น `%2B` ครับ ตัวแอปใช้ URLSearchParams ซึ่งจัดการ encoding ให้อยู่แล้ว และลิงก์จาก Dashboard ใช้ UTC `Z` จึงไม่เจอปัญหานี้ จะเพิ่มตัวอย่างสำหรับผู้เรียก API เองใน api-spec.md ของ increment ถัดไปครับ
> 3. ยืนยันว่า RoleRoute ทุกหน้าที่ใช้งานเปลี่ยนเป็นแสดง Access denied เมื่อผู้ใช้มี session แต่ role ไม่ตรง ส่วนผู้ไม่มี session ยัง redirect ไปหน้า sign-in ตามเดิมครับ ui-spec.md ระบุ wrong-role protected routes ไว้แล้ว แต่ควรเพิ่มบันทึก compatibility ใน tests.md/PR ของ increment ถัดไปให้ชัดเจนตามที่แนะนำ
> 4. ตรวจโค้ด UI แล้วไม่ได้แยกกรณีด้วย status 404 ครับ AttachmentRow ซ่อน Download/Remove เมื่อ isRemoved=true; downloadAttachment ตรวจ `!res.ok` สำหรับทุก non-2xx ก่อนอ่าน blob และหน้าจอจับข้อผิดพลาดแบบทั่วไป ดังนั้น 410 ยังเข้า error path เดิม ไม่มีการดาวน์โหลดหรืออ่าน blob ต่อ สำหรับกรณีข้อมูลบนหน้าจอเก่าก่อนที่ไฟล์จะถูกลบ backend ยังปฏิเสธด้วย 410 ครับ เทส API ใน PR ยืนยัน 410 สำหรับ authorized reader และ identical 404 สำหรับ missing/non-owned แล้ว ส่วนคำยืนยันเรื่อง UI นี้มาจากการตรวจโค้ด ไม่ใช่การอ้างว่ารัน UI 410 test ใหม่
>
> ข้อเสนอแนะระบุว่าไม่ block และจากการตรวจไม่พบเหตุที่ต้องหยุด merge ครับ Approval ตรงกับ head 947e090 และ GitHub แสดง CLEAN/MERGEABLE จึงแนะนำให้ merge เข้า lab4-staging ได้ โดยเก็บข้อ 1-3 เป็น follow-up ใน increment ถัดไป ขอบคุณครับ


## PR #57: Staff/Admin Dashboard

- **Link to PR they reviewed for me:** [PR #57](https://github.com/BBINGOAL/toktickit/pull/57)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/57#pullrequestreview-5683665723)

| Subject | Record |
|---|---|
| Reviewer feedback 1: invalid action links | actionId=abc ถูก API ปฏิเสธ 400 แต่ใช้ข้อความ Check the action fields below ซึ่งชวนเข้าใจผิด ควร validate ที่ client หรือแสดงข้อความเฉพาะลิงก์ |
| Reviewer feedback 2: URL cleanup | ขอให้ปิด Action dialog แล้วลบ actionId ด้วย replace เพื่อไม่เปิดซ้ำหลัง refresh; คำตอบแยกว่า ID ที่มีค่าค้างจริง ส่วน actionId ว่างเดิมไม่เปิด dialog |
| Reviewer feedback 3: unused window metadata | windowStart ไม่ได้ใช้กรอง Staff metrics ควรตัดออกหรืออธิบายความหมายใน api-spec |
| Reviewer feedback 4: snapshot versus current list | การ์ดเป็น snapshot แต่ Queue เป็นข้อมูลปัจจุบัน ควรมี as-of และคำอธิบายใกล้การ์ด |
| Reviewer noted strengths | role middleware ทุก endpoint, My Actions นับ current assignee กับ active parent และ independent DB-count tests ของทุกการ์ด |
| ผลติดตามภายหลัง (สรุป) | [ต้นทางคำตอบ](https://github.com/BBINGOAL/toktickit/pull/57#issuecomment-6471169069): PR #58 ตรวจ positive safe ID ก่อน GET และใช้ link-specific error; ปิด dialog ลบเฉพาะ actionId คง query อื่นและไม่เพิ่ม history; windowStart คงเพื่อ compatibility พร้อมอธิบายว่าไม่จำกัด Staff metrics; เพิ่มคำอธิบาย snapshot/current-list โดย actionId ว่างเดิมไม่เปิด dialog อยู่แล้ว |
| Approval / integration | APPROVED 191e425; reviewer รัน server 278/278, client 93/93 และ types ผ่าน ไม่ได้รัน E2E; merged 85a06ed |

### My Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [BBINGOAL](https://github.com/BBINGOAL)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/BBINGOAL/toktickit/pull/57#issuecomment-6471169069)

> ขอบคุณครับ @PpAnpt สำหรับการรีวิวและรัน backend 278/278, client 93/93 พร้อม typecheck ให้ครับ ผมตรวจข้อเสนอแนะกับโค้ดปัจจุบันแล้ว:
>
> 1. ยืนยันว่า actionId ที่ผิดรูปแบบถูก backend ปฏิเสธ 400 แต่ใช้ข้อความกลางสำหรับฟอร์ม Action จึงสับสนกับการเปิดลิงก์ครับ รับไว้ใน #50 ให้ตรวจ ID/ใช้ข้อความเฉพาะลิงก์ พร้อม regression ที่ไม่เปิด dialog หรือส่งคำขอที่ไม่เหมาะสม
> 2. ยืนยันว่าปิด dialog ตอนนี้ล้างเฉพาะ view state ยังไม่ลบ actionId ที่มีค่าออกจาก URL ทำให้ reload แล้วเปิดซ้ำได้ครับ รับไว้ใน #50 ให้ปิดผ่าน callback ที่ลบเฉพาะ actionId ด้วย replace โดยคง query อื่น และทดสอบ Close/Escape/reload ไม่เพิ่ม history ที่ไม่จำเป็น (กรณี actionId ว่างเปล่าปัจจุบันถูกมองเป็น undefined และไม่เปิด dialog)
> 3. windowStart มาจาก metadata helper ที่แชร์กับ Requester จริง แต่ไม่ได้เป็นตัวกรอง metrics ของ Staff ครับ Staff counts ใช้ predicate สถานะ/owner/assignee ตาม spec ส่วน recent preview เรียง updatedAt ทุกช่วงเวลา จะชี้แจงใน api-spec ของ #50 ว่า windowStart เป็น metadata ที่ไม่ได้ใช้จำกัด Staff metrics เพื่อไม่ให้เข้าใจว่าเป็นยอดเจ็ดวัน และคง response compatibility
> 4. ปัจจุบันมีข้อความ Snapshot พร้อม asOf/timezone อยู่ก่อนการ์ดแล้วครับ แต่ยังควรเพิ่มคำอธิบายชัด ๆ ว่าลิงก์ Queue/My Actions ดึงข้อมูลปัจจุบัน ยอดจึงอาจต่างหลังมีการเปลี่ยนแปลง รับปรับข้อความและ coverage ใน #50 ครับ ไม่ควรอ้างว่าเป็นการเปิด historical snapshot
>
> ข้อเสนอแนะทั้งสี่ระบุว่าไม่ block และไม่พบการข้ามสิทธิ์หรือความผิดพลาดในสูตรจากจุดที่ตรวจครับ Approval ตรง head ล่าสุด 191e425 และ GitHub แสดง CLEAN/MERGEABLE จึงแนะนำให้ merge PR นี้เข้า lab4-staging ได้ แล้วเก็บรายละเอียดข้างต้นใน issue #50 ตามลำดับงาน ยังไม่ได้แก้โค้ดหรืออ้างว่าทดสอบการแก้ไขเหล่านี้แล้วครับ ขอบคุณครับ


## PR #58: Final regression and product hardening

- **Link to PR they reviewed for me:** [PR #58](https://github.com/BBINGOAL/toktickit/pull/58)
- **Their Review Comment:** [ข้อเสนอแนะและ Approval จริง](https://github.com/BBINGOAL/toktickit/pull/58#pullrequestreview-5701988526)
- **Initial code-reading review:** [COMMENTED ก่อนรันเทสยืนยัน](https://github.com/BBINGOAL/toktickit/pull/58#pullrequestreview-5701869502)

| Subject | Record |
|---|---|
| Reviewer feedback 1: shared predicate | raw SQL ใน staff-dashboard.ts ทำซ้ำ pending Action/active Ticket predicates ของ myActionsQuery ควรคอมเมนต์ชี้ต้นฉบับเพื่อลดโอกาสแก้ไม่ตรงกัน |
| Reviewer feedback 2: shared dialog naming | Dialog.tsx ใช้กับ Admin และ attachment removal แล้ว ชื่อ action-backdrop/action-dialog ควรเป็นชื่อกลาง dialog-* |
| Reviewer feedback 3: upload errors | หน้าสร้าง Ticket แสดง err.message ต่อไฟล์ที่ upload ล้มเหลว ต้องตรวจว่าไม่ส่งข้อความภายในจาก server |
| Reviewer noted strengths | raw SQL parameterized ด้วย Prisma.sql/Prisma.join; submitLock และ saved-number screen กัน resubmit หลัง upload fail; ติดตามคำแนะนำ PR #57 ครบ |
| ผลติดตามภายหลัง (สรุป) | [ต้นทางคำตอบ](https://github.com/BBINGOAL/toktickit/pull/58#issuecomment-6527514521): ตอบขอบคุณและตรวจ parity ของ assignee/pending/active-parent กับ myActionsQuery แล้ว มี shared-rule comment เดิม; generic class naming และการระบุ helper ให้ชัดเป็น optional refactor ยังไม่ได้เปลี่ยน; uploadAttachment ใช้ responseError ที่แทน 5xx/non-JSON ด้วย safe fallback และ endpoint validation ไม่ส่ง exception ดิบ helper มี PRIVATE-message tests ใน write API อื่น แต่ไม่อ้างว่ามี upload-specific PRIVATE-message test |
| Approval / integration | เริ่ม COMMENTED แล้วเปลี่ยนเป็น APPROVED 98bc6cf หลัง reviewer รัน server 279/279 รวม performance และ client 109/109/types ผ่านบน DB แยก; ไม่ได้รัน E2E; merged e25284b วันที่ 2026-10-31 01:36 Asia/Bangkok |

### My Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [BBINGOAL](https://github.com/BBINGOAL)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/BBINGOAL/toktickit/pull/58#issuecomment-6527514521)

> ขอบคุณสำหรับการรีวิวและรันเทสยืนยันครับ @PpAnpt ผมอ่านทั้งรีวิวแรกและอัปเดต Approved แล้ว ผล server 279 (backend 278 + performance 1) และ client 109 ตรงกับหลักฐานใน PR ส่วน E2E 49 เคสเป็นผลที่ผมรันไว้ ไม่ได้ถือว่าเพื่อนรัน E2E ซ้ำครับ
>
> ตรวจข้อเสนอแนะทั้ง 3 ข้อแล้ว:
> 1. raw SQL preview ใช้ current assignee + pending Action + active parent ตรงกับ myActionsQuery ปัจจุบัน และมี comment รักษา predicate เดียวกับ My Actions แล้ว การระบุชื่อ myActionsQuery/dashboard-rules.ts ให้ชัดขึ้นจะช่วยบำรุงรักษาได้ครับ
> 2. action-backdrop/action-dialog เป็นชื่อเดิมที่นำมาใช้ร่วมกับ Admin และ attachment removal การเปลี่ยนเป็นชื่อกลาง dialog-* เป็น refactor ที่เหมาะสม แต่ไม่ได้เปลี่ยนพฤติกรรมหรือเป็น blocker ของ PR นี้ครับ
> 3. ตรวจ uploadAttachment -> responseError และ endpoint แล้ว: ข้อความ 5xx/response ที่อ่าน JSON ไม่ได้ถูกแทนด้วย Failed to upload attachment; responseError อนุญาตข้อความ validation เฉพาะ 400/409/422 และ endpoint upload ส่งข้อความที่กำหนดไว้ ไม่ส่ง exception ดิบ ตัว helper เดียวกันมี transport regression ตรวจ 500 ที่ใส่ SQL PRIVATE passwordHash ใน write API อื่น และ E2E มี upload 500 แล้วรักษาหน้า saved-number; ยังไม่ได้อ้างว่ามี upload-specific PRIVATE-message test จึงไม่พบการรั่วข้อความภายในตามกรณีที่ทักครับ ขอบเขตนี้ไม่ได้อ้างว่ากรองข้อความจากทุกแหล่งหรือทุก API ทั้งระบบ
>
> รับทราบข้อเสนอแนะเรื่องชื่อ/comment ไว้สำหรับปรับการอ่านโค้ดต่อครับ ตอนนี้ยังไม่ได้แก้หรือ push เพิ่มจาก head 98bc6cf ที่ได้รับ Approved และจะรอ staging merge ก่อนเริ่ม issue ถัดไป ขอบคุณครับ


---

## Who I Reviewed (คนที่ผมไปตรวจโค้ดให้เขา)

- **Name:** อนพัช บรรเจิดศิลป์
- **Student ID:** 67070501049
- **GitHub Username:** [PpAnpt](https://github.com/PpAnpt)
- **Link to PR I reviewed for them:** [PR #37: Sprint 4 engineering contract](https://github.com/PpAnpt/toktickit/pull/37)

| Subject | Record |
|---|---|
| My Review Comment | [CHANGES_REQUESTED รอบแรก](https://github.com/PpAnpt/toktickit/pull/37#pullrequestreview-5698709294), e2ba4cc: ต้องมี action assignee/lifecycle ตาม rubric; ต้องมี append-only history ที่เก็บค่าเดิม/actor; Recently Resolved drill-down ต้องรวม Resolved+Closed ใน window เดียวกับ metric |
| Finding 1: Action assignment / lifecycle (P1) | [Inline comment](https://github.com/PpAnpt/toktickit/pull/37#discussion_r4413085333): assign=Ticket Owner และ Action ไม่มี status ไม่ครอบคลุม Part 6 ต้องแยก assignee จาก Owner/Performed by, ตรวจ active Staff/Admin, กำหนด complete/cancel rules และแก้ spec/API/UI/seed/AC/tests ให้ตรงกัน |
| Finding 2: append-only history (P2) | [Inline comment](https://github.com/PpAnpt/toktickit/pull/37#discussion_r4413085344): ห้าม DELETE อย่างเดียวไม่เก็บค่าก่อน PATCH ต้องแยก current record กับ revision/event history ที่มี actor, เวลา, ก่อน/หลังหรือ snapshot, stable order และสิทธิ์ดู พร้อมทดสอบแก้/ลบประวัติไม่ได้ |
| Finding 3: Recently Resolved parity (P2) | [Inline comment](https://github.com/PpAnpt/toktickit/pull/37#discussion_r4413085359): metric รวม Resolved+Closed ใน window แต่ลิงก์เดิมกรอง Resolved อย่างเดียวและไม่กรองเวลา ต้องเพิ่ม exact drill-down กับกรณี Closed ใน window / Resolved นอก window |
| Further suggestions | กำหนด performance fixture/warmup/p95 ให้ทำซ้ำได้; จำกัด/paginate list/history; ให้ stale check กับ write เป็น atomic พร้อม parallel-edit test |
| Their Response / follow-up (สรุป) | [เพื่อนตอบและขอ re-review](https://github.com/PpAnpt/toktickit/pull/37#issuecomment-6499616614): เพิ่ม assignee/lifecycle, revision/Ticket event history, recent=updated/resolved, atomic timestamp token, pagination และ performance protocol |
| Response detail: lifecycle | เพื่อนเพิ่ม assigneeId, Planned/In Progress/Completed/Cancelled, transition/result/inactive-assignee rules และ auto-cancel พร้อม resolution gate โดยเชื่อม BR-29..32, FR-17/18, AC-31..33/39 กับ API/UI/tests |
| Response detail: audit and parity | เพิ่ม ActionTakenRevision ก่อน/หลังกับ TicketEvent, transaction และ trigger ป้องกัน UPDATE/DELETE; เพิ่ม recent=updated/resolved ให้ metric กับ list ใช้ predicate/window เดียวกัน รวม Closed ที่ตรงช่วงเวลา |
| Response detail: extra suggestions | ระบุ atomic compare-and-set และ token เพิ่มอย่างน้อย 1ms, actions/history pagination, performance fixture 5000 Tickets/20000 Actions, 3 warmups/30 requests และ p95 <1s เป็น protocol ของ repo เพื่อน ไม่ใช่ตัวเลขผลทดสอบ repo ผม |
| My Re-review | [CHANGES_REQUESTED รอบสอง](https://github.com/PpAnpt/toktickit/pull/37#pullrequestreview-5699694394), b749842: ตรวจแล้ว 3 ข้อเดิมและข้อเสนอแนะเพิ่มแก้ครบ มี 19 FR/39 BR/39 AC/144 planned rows ทุก AC mapped; เหลือขั้นตอน recovery ที่ใช้ migrate resolve --rolled-back กับ successful migration ซึ่งใช้ไม่ได้ใน Prisma 7 |
| Requested correction | [Inline finding](https://github.com/PpAnpt/toktickit/pull/37#discussion_r4413824789): แยก failed migration recovery จาก successful rollback; ใช้ pre-upgrade backup restore พร้อม baseline/migration history หรือ compensating migration ใหม่ และแก้ MIG-02 ให้ตรวจ schema/data/history; อัปเดต PR description เก่าเป็นข้อเสนอแนะไม่ block |
| Current status | ตรวจ GitHub วันที่ 31 ตุลาคม 2026: PR ยัง Open, head ยังเป็น b749842 และยังไม่พบคำตอบหรือ revision เพิ่มหลัง re-review รอบสอง จึงยังเป็น CHANGES_REQUESTED ไม่ใช่ APPROVED หรือ merged |
| Review boundary | อ่านเอกสารและตรวจ traceability ไม่ได้รัน application tests ของเพื่อน ไม่ใช้ผลรันของ repo ผมแทน และไม่อ้างว่ามี approval หรือ merge หลัง request changes |

### Their Response (ข้อความจริงจาก GitHub)

**ผู้ตอบ:** [PpAnpt](https://github.com/PpAnpt)

**ต้นฉบับ:** [ข้อความตอบบน PR](https://github.com/PpAnpt/toktickit/pull/37#issuecomment-6499616614)

> ขอบคุณสำหรับ review ครับ แก้ครบทั้ง 3 ประเด็นและข้อเสนอแนะเพิ่มเติมแล้ว (commits 85fdfdb, 1d821f2, 9194546 และล่าสุดของ tests.md):
>
> **P1: Action assignee และ lifecycle**: เพิ่ม `assigneeId` (active staff/admin แยกจาก Performed by และ Ticket Owner) และ `status` (Planned / In Progress / Completed / Cancelled) พร้อมกฎ transition, Result บังคับเมื่อ Complete/Cancel, inactive-assignee rejection, auto-cancel เมื่อ Ticket ถูก Cancelled และ resolution gate ใหม่ (`RESOLUTION_GATE_FAILED`) → spec BR-29..32, FR-17/18, AC-31..33, AC-39; API 2.3/2.4; UI 4.3; tests API-17..23, UI-26/27/30, E2E-13/15/16
>
> **P2: append-only history**: แยก current-state record ออกจากหลักฐานประวัติ เพิ่ม `ActionTakenRevision` (before/after snapshot, actor, เวลา, revisionNo) และ `TicketEvent` (status/owner/priority) เขียนใน transaction เดียวกับการเปลี่ยนแปลง มี DB trigger ห้าม UPDATE/DELETE และ API/UI ดูประวัติเฉพาะ staff → BR-33..37, FR-19, AC-34..37; API 2.6/2.7; tests HIST-01..10, UI-28, E2E-14
>
> **P2: Recently Resolved drill-down**: เพิ่ม `recent=updated|resolved` ใน My Tickets ใช้ predicate/window เดียวกับ metric (รวม Resolved→Closed ใน window และตัด Resolved เก่าออก) ทำให้ทุกการ์ด Requester มี exact drill-down → BR-39, AC-20; tests DASH-09/10, WF-15, E2E-09
>
> **ข้อเสนอแนะเพิ่มเติม**
> - Concurrency: ระบุเป็น atomic `UPDATE ... WHERE updatedAt = expected` ใน transaction เดียวกับ history และ token ใหม่ = `GREATEST(now, previous + 1ms)` → BR-20; tests UNIT-07, WF-13 (parallel edits), WF-14 (rollback)
> - Pagination: actions list และ history → BR-38, AC-38; tests API-24, HIST-10, UI-29
> - Performance: กำหนด fixture (5,000 tickets / 20,000 actions, seed คงที่), 3 warm-up + 30 requests, ผ่านเมื่อ p95 < 1s และเก็บ summary → tests.md ข้อ 6, AC-30
>
> รบกวน re-review ครับ


## Documentation and release integration (no peer review required)

| PR | Actual integration | Review record |
|---|---|---|
| [#59 Documentation](https://github.com/BBINGOAL/toktickit/pull/59) | feature8/lab4-docs-release -> lab4-staging; merged 112497e on 2026-10-31 at 08:34:05 Asia/Bangkok | The student explicitly waived review; the PpAnpt request was withdrawn. No approval is fabricated. |
| [#60 Release](https://github.com/BBINGOAL/toktickit/pull/60) | lab4-staging -> main; merged 768975d on 2026-10-31 at 08:39:17 Asia/Bangkok | The student clarified release PRs do not require peer review in this workflow. Seven product PR reviews above remain valid; no separate release approval is claimed. |
| [#61 Final main evidence](https://github.com/BBINGOAL/toktickit/pull/61) | docs/lab4-final-main-evidence -> main; merged 4edff60 on 2026-10-31 at 09:31:49 Asia/Bangkok | Documentation-only under the same student workflow. No submitted peer review or Conversation comment was found; no approval or reply is invented. |
| [#62 AI / review records](https://github.com/BBINGOAL/toktickit/pull/62) | docs/lab4-ai-review-records -> main; Open | Current documentation update only. No issue or peer-review request; awaits student integration. |

### PR #59: Documentation / submission preparation

- **Scope:** README, test/acceptance status, recovery evidence, AI reflection, actual review records and ignore rules for local report artifacts.
- **Their Review Comment / My Response:** ไม่มี review หรือ comment ใน PR นี้ตามข้อมูล GitHub ที่ตรวจ ไม่ใช่การตกหล่นจากบันทึก ผู้ส่งยกเว้น peer review และถอน request ของ PpAnpt แล้ว
- **Integration:** รวมเข้า lab4-staging ที่ `112497e` ตามตาราง ไม่รวม PDF, report Markdown, screenshots หรือ tmp เข้า commit

### PR #60: Lab 4 release

- **Scope:** รวม lab4-staging ซึ่งมี product PRs #52-#58 และ documentation PR #59 เข้า main
- **Their Review Comment / My Response:** ไม่มี review หรือ comment ใน PR นี้ ผู้ส่งยืนยันว่า release ไม่ต้องมี peer review แยกจาก feature PRs
- **Integration:** `768975d` คือ product main ที่ใช้รัน final backend/client/E2E และ recovery จริง ไม่อ้างว่าการกด merge อย่างเดียวเป็นผลทดสอบ

### PR #61: Actual main verification / final evidence

- **Scope:** อัปเดต README และเอกสาร Lab 4 ให้ตรงผลรัน actual main, completed AC/DoD และสถานะ release ที่รวมแล้ว ไม่มีโค้ดแอป ชุดทดสอบ migration หรือ report images
- **Their Review Comment / My Response:** ไม่มี review หรือ comment ใน PR นี้ ไม่ขอ peer review ตาม workflow เอกสารที่ผู้ส่งกำหนด
- **Integration:** รวมเข้า main ที่ `4edff60` วันที่ 31 ตุลาคม 2026 เวลา 09:31:49 น. (Asia/Bangkok) โดย product verification ยังคงอ้างอิงรอบที่รันจริงบน `768975d` ไม่เปลี่ยนชื่อผลเก่าเป็นผลรันใหม่บน `4edff60`

### PR #62: Technical AI questions / complete review records

- **Scope:** ปรับ ai-use.md เป็น 10 คำถาม–คำตอบทางเทคนิคพร้อม reflection และขยาย reviewer.md ให้ครบ PR/ข้อเสนอแนะ/คำตอบ/สถานะปัจจุบัน
- **Their Review Comment / My Response:** ยังไม่มี review/comment ขณะจัดทำ ไม่ขอ peer review ตาม workflow เอกสาร และไม่สร้างข้อความตอบที่ไม่ได้โพสต์จริง
- **Integration:** PR เอกสารฉบับนี้ยัง Open เป้าหมาย main ไม่มี issue ใหม่และไม่ merge อัตโนมัติ รายงาน MD/PDF และรูปเก็บในเครื่อง ไม่อยู่ใน PR

Fresh main verification: backend 278/278 + separate performance 1/1, client 109/109, all application Chromium 49/49, types/builds/lint/schema pass. Native isolated PostgreSQL and real baseline recovery were verified; these are author runs on main, distinct from the earlier reviewer-reported runs.
