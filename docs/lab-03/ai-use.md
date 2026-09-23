# LAB 3 AI Use and Reflection

ในการทำ Lab3 นี้ผมใช้ Antigravity coding agent โดยมีโมเดลหลักๆที่ใช้ คือ Claude Sonnet 4.6 เเละ Gemini 3.1 Pro 

## Selected Key Prompts

| Prompt | My Reflection |
| :--- | :--- |
| **1. "ช่วยออกแบบ Database Schema (Prisma) และ RESTful API สำหรับระบบ IT Staff Ticket Operations (Issue 4) โดยคำนึงถึง Role-Based Access Control และการซ่อน Internal Notes ไม่ให้ Requester มองเห็น"** | AI ช่วยวางโครงสร้าง API และ Database ได้อย่างรัดกุม โดยมีการสร้าง Middleware สำหรับตรวจเช็คสิทธิ์ (Authorization) อย่างชัดเจน และแยก Logic การดึงข้อมูลแบบมีเงื่อนไข ทำให้ข้อมูล Internal Note ปลอดภัยจากการเข้าถึงโดยไม่ได้รับอนุญาต |
| **2. "สำหรับการสร้างระบบ Administrator User Management (Issue 5) เราควรจัดการ Validation อย่างไรเพื่อป้องกันปัญหา Edge Cases เช่น แอดมินเผลอระงับบัญชี (Deactivate) ตัวเอง หรือการใช้อีเมลซ้ำในระบบ?"** | AI มีความเข้าใจในเรื่อง System Constraints เป็นอย่างดี และแนะนำให้เพิ่ม Business Logic ในระดับ Controller เพื่อทำการเช็ค Token ของแอดมินที่กำลังล็อกอินอยู่ ก่อนที่จะอนุญาตให้แก้ไขสถานะบัญชี ทำให้ระบบมีความน่าเชื่อถือมากยิ่งขึ้น |
| **3. "หลังจากแก้ไขไฟล์ API แล้วคอมไพล์ด้วย Vite พบ Error แจ้งว่า 'Export not found' ทำให้ React Router ทำการ Fallback กลับไปหน้า Login ปัญหานี้เกี่ยวข้องกับ IsolatedModules ของ TypeScript ในการ import interface ใช่หรือไม่ และมีวิธีแก้ไขที่ Best Practice อย่างไร?"** | AI เข้าใจกลไกการทำงานของ esbuild ภายใต้ Vite ได้อย่างลึกซึ้ง และช่วยอธิบายว่าต้องใช้คำสั่ง `import type` เพื่อไม่ให้ Vite พยายามแปลง Interface เป็น Value ในฝั่ง JavaScript ซึ่งช่วยแก้ปัญหา Runtime Error ที่ทำให้หน้าเว็บพังได้อย่างตรงจุด |
| **4. "ช่วยวิเคราะห์ Workflow ของระบบ Force Change Password หน่อยครับ ปัจจุบัน API ส่งค่า `mustChangePassword=true` กลับมาแล้ว แต่ฝั่ง Frontend ขาดการจัดการ State เพื่อดักผู้ใช้ เราควรปรับปรุง Login Component อย่างไรเพื่อบังคับให้ผู้ใช้ตั้งรหัสผ่านใหม่ก่อนเข้าสู่แอปพลิเคชัน?"** | AI ช่วยวาง State Management ภายในหน้า Login ได้อย่างยอดเยี่ยม โดยสร้างเงื่อนไขจำลอง (Derived State) เพื่อเปลี่ยนหน้าต่าง Login ให้กลายเป็นหน้าต่าง Set New Password แทนการ Redirect ปกติ ช่วยลดความซับซ้อนของการใช้ Router และเพิ่ม UX ที่ดีให้กับระบบ |
| **5. "เมื่อรันเซิร์ฟเวอร์เกิดข้อผิดพลาด ERR_CONNECTION_REFUSED จากการที่ Nodemon แจ้งเตือนว่าหาโฟลเดอร์ Middleware ไม่พบ ช่วยตรวจสอบ Path ของไฟล์ `auth.routes.ts` เทียบกับโครงสร้าง Project Directory ปัจจุบันให้หน่อยครับ"** | AI ยอมรับความผิดพลาดว่าเกิดจากการพิมพ์ Path ผิดไปหนึ่งตัวอักษร (`middlewares` แทนที่จะเป็น `middleware`) สิ่งนี้สอนให้ผมรู้ว่าแม้ AI จะเก่งแค่ไหน แต่ความแม่นยำในเรื่องโครงสร้างโฟลเดอร์ยังต้องอาศัยนักพัฒนา (Human Developer) ในการคอยช่วยตรวจสอบและชี้เป้าปัญหา |
| **6. "ช่วยเขียน Backend Unit Test ด้วย Supertest และ Frontend E2E Test สำหรับระบบ Ticket Operations โดยจำลองสิทธิ์การเข้าถึง (Mocking Authorization) ที่แตกต่างกันให้ครอบคลุมทั้ง 3 Role"** | AI เสนอแนวทางการทำ Test Setup ที่มีประสิทธิภาพ ช่วยจำลอง Login Session และตั้งเคสทดสอบที่เน้นเรื่อง Boundary (เช่น Requester พยายามแก้สถานะตั๋ว) ทำให้ได้ Test Coverage สูง |
| **7. "ในการจัดการ Authentication สำหรับโปรเจกต์นี้ เราควรเลือกใช้ JWT เก็บใน HttpOnly Cookie หรือ LocalStorage ดีครับ? และต้องตั้งค่า Middleware ของ Express อย่างไรให้ปลอดภัยจากช่องโหว่ XSS?"** | AI อธิบายข้อดีของการใช้ HttpOnly Cookie ว่าป้องกันการโจมตีแบบ XSS ได้ดีกว่า และช่วยเขียน Authentication Pipeline ใน Express.js ควบคู่กับ `cookie-parser` ได้อย่างปลอดภัยตามมาตรฐาน |
| **8. "สำหรับการทำ Data Migration เพื่อโอนย้ายข้อมูลจากตารางเก่า (DevRequester) ไปตาราง User ใหม่ เราควรจัดการ Script ใน Prisma อย่างไรให้ข้อมูลเก่าไม่สูญหายและ Map ค่าสิทธิ์ (Role) ได้ถูกต้อง?"** | AI แนะนำวิธีการเขียน Prisma Seed/Migration Script เพื่อถ่ายโอนข้อมูลอย่างระมัดระวัง (Data Mapping) ทำให้มั่นใจว่าความสัมพันธ์ (Relations) ระหว่าง Ticket กับผู้แจ้งเดิมยังคงสมบูรณ์หลังเปลี่ยน Schema |
| **9. "ช่วยออกแบบ Architecture สำหรับ React Component ในหน้า Ticket Detail โดยคำนึงถึง Reusability (เช่น แยก Status Selector หรือ Comment Box) และวิธีหลีกเลี่ยงปัญหา Prop Drilling"** | AI แนะนำการแบ่ง Component ตามหน้าที่ (Single Responsibility) และการจัดการ State ผ่าน Context API ช่วยแก้ปัญหา Prop Drilling ทำให้โค้ดในหน้า Ticket Detail มีความ Clean และบำรุงรักษาได้ง่ายมาก |
| **10. "ทำไม E2E Playwright Tests ถึงหา Element ที่เกิดจาก React Context ไม่เจอในบางครั้ง? เกี่ยวข้องกับ Asynchronous Rendering หรือไม่ และควรใช้ Locator Strategy แบบไหนไม่ให้ Test มีอาการ Flaky?"** | AI อธิบายเรื่อง React Rendering Cycle กับจังหวะที่ Playwright ค้นหา DOM และสอนให้ใช้ Auto-waiting ร่วมกับ Locator แบบ Role-based (เช่น getByRole) ทำให้ E2E Test รันผ่านอย่างเสถียร (Reliable) |

