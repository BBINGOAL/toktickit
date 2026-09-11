# Lab 3 Sprint Engineering Specification

**Project:** TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens  
**Sprint:** Lab 3 | Semester 1/2026  
**Status:** Draft — Awaiting Student Review & Approval

---

## 1. Sprint Goal
Replace the temporary Development Requester selector with secure authentication and role-based authorization. Introduce operational IT Staff workflows (Ticket Queue, Ticket Detail, Comments, Notes, Priority, Status) and a minimalist Administrator user management screen. By the end of this sprint, the application will securely support Requester, IT Staff, and Administrator roles while migrating and preserving all Lab 2 capabilities.

---

## 2. Stakeholder Request Interpretation
The temporary testing selector needs to be replaced with a real login system. Users must authenticate with email/password and change their initial password on first login. The system must enforce role-based access. Requesters continue to manage their own tickets. IT Staff gain a new Ticket Queue to find work, claim tickets, set IT Priority, update statuses, and communicate via Public Comments or Internal Notes. Administrators get a simple screen to manage user accounts (create, edit, set role, activate/deactivate, set initial password).

---

## 3. Scope

### Included
- Authentication: login, logout, current user context, mandatory first-login password change.
- Server-side role-based authorization for Requester, IT Staff, and Administrator.
- Migration from Development Requester to authenticated User model.
- IT Staff Ticket Queue with search, filters, sorting, and pagination.
- IT Staff Ticket Detail: ownership claim/reassign, IT Priority, status updates.
- Ticket collaboration: Public Comments (visible to all) and Internal Notes (IT Staff/Admin only).
- Administrator minimalist User Management screen.
- Zen Green UI extensions for login, queue, and admin screens.
- REST API updates to support all above operations.

### Excluded
- Email invitations, password-reset emails, MFA, social login, SSO.
- Self-registration or multiple roles per user.
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculation, escalation rules, and notification services.
- Advanced Admin features: user deletion, bulk operations, import/export.
- Dashboards and KPI analytics.

---

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | The system shall provide a Login screen requiring email and password. |
| FR-02 | A user logging in with an initial password must be forced to change it before accessing the application. |
| FR-03 | The application shell shall display the authenticated user's name, role, and a Logout action. |
| FR-04 | The system shall enforce role-based navigation, hiding unauthorized UI elements. |
| FR-05 | The backend shall enforce authorization on all API endpoints based on the authenticated user's role and ownership. |
| FR-06 | Lab 2 Requester functions (Create Ticket, My Tickets, Detail, Attachments) shall use the authenticated identity and remain fully functional. |
| FR-07 | IT Staff shall access a Ticket Queue supporting search, filters, sorting, and pagination. |
| FR-08 | IT Staff shall be able to open any ticket, claim ownership, or reassign it. |
| FR-09 | IT Staff shall be able to change IT Priority and Ticket Status following permitted transitions. |
| FR-10 | Any permitted user may post Public Comments. IT Staff and Administrators may post Internal Notes. |
| FR-11 | A Requester may indicate a problem appears resolved but cannot formally close it. |
| FR-12 | Administrators shall access a User Management screen to list, search, and filter users. |
| FR-13 | Administrators shall be able to create users, update basic info, assign one role, activate/deactivate, and set new initial passwords. |

---

## 5. Business Rules

| ID | Rule |
|---|---|
| BR-01 | Only an active user with valid credentials may authenticate. |
| BR-02 | A user marked as requiring a password change cannot enter the normal application until a new valid password is saved. |
| BR-03 | The authenticated user identity, not a requesterId supplied by the client, determines ownership of Requester operations. |
| BR-04 | Public Comments are visible to the Requester, IT Staff, and Administrator. Internal Notes are visible only to IT Staff and Administrator. |
| BR-05 | A Requester may indicate that the problem appears resolved, but cannot formally set the Ticket to Resolved or Closed. |
| BR-06 | Passwords must be hashed and never stored in plaintext. |
| BR-07 | A Ticket may have zero or one primary Ticket Owner (active IT Staff or Admin). |
| BR-08 | IT Priority initially copies Requested Priority and may later be changed only by IT Staff or Administrator. |
| BR-09 | Permitted statuses are New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled. |
| BR-10 | Comments and Notes are append-only. Editing and deletion are excluded. Content cannot be empty. |
| BR-11 | Duplicate email addresses are not allowed when creating or updating a user. |
| BR-12 | An Administrator cannot deactivate their own account. |
| BR-13 | The system must prevent removal or deactivation of the last active Administrator. |
| BR-14 | User deletion is not permitted; use deactivation (isActive = false) instead. |

