# Lab 3 Test Plan

## Overview
This document outlines the planned automated tests for Lab 3, ensuring coverage for authentication, authorization, IT Staff operations, and Admin user management.

## Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01 | Valid login | Authenticated response; safe user data; cookie set | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-02 | API | AC-02 | Login with incorrect password | 401 Unauthorized; no cookie | `server/tests/lab-03/auth.api.test.ts` | Pass |
| API-03 | API | AC-04 | Requester requests Internal Notes | 403 Forbidden; no note data returned | `server/tests/lab-03/notes.api.test.ts` | Pass |
| API-04 | API | AC-07 | Admin creates user with duplicate email | 409 Conflict or 400 Bad Request validation error | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| API-05 | API | AC-06 | Admin deactivates own account | 400 Bad Request with specific error message | `server/tests/lab-03/users-admin.api.test.ts` | Pass |
| API-06 | API | FR-05 | IT Staff accesses Admin endpoint | 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` | Pass |
| API-07 | API | FR-07 | IT Staff searches ticket queue | 200 OK; returns matching paginated tickets | `server/tests/lab-03/staff-queue.api.test.ts` | Pass |
| UI-01 | UI | FR-01 | Render Login component | Form renders correctly with validation | `client/tests/lab-03/Login.test.tsx` | Pass |
| UI-02 | UI | FR-12 | Render Admin User Management | Table renders users; create button opens modal | `client/tests/lab-03/UserManagement.test.tsx` | Pass |
| E2E-01 | E2E | AC-01, AC-08 | Full login and navigation flow | User logs in and sees correct Role navigation | `e2e/lab-03/authentication.spec.ts` | Pass |
| E2E-02 | E2E | AC-02 | Initial password login and change | Normal app opens only after valid change | `e2e/lab-03/first-login.spec.ts` | Pass |
| E2E-03 | E2E | FR-07, FR-08 | IT Staff workflow | Staff logs in, views queue, claims ticket, adds note | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| E2E-04 | E2E | FR-13 | Admin workflow | Admin creates user, edits role, tests login of new user | `e2e/lab-03/user-administration.spec.ts` | Pass |
