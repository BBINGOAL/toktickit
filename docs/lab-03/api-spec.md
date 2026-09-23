# Lab 3 API Contract

## 1. Authentication APIs
- **`POST /api/auth/login`**: Accepts `{ email, password }`. Returns session cookie and user info `{ id, name, email, role, mustChangePassword }`.
- **`POST /api/auth/logout`**: Clears session cookie.
- **`GET /api/auth/me`**: Returns current authenticated user info. 401 if not logged in.
- **`POST /api/auth/change-password`**: Accepts `{ newPassword, confirmPassword }`. Requires at least six characters and matching confirmation, then sets `mustChangePassword = false`.

## 2. Requester APIs (Migrated from Lab 2)
- All Lab 2 APIs (`/api/tickets`, `/api/attachments`) updated to extract `userId` from the authenticated session instead of the request body or header.

## 3. IT Staff APIs
- **`GET /api/staff/tickets`**: Retrieve queue. Query params: `search`, `status`, `priority`, `categoryId`, `ownerId`, `sort`, `order`, `page`, `pageSize`. Returns paginated list.
- **`PATCH /api/tickets/:id/status`**: Accepts `{ status }`. Updates ticket status.
- **`PATCH /api/tickets/:id/owner`**: Accepts `{ ownerId }` (or null to unassign).
- **`PATCH /api/tickets/:id/priority`**: Accepts `{ itPriority }`.

## 4. Collaboration APIs
- **`GET /api/tickets/:id/comments`**: Retrieve public comments.
- **`POST /api/tickets/:id/comments`**: Accepts `{ content }`. Adds public comment.
- **`GET /api/tickets/:id/notes`**: Retrieve internal notes. (IT Staff/Admin only).
- **`POST /api/tickets/:id/notes`**: Accepts `{ content }`. Adds internal note. (IT Staff/Admin only).
- **`POST /api/tickets/:id/requester-resolved`**: Requester-only action that records that the problem appears resolved without changing the formal ticket status.

## 5. Administrator APIs
- **`GET /api/admin/users`**: Query params: `search`, `role`. Returns list of users.
- **`POST /api/admin/users`**: Accepts `{ name, email, role, initialPassword }`. Creates an active user with `mustChangePassword = true`.
- **`PATCH /api/admin/users/:id`** or **`PUT /api/admin/users/:id`**: Accepts `{ name, email, role, isActive }`. Updates basic user data.
- **`POST /api/admin/users/:id/reset-password`**: Accepts `{ newInitialPassword }` and forces a password change at next login.
