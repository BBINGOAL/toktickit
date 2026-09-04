# Lab 2 Test Plan and Results

**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation  
**Sprint:** Lab 2 | Semester 1/2026  
**Last Updated:** 2026-08-29  
**Status:** Planned — To be executed during implementation

---

## 1. Test Strategy

### Approach
Lab 2 uses Test-Driven Development (TDD) where failing tests are written **before** implementation, and Test-Driven Documentation (Test DD) where every Acceptance Criterion maps to at least one planned test.

### Test Levels

| Level | Tool | Purpose |
|---|---|---|
| Unit | Vitest | Pure logic: ticket number generator, validators, utility functions |
| API / Integration | Supertest + Vitest | Endpoint behavior, validation, ownership, status codes |
| UI Component | Vitest + React Testing Library | Component rendering, state, user interactions |
| UI Style | Playwright assertions | CSS classes, field states, badge colors, layout rules |
| Responsive | Playwright | Viewport-specific layout at desktop / tablet / mobile |
| E2E | Playwright | Full user flows across frontend + backend + database |

### TDD Workflow
1. Write failing test(s) based on the AC.
2. Implement the minimum code to make the test pass.
3. Refactor while keeping tests green.
4. Link each test back to its AC in the traceability table.

---

## 2. Planned Tests

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| **UNIT-01** | Unit | AC-01 | Ticket Number generator returns correct format | Returns string matching `TKT-\d{4}-\d{6}` | `server/tests/lab-02/ticketNumber.unit.test.ts` | ✅ Pass |
| **UNIT-02** | Unit | AC-04, AC-05 | Summary validator rejects empty and > 200 chars | Returns validation error for each case | `server/tests/lab-02/validators.unit.test.ts` | ✅ Pass |
| **UNIT-03** | Unit | AC-04 | Description validator rejects empty and < 10 chars | Returns validation error | `server/tests/lab-02/validators.unit.test.ts` | ✅ Pass |
| **UNIT-04** | Unit | BR-23 | Filename sanitizer strips path traversal characters | Returns safe filename | `server/tests/lab-02/validators.unit.test.ts` | ✅ Pass |
| **API-01** | API | AC-01 | POST /api/tickets with valid data | 201; ticket saved; ticketNumber in response | `server/tests/lab-02/create-ticket.api.test.ts` | ✅ Pass |
| **API-02** | API | AC-04 | POST /api/tickets with empty summary | 400; error message mentions summary | `server/tests/lab-02/create-ticket.api.test.ts` | ✅ Pass |
| **API-03** | API | AC-05 | POST /api/tickets with summary > 200 chars | 400; validation error returned | `server/tests/lab-02/create-ticket.api.test.ts` | ✅ Pass |
| **API-04** | API | AC-03 | GET /api/tickets/:id for another requester's ticket | 403 Forbidden | `server/tests/lab-02/ticket-detail.api.test.ts` | ✅ Pass |
| **API-05** | API | AC-15 | GET /api/tickets/:id for owned ticket | 200; all ticket fields returned | `server/tests/lab-02/ticket-detail.api.test.ts` | ✅ Pass |
| **API-06** | API | AC-10 | GET /api/tickets?search=keyword | 200; only matching tickets returned | `server/tests/lab-02/my-tickets.api.test.ts` | ✅ Pass |
| **API-07** | API | AC-11 | GET /api/tickets?categoryId=1 | 200; only tickets in that category | `server/tests/lab-02/my-tickets.api.test.ts` | ✅ Pass |
| **API-08** | API | AC-12 | GET /api/tickets?sort=createdAt&order=desc | 200; tickets ordered newest first | `server/tests/lab-02/my-tickets.api.test.ts` | ✅ Pass |
| **API-09** | API | BR-25 | GET /api/tickets?page=1&pageSize=10 | 200; pagination metadata in response | `server/tests/lab-02/my-tickets.api.test.ts` | ✅ Pass |
| **API-10** | API | BR-25 | GET /api/tickets?pageSize=999 (invalid size) | 400; error returned | `server/tests/lab-02/my-tickets.api.test.ts` | ✅ Pass |
| **API-11** | API | AC-16 | GET /api/attachments/:id/download (active file) | 200; file stream returned | `server/tests/lab-02/attachments.api.test.ts` | ✅ Pass |
| **API-12** | API | AC-17 | PATCH /api/attachments/:id/remove with reason | 200; isRemoved=true; removedAt set | `server/tests/lab-02/attachments.api.test.ts` | ✅ Pass |
| **API-13** | API | AC-17 | GET /api/attachments/:id/download (removed file) | 403 or 410; download blocked | `server/tests/lab-02/attachments.api.test.ts` | ✅ Pass |
| **API-14** | API | AC-08 | POST /api/tickets/:id/attachments when 5 active exist | 422; limit error returned | `server/tests/lab-02/attachments.api.test.ts` | ✅ Pass |
| **API-15** | API | AC-06 | POST /api/tickets/:id/attachments with file > 5 MB | 400; size error returned | `server/tests/lab-02/attachments.api.test.ts` | ✅ Pass |
| **API-16** | API | AC-07 | POST /api/tickets/:id/attachments with .exe file | 400; type error returned | `server/tests/lab-02/attachments.api.test.ts` | ✅ Pass |
| **API-17** | API | AC-20 | GET /api/requesters returns only active requesters | 200; inactive requester absent | `server/tests/lab-02/requesters.api.test.ts` | ✅ Pass |
| **API-18** | API | AC-18 | GET /api/tickets returns only current requester's tickets | 200; other requester's tickets absent | `server/tests/lab-02/my-tickets.api.test.ts` | ✅ Pass |
| **UI-01** | UI | AC-02 | RequesterSelector renders when no requester selected | Selector screen is shown; ticket screens hidden | `client/src/lab-02-tests/RequesterSelector.test.tsx` | ✅ Pass |
| **UI-02** | UI | AC-20 | RequesterSelector only shows active requesters | Inactive requester absent from dropdown | `client/src/lab-02-tests/RequesterSelector.test.tsx` | ✅ Pass |
| **UI-03** | UI | AC-04 | CreateTicket submit with empty Summary | Field-level error below Summary; API not called | `client/src/lab-02-tests/CreateTicket.test.tsx` | ✅ Pass |
| **UI-04** | UI | AC-05 | CreateTicket submit with Summary > 200 chars | Field-level error shown; API not called | `client/src/lab-02-tests/CreateTicket.test.tsx` | ✅ Pass |
| **UI-05** | UI | AC-01 | CreateTicket successful submission | Ticket Number displayed in success state | `client/src/lab-02-tests/CreateTicket.test.tsx` | ✅ Pass |
| **UI-06** | UI | BR-13 | Submit button during API request in flight | Button is disabled and shows busy/spinner state | `client/src/lab-02-tests/CreateTicket.test.tsx` | ✅ Pass |
| **UI-07** | UI | AC-18 | CreateTicket API failure response | Error message shown; all form values preserved | `client/src/lab-02-tests/CreateTicket.test.tsx` | ✅ Pass |
| **UI-08** | UI | AC-06, AC-07 | AttachmentSection invalid file selected | Error message shown; file not queued for upload | `client/src/lab-02-tests/AttachmentSection.test.tsx` | ✅ Pass |
| **UI-09** | UI | AC-08 | AttachmentSection at 5-attachment limit | Add button is disabled; explanatory message shown | `client/src/lab-02-tests/AttachmentSection.test.tsx` | ✅ Pass |
| **UI-10** | UI | AC-17 | AttachmentSection soft-remove confirmation | Dialog shown; reason required; confirmed = item marked removed | `client/src/lab-02-tests/AttachmentSection.test.tsx` | ✅ Pass |
| **UI-11** | UI | AC-13 | MyTickets with no tickets | Empty state message shown; no error | `client/src/lab-02-tests/MyTickets.test.tsx` | ✅ Pass |
| **UI-12** | UI | AC-14 | MyTickets search with no results | No-results state shown; distinct from empty state | `client/src/lab-02-tests/MyTickets.test.tsx` | ✅ Pass |
| **UI-13** | UI | AC-09 | MyTickets requester change | Previous requester's tickets cleared; new requester's tickets loaded | `client/src/lab-02-tests/MyTickets.test.tsx` | ✅ Pass |
| **UI-14** | UI | AC-15 | RequesterTicketDetail all fields read-only | No editable inputs in ticket header section | `client/src/lab-02-tests/RequesterTicketDetail.test.tsx` | ✅ Pass |
| **STYLE-01** | UI Style | — | Zen Green primary color applied to app header | Header element has background `#006B3C` | `client/src/lab-02-tests/ZenGreenTheme.test.tsx` | ✅ Pass |
| **STYLE-02** | UI Style | — | Required field asterisks present | All required fields show red asterisk (*) | `client/src/lab-02-tests/CreateTicket.test.tsx` | ✅ Pass |
| **STYLE-03** | UI Style | — | Validation messages appear below fields | Error message is a sibling/child below the input, not at top only | `client/src/lab-02-tests/CreateTicket.test.tsx` | ✅ Pass |
| **STYLE-04** | UI Style | — | Priority and Status badges rendered | Badge elements present with correct CSS classes | `client/src/lab-02-tests/MyTickets.test.tsx` | ✅ Pass |
| **RESP-01** | Responsive | AC-19 | Create Ticket at mobile (375px) | No horizontal scroll; fields stacked; buttons touch-friendly | `e2e/lab-02/responsive.spec.ts` | ✅ Pass |
| **RESP-02** | Responsive | — | My Tickets at tablet (768px) | Table or card layout; no clipping or overflow | `e2e/lab-02/responsive.spec.ts` | ✅ Pass |
| **RESP-03** | Responsive | — | My Tickets at desktop (1280px) | Full table layout; all columns visible | `e2e/lab-02/responsive.spec.ts` | ✅ Pass |
| **RESP-04** | Responsive | — | Ticket Detail at mobile (375px) | All fields readable; no horizontal scroll | `e2e/lab-02/responsive.spec.ts` | ✅ Pass |
| **E2E-01** | E2E | AC-01, AC-05 | Full Create Ticket flow | Requester selects context → fills form → submits → official Ticket Number shown | `e2e/lab-02/requester-ticket-flow.spec.ts` | ✅ Pass |
| **E2E-02** | E2E | AC-09, AC-10 | My Tickets: change requester + search | Switch requester → correct tickets load → search filters correctly | `e2e/lab-02/requester-ticket-flow.spec.ts` | ✅ Pass |
| **E2E-03** | E2E | AC-15, AC-16 | Ticket Detail + attachment download | Open owned ticket → attachment visible → download works | `e2e/lab-02/requester-ticket-flow.spec.ts` | ✅ Pass |
| **E2E-04** | E2E | AC-17 | Attachment soft-removal full flow | Remove with reason → item shows as removed → download blocked | `e2e/lab-02/requester-ticket-flow.spec.ts` | ✅ Pass |
| **E2E-05** | E2E | AC-03 | Cross-requester access blocked | Switch to Requester B → attempt to access Requester A's ticket via URL → blocked | `e2e/lab-02/requester-ticket-flow.spec.ts` | ✅ Pass |

