# Lab 3 Test Plan and Current Verification

## Status convention

- **Pass**: executed in this workspace and passed.
- **Blocked**: test exists, but execution needs an unavailable external dependency.
- **Not run**: test exists and is ready, but has not been executed against the full application stack.

## Automated tests

| Test ID | Layer | Coverage | Test file | Current result |
|---|---|---|---|---|
| API-01 | API | Valid login, cookie, safe identity | `server/tests/lab-03/auth.api.test.ts` | Blocked — PostgreSQL/Docker unavailable at `127.0.0.1:5434` |
| API-02 | API | Invalid and inactive login | `server/tests/lab-03/auth.api.test.ts` | Blocked — same database dependency |
| API-03 | API | `/me`, first-login restriction, password confirmation | `server/tests/lab-03/auth.api.test.ts` | Blocked — same database dependency |
| API-04 | API | Cross-requester ticket access and protected endpoints | `server/tests/lab-03/authorization.api.test.ts` | Blocked — same database dependency |
| API-05 | API | Public comments and internal-note visibility | `server/tests/lab-03/comments-notes.api.test.ts` | Blocked — same database dependency |
| API-06 | API | Staff queue filters, sorting, pagination, invalid query values | `server/tests/lab-03/staff-queue.api.test.ts` | Blocked — same database dependency |
| API-07 | API | Staff status, priority, and owner operations | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Blocked — same database dependency |
| API-08 | API | Admin list/create/update/reset and self-deactivation rule | `server/tests/lab-03/users-admin.api.test.ts` | Blocked — same database dependency |
| UI-01 | UI | Login validation and role login flow | `client/src/lab-03-tests/Login.test.tsx` | Pass — 2 tests |
| UI-02 | UI | First-login password confirmation and save | `client/src/lab-03-tests/ChangePassword.test.tsx` | Pass — 2 tests |
| UI-03 | UI | Staff queue rendering and search | `client/src/lab-03-tests/StaffTicketQueue.test.tsx` | Pass — 1 test |
| UI-04 | UI | Staff ticket detail and status update | `client/src/lab-03-tests/StaffTicketDetail.test.tsx` | Pass — 1 test |
| UI-05 | UI | Admin user-management modal | `client/src/lab-03-tests/UserManagement.test.tsx` | Pass — 1 test |
| UI-06 | UI | Admin access, filtering, create/edit/reset flows | `client/src/lab-03-tests/AdminE2E.test.tsx` | Pass — 5 tests |
| E2E-01 | E2E | Login, invalid login, role navigation | `e2e/lab-03/authentication.spec.ts` | Not run — requires client, API, and seeded DB |
| E2E-02 | E2E | Initial password change gate | `e2e/lab-03/first-login.spec.ts` | Not run — requires a fresh first-login account |
| E2E-03 | E2E | Staff queue and ticket detail | `e2e/lab-03/staff-ticket-flow.spec.ts` | Not run — requires client, API, and seeded DB |
| E2E-04 | E2E | Admin user-management entry flow | `e2e/lab-03/user-administration.spec.ts` | Not run — requires client, API, and seeded DB |

## Verification commands

```powershell
# Static checks
cd server; npx tsc --noEmit
cd ../client; npx tsc -b --noEmit

# UI tests
cd client; npx vitest run --pool=threads --maxWorkers=1 src/lab-03-tests

# API tests (start Docker/PostgreSQL first)
cd ../server; npm test

# E2E (start DB, API, and client first)
cd ../e2e; npx playwright test lab-03
```

The API suite was loaded in this workspace, but execution stopped at the database connection because Docker Desktop/PostgreSQL was not running. Do not report those cases as Pass until the command completes with the database available.
