# Lab 3 Test Plan and Current Verification

## Status convention

- **Pass**: executed in this workspace and passed.
- **Blocked**: test exists, but execution needs an unavailable external dependency.
- **Not run**: test exists and is ready, but has not been executed against the full application stack.

## Automated tests

| Test ID | Layer | Coverage | Test file | Current result |
|---|---|---|---|---|
| API-01 | API | Valid login, cookie, safe identity | `server/tests/lab-03/auth.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| API-02 | API | Invalid and inactive login | `server/tests/lab-03/auth.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| API-03 | API | `/me`, first-login restriction, password confirmation | `server/tests/lab-03/auth.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| API-04 | API | Cross-requester ticket access and protected endpoints | `server/tests/lab-03/authorization.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| API-05 | API | Public comments and internal-note visibility | `server/tests/lab-03/comments-notes.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| API-06 | API | Staff queue filters, sorting, pagination, invalid query values | `server/tests/lab-03/staff-queue.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| API-07 | API | Staff status, priority, and owner operations | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| API-08 | API | Admin list/create/update/reset and self-deactivation rule | `server/tests/lab-03/users-admin.api.test.ts` | Pass - 22 September 2026, isolated PostgreSQL |
| UI-01 | UI | Login validation and role login flow | `client/src/lab-03-tests/Login.test.tsx` | Pass — 2 tests |
| UI-02 | UI | First-login password confirmation and save | `client/src/lab-03-tests/ChangePassword.test.tsx` | Pass — 2 tests |
| UI-03 | UI | Staff queue rendering and search | `client/src/lab-03-tests/StaffTicketQueue.test.tsx` | Pass — 1 test |
| UI-04 | UI | Staff ticket detail and status update | `client/src/lab-03-tests/StaffTicketDetail.test.tsx` | Pass — 1 test |
| UI-05 | UI | Admin user-management modal | `client/src/lab-03-tests/UserManagement.test.tsx` | Pass — 1 test |
| UI-06 | UI | Admin access, filtering, create/edit/reset flows | `client/src/lab-03-tests/AdminE2E.test.tsx` | Pass — 5 tests |
| E2E-01 | E2E | Login, invalid login, role navigation | `e2e/lab-03/authentication.spec.ts` | Pass - 22 September 2026, disposable test accounts |
| E2E-02 | E2E | Initial password change gate | `e2e/lab-03/first-login.spec.ts` | Pass - 22 September 2026, disposable test accounts |
| E2E-03 | E2E | Staff queue and ticket detail | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass - 22 September 2026, disposable test accounts |
| E2E-04 | E2E | Admin user creation and first-login flag | `e2e/lab-03/user-administration.spec.ts` | Pass - 22 September 2026, disposable test accounts |

## Verified execution - 22 September 2026

Workspace: `feature6/lab3-docs`, base HEAD `7dd7555`, with the local fixes in this working tree.
Database: `toktickit_lab3_verify_20260922` (new isolated database, all four migrations applied).
These results are not a verification of `main`.

| Scope | Result | Raw output |
|---|---|---|
| All server tests, including Lab 1/2 regression | 13 files, 64 tests passed; no cleanup-hook errors | [API log](../../report-assets/lab3-verification/api.txt) |
| Lab 3 API subset | 6 files, 31 tests passed; also included in full server run | API log above |
| All frontend tests, including requester regression | 13 files, 31 tests passed | [UI log](../../report-assets/lab3-verification/ui.txt) |
| Lab 3 frontend subset | 6 files, 12 tests passed; included in full frontend run | UI log above |
| Complete Playwright run | 8 passed: 5 Lab 3, 1 Lab 2 requester flow, 2 external example tests | [E2E log](../../report-assets/lab3-verification/e2e.txt) |
| Server TypeScript | Exit 0 | [Server type-check log](../../report-assets/lab3-verification/server-types.txt) |
| Client TypeScript | Exit 0; type check only, not a production build | [Client type-check log](../../report-assets/lab3-verification/client-types.txt) |

## Regression migration and fixtures

- Replace retired `X-Requester-Id` and RequesterContext fixtures with authenticated, owned test users.
- Keep assertions for ticket length validation, reference validation, pagination, attachment size/removal, and cross-requester access.
- Restore ticket numbering to the documented `TKT-YYYY-NNNNNN` contract.
- Admin self-deactivation sends the complete update payload so the business-rule assertion is actually exercised.
- Delete comments/notes/attachments before their test ticket, then delete only users created by that suite.
- E2E creates a fresh must-change-password account for each first-login test, waits for navigation, and checks a known ticket instead of silently skipping an empty queue.
- Admin browser coverage now submits the create form and verifies the new account and first-login flag.

## Reproduction

Use the isolated database setup in [README](../../README.md). Keep API and E2E on the same DATABASE_URL.
From the corresponding package directory:

```powershell
# server
npx tsc --noEmit
npx vitest run --fileParallelism=false

# client
npx tsc -b --noEmit
npx vitest run --pool=threads --maxWorkers=1

# e2e (API on 4000, client on 5173)
npx playwright test --workers=1
```

## Screenshot evidence

Real browser captures are under `report-assets/lab3-e2e/`: login, invalid login,
first-login gate, requester tickets, staff queue/detail, admin list, create modal,
created account, and requester-created ticket. These are desktop captures; they
do not assert mobile/tablet coverage or coverage of every manual acceptance criterion.
Passing automated tests demonstrate the listed assertions, not every requirement in the lab sheet.