---

## 3. Acceptance-Criterion Traceability

| AC ID | AC Summary | Covered By |
|---|---|---|
| AC-01 | Valid ticket creates + Ticket Number displayed | UNIT-01, API-01, UI-05, E2E-01 |
| AC-02 | No requester selected → selector shown | UI-01 |
| AC-03 | Requester B cannot access Requester A's ticket | API-04, E2E-05 |
| AC-04 | Empty summary → field error; no API call | UNIT-02, API-02, UI-03 |
| AC-05 | Summary > 200 chars → field error | UNIT-02, API-03, UI-04 |
| AC-06 | File > 5 MB → rejected before upload | API-15, UI-08 |
| AC-07 | Disallowed file type → rejected | API-16, UI-08 |
| AC-08 | 5 active attachments → Add disabled | API-14, UI-09 |
| AC-09 | Change requester → tickets reload | UI-13, E2E-02 |
| AC-10 | Search filters ticket list | API-06, E2E-02 |
| AC-11 | Category filter works | API-07 |
| AC-12 | Sort by Created Date descending | API-08 |
| AC-13 | No tickets → empty state | UI-11 |
| AC-14 | No search results → no-results state | UI-12 |
| AC-15 | Ticket Detail all fields read-only | UI-14, E2E-03 |
| AC-16 | Active attachment downloadable | API-11, E2E-03 |
| AC-17 | Soft-remove with reason → metadata retained; download blocked | API-12, API-13, UI-10, E2E-04 |
| AC-18 | Backend failure → error shown; form values preserved | UI-07 |
| AC-19 | Mobile viewport: no scroll; stacked layout | RESP-01 |
| AC-20 | Inactive requester absent from selector | API-17, UI-02 |

