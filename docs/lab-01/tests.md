# Lab 1 Automated Tests

The following table summarizes the automated tests implemented for the TokTickIT vertical slice in Lab 1.

| Test File | Tool | Test Description |
| :--- | :--- | :--- |
| `server/tests/lab-01/health.test.ts` | Supertest | API-01: Health endpoint `GET /api/health` returns 200 and expected JSON `{"status": "ok", "service": "TokTickIT API"}` |
| `server/tests/lab-01/categories.test.ts` | Supertest | API-02: Categories endpoint `GET /api/categories` returns the four seeded categories |
| `client/src/App.test.tsx` | Vitest | UI-01: TokTickIT heading renders correctly |
| `client/src/App.test.tsx` | Vitest | UI-02: Check System success - Loading state changes to category list |
| `client/src/App.test.tsx` | Vitest | UI-03: Check System failure - API failure displays a useful error message |

<br>

### สรุปผลการทดสอบ (Test Results)

| Test ID | ชนิด | ไฟล์ | คำอธิบาย | ผ่านแล้ว? |
| :--- | :--- | :--- | :--- | :---: |
| **API-01** | Supertest | `server/tests/lab-01/health.test.ts` | Health endpoint returns 200 and expected JSON | ✅ |
| **API-02** | Supertest | `server/tests/lab-01/categories.test.ts` | Categories endpoint returns the four seeded categories | ✅ |
| **UI-01** | Vitest | `client/src/App.test.tsx` | TokTickIT heading renders correctly | ✅ |
| **UI-02** | Vitest | `client/src/App.test.tsx` | Check System success - Loading state changes to category list | ✅ |
| **UI-03** | Vitest | `client/src/App.test.tsx` | Check System failure - API failure displays a useful error message | ✅ |
