# AI Use Disclosure — Lab 3

## Purpose

AI assistance was used as a development and review aid for the Lab 3 authentication, authorization, staff workflow, administrator workflow, migration, and testing work.

## AI-assisted work

- Inspected the Lab 3 specification, API contract, existing server/client code, migrations, seed data, and test folders.
- Identified gaps between the written requirements and the implementation, including missing current-user authentication, first-login gating, role/ownership checks, API contract mismatches, migration preservation, deterministic seed data, and missing Lab 3 test files.
- Assisted with implementation of shared Prisma access, authentication middleware/controller changes, role-based routes, requester-resolution state, admin validation, migration/seed updates, client route guards, login confirmation fields, and test coverage.
- Assisted with creating API, UI, and Playwright test scenarios and updating the test plan to distinguish executed results from environment-blocked results.

## Human verification and decisions

- The student tested the main workflows in the browser using Antigravity and confirmed the tested happy paths behaved normally.
- The student remains responsible for confirming the final behavior against the course rubric, reviewing all code changes, and deciding whether the chosen status-transition matrix matches the instructor's expectations.
- The final API and E2E runs still require PostgreSQL/Docker and the running client/server services. Those results are intentionally not claimed as passed in `tests.md`.

## Important implementation decisions

- Authentication uses an HTTP-only JWT cookie.
- `mustChangePassword` blocks normal application routes while still allowing `/api/auth/me` and `/api/auth/change-password`.
- Requester ticket access is checked server-side using the authenticated user, not a client-supplied requester ID.
- Existing Lab 2 requester records are migrated into `User` records with the initial password `password123` and `mustChangePassword = true`.

## Limitations

AI assistance does not replace manual review, browser verification, database migration review, or the final reviewer decision. The current evidence and blockers are recorded in `docs/lab-03/tests.md`.