---

## 4. Responsive and Visual Checklist

To be completed during implementation using Playwright screenshots at 3 viewports.

| Check | Desktop (1280px) | Tablet (768px) | Mobile (375px) |
|---|---|---|---|
| No horizontal page scrolling | ✅ | ✅ | ✅ |
| No clipped labels or text | ✅ | ✅ | ✅ |
| No overlapping elements | ✅ | ✅ | ✅ |
| All buttons visible and touchable | ✅ | ✅ | ✅ |
| Required asterisks visible | ✅ | ✅ | ✅ |
| Validation messages below fields | ✅ | ✅ | ✅ |
| Badge colors consistent | ✅ | ✅ | ✅ |
| Header color `#006B3C` | ✅ | ✅ | ✅ |
| Read-only fields visually distinct | ✅ | ✅ | ✅ |
| Empty/no-results states shown | ✅ | ✅ | ✅ |
| Attachment names not clipped | ✅ | ✅ | ✅ |
| Pagination controls usable | ✅ | ✅ | ✅ |

---

## 5. Test Commands

```bash
# Unit + API tests (server)
cd server
npm run test                          # Run all tests
npm run test -- tests/lab-02/         # Run only lab-02 tests

# UI Component tests (client)
cd client
npm run test                          # Run all tests
npm run test -- src/lab-02-tests/     # Run only lab-02 tests

# E2E + Responsive tests (Playwright)
cd e2e
npx playwright test lab-02/           # Run all lab-02 E2E tests
npx playwright test lab-02/ --headed  # Run with browser visible
```