---

## 6. UI Specification Summary
See `docs/lab-03/ui-spec.md` for full details.
- **Login & Password Change**: Centered card layout in Zen Green theme. Clear validation for incorrect credentials.
- **App Shell Update**: Replaces Dev Requester selector with User Profile menu (Name, Role, Logout).
- **IT Staff Ticket Queue**: Data table similar to My Tickets but with IT Staff specific columns (IT Priority, Ticket Owner, etc.) and global access.
- **IT Staff Ticket Detail**: Read/write access to IT Priority, Status, Owner. Includes a tabbed or stacked section for Public Comments vs Internal Notes.
- **Admin User Management**: List view with Search, Filter by Role, and Action buttons. Modal/Drawer for Create/Edit User.

---

## 7. Data Changes

### Models
- **User** (New): Replaces `DevRequester`. Fields: `id`, `name`, `email`, `passwordHash`, `role` (Enum), `isActive`, `mustChangePassword`, `createdAt`, `updatedAt`.
- **PublicComment** (New): Fields: `id`, `ticketId`, `authorId`, `content`, `createdAt`.
- **InternalNote** (New): Fields: `id`, `ticketId`, `authorId`, `content`, `createdAt`.
- **Ticket** (Updated): Change `requesterId` to reference `User.id`. Add `ownerId` referencing `User.id`. Expand `status` enum.

### Migration
- Existing `DevRequester` records will be migrated to `User` records with role `REQUESTER`.
- Initial passwords will be seeded (and documented) for these accounts.
- `Ticket` ownership will seamlessly transition to the new `User` IDs.

---

## 8. API Contract
See `docs/lab-03/api-spec.md` for full details.
- **Auth**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`
- **IT Staff Queue**: `GET /api/staff/tickets`
- **Ticket Operations**: `PATCH /api/tickets/:id/status`, `PATCH /api/tickets/:id/owner`, `PATCH /api/tickets/:id/priority`
- **Comments/Notes**: `POST /api/tickets/:id/comments`, `GET /api/tickets/:id/comments`, `POST /api/tickets/:id/notes`, `GET /api/tickets/:id/notes`
- **Admin Users**: `GET /api/admin/users`, `POST /api/admin/users`, `PATCH /api/admin/users/:id`

---

## 9. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-01 | Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity and role. |
| AC-02 | Given a user who must change the initial password, when login succeeds, then normal application screens remain unavailable until a valid new password is saved. |
| AC-03 | Given an authenticated Requester, when the client supplies another requesterId, then the backend still applies the authenticated identity and does not return another Requester’s data. |
| AC-04 | Given a Requester account, when an Internal Note endpoint is requested, then the operation is rejected (403) without exposing note content. |
| AC-05 | Given an IT Staff user, when viewing the queue, they can search by summary, filter by status, and see paginated results. |
| AC-06 | Given an Admin user, when attempting to deactivate their own account, the system rejects the operation and displays a safe error message. |
| AC-07 | Given an Admin user, when creating a new user with an email that already exists, the system rejects it with a validation error. |
| AC-08 | Given a logged-out state, when any protected page is accessed directly via URL, the user is redirected to the Login page. |

---

## 10. Definition of Done
### Product Completion
- [ ] Authentication (Login, Logout, Change Password) fully implemented.
- [ ] Role-based authorization enforced on all API endpoints and UI routes.
- [ ] Lab 2 capabilities fully migrated and functioning for authenticated Requesters.
- [ ] IT Staff Ticket Queue and Detail screens implemented and functional.
- [ ] Public Comments and Internal Notes implemented with correct visibility rules.
- [ ] Administrator User Management implemented (list, create, edit, activate/deactivate, set password).
- [ ] All Acceptance Criteria satisfied.
- [ ] All planned automated tests in `tests.md` pass.

### Course Delivery
- [ ] Work done on feature branches and merged via PR into `lab3-staging`.
- [ ] GitHub Issues used properly (All in Done).
- [ ] `reviewer.md` and `ai-use.md` completed.
- [ ] Submission PDF generated correctly.

---

## 11. Assumptions and Decisions
- **D-01**: Authentication will use HTTP-only cookies storing a JWT to minimize XSS risks and avoid complex session state management, which fits the lab's scope.
- **D-02**: The migration from `DevRequester` to `User` will involve a SQL script that inserts into `User` based on `DevRequester` and updates `Ticket` FKs.