## Overall Reflection
จากการทำ Lab 3 ครั้งนี้ ผมได้ใช้ AI เข้ามาช่วยพัฒนาระบบในส่วนของ Authorization และ Role-Based Access Control (RBAC) ซึ่งมีความซับซ้อนเชิง Business Logic สูง การตั้งคำถามโดยเน้นที่ "สถาปัตยกรรม (Architecture)" และ "ข้อควรระวัง (Edge Cases)" ทำให้ AI สามารถสร้างโค้ดที่ครอบคลุมการโจมตีหรือข้อผิดพลาดของระบบ (Vulnerabilities) ได้ดีกว่าการสั่งให้เขียนโค้ดแบบทื่อๆ

การทำงานร่วมกับ AI ยังเปิดโอกาสให้ผมได้ฝึกฝนทักษะ **Cross-Stack Debugging** โดยเฉพาะเมื่อเกิดปัญหาซับซ้อน เช่น การจัดการ Type Stripping ของ Vite หรือการออกแบบ State Management ใน React การนำ Error Log มาวิเคราะห์ร่วมกับ AI ช่วยย่นระยะเวลาในการค้นหาสาเหตุของบัคได้อย่างมหาศาล

**สิ่งที่ AI ทำได้ดี**
1. **การจัดการ Logic ที่ซับซ้อนและ RBAC:** AI เข้าใจเงื่อนไขของการแบ่งแยก Role (Requester, IT Staff, Admin) และแยกการแสดงผลข้อมูลได้อย่างปลอดภัย
2. **การทำ Cross-stack Debugging:** AI สามารถวิเคราะห์ปัญหาทางเทคนิคเชิงลึกระดับ Build Tools (เช่น Vite และ esbuild) และหาทางแก้ที่สอดคล้องกับ Best Practice ของ TypeScript ได้
3. **การออกแบบ UX/UI แบบมีเงื่อนไข:** AI สามารถปรับแต่ง Component เดิมให้รองรับ Business Flow ใหม่ (เช่น Force Password Change) ได้อย่างเป็นธรรมชาติ โดยไม่ต้องรื้อระบบใหม่ทั้งหมด

**สรุปภาพรวม**
การใช้งาน AI อย่างมีประสิทธิภาพไม่ได้เกิดจากการ "สั่งให้ทำ" แต่เกิดจากการ "ปรึกษาหารือ (Collaborate)" ผ่านการตั้งคำถามเชิงเทคนิคและการให้ Context ที่ครบถ้วน เมื่อผู้พัฒนาเข้าใจภาพรวมของระบบและเลือกใช้คำถามที่ฉลาด AI จะสามารถส่งมอบโค้ดระดับ Production-Ready ที่มีความเสถียรและปลอดภัยสูงได้ครับ