---

## 6. Final Results

> To be filled in after implementation is complete.

| Test ID | Result | Notes |
|---|---|---|
| UNIT-01 | ✅ Pass | |
| UNIT-02 | ✅ Pass | |
| UNIT-03 | ✅ Pass | |
| UNIT-04 | ✅ Pass | |
| API-01 | ✅ Pass | |
| API-02 | ✅ Pass | |
| API-03 | ✅ Pass | |
| API-04 | ✅ Pass | |
| API-05 | ✅ Pass | |
| API-06 | ✅ Pass | |
| API-07 | ✅ Pass | |
| API-08 | ✅ Pass | |
| API-09 | ✅ Pass | |
| API-10 | ✅ Pass | |
| API-11 | ✅ Pass | |
| API-12 | ✅ Pass | |
| API-13 | ✅ Pass | |
| API-14 | ✅ Pass | |
| API-15 | ✅ Pass | |
| API-16 | ✅ Pass | |
| API-17 | ✅ Pass | |
| API-18 | ✅ Pass | |
| UI-01 | ✅ Pass | |
| UI-02 | ✅ Pass | |
| UI-03 | ✅ Pass | |
| UI-04 | ✅ Pass | |
| UI-05 | ✅ Pass | |
| UI-06 | ✅ Pass | |
| UI-07 | ✅ Pass | |
| UI-08 | ✅ Pass | |
| UI-09 | ✅ Pass | |
| UI-10 | ✅ Pass | |
| UI-11 | ✅ Pass | |
| UI-12 | ✅ Pass | |
| UI-13 | ✅ Pass | |
| UI-14 | ✅ Pass | |
| STYLE-01 | ✅ Pass | |
| STYLE-02 | ✅ Pass | |
| STYLE-03 | ✅ Pass | |
| STYLE-04 | ✅ Pass | |
| RESP-01 | ✅ Pass | |
| RESP-02 | ✅ Pass | |
| RESP-03 | ✅ Pass | |
| RESP-04 | ✅ Pass | |
| E2E-01 | ✅ Pass | |
| E2E-02 | ✅ Pass | |
| E2E-03 | ✅ Pass | |
| E2E-04 | ✅ Pass | |
| E2E-05 | ✅ Pass | |

---

## 7. Known Limitations or Deferred Tests

| Item | Reason | Deferred To |
|---|---|---|
| IT Priority filter | IT Priority is null until IT Staff workflow added | Lab 3 |
| Comment/Note rendering | Out of Lab 2 scope | Lab 3 |
| Real authentication session tests | Auth excluded from Lab 2 | Lab 3 |
| File storage performance test | Not required for MVP | Post-Lab 2 |
