# Reviewer Notes — Lab 3

## Review scope

This review covers the Lab 3 implementation on branch `feature6/lab3-docs`, including authentication, authorization, migration, staff ticket operations, comments/notes, administrator user management, client route guards, seed data, and automated test artifacts.

## What is present

- Login, logout, current-user lookup, HTTP-only cookie authentication, and mandatory first-login password change.
- Server-side role and ownership checks for requester, IT staff, and administrator operations.
- User migration from `DevRequester`, preservation of requester/ticket relationships, and a follow-up migration for requester resolution indication.
- Staff queue filters, sorting, pagination, status/priority/owner operations, public comments, and internal notes.
- Administrator user list, search/filter, create, update, activate/deactivate, and reset-password flows.
- UI role guards for requester, staff, and admin routes.
- Lab 3 API tests, UI tests, and Playwright E2E scenario files.

## Evidence collected

- Server TypeScript check: passed.
- Client TypeScript build check: passed.
- Lab 3 UI tests: passed, 6 files and 12 tests.
- Playwright E2E discovery: passed, 4 Lab 3 files parsed and listed.
- API test execution: blocked because Docker Desktop/PostgreSQL was unavailable at `127.0.0.1:5434`.

See `docs/lab-03/tests.md` for the exact command and status of every planned case.

## Review points for the human reviewer

1. Start PostgreSQL/Docker, run migrations and seed, then execute all API tests.
2. Run the client and server, configure fresh first-login accounts, and execute the four Lab 3 Playwright specs.
3. Verify the migration on a copy of the Lab 2 database before applying it to any shared database.
4. Confirm that the allowed status-transition matrix matches the course rubric.
5. Confirm whether Admin should be allowed to use the staff queue; the current implementation permits Admin on staff ticket operations and restricts Admin-only user management separately.
6. Review generated screenshots/submission artifacts after the full-stack E2E run; no new Lab 3 screenshot evidence is claimed yet.

## Recommendation

The implementation is ready for integrated verification, but should not be marked fully complete until the database-backed API suite and the full-stack E2E suite have been run successfully and the migration has been checked against the actual Lab 2 data.
