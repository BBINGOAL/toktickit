# Lab 3 UI Specification

## 1. Login & Change Password Screen
- **Login**: Email and Password inputs. Submit button. Validation errors for empty fields or invalid credentials (incorrect email/password). 
- **Change Password**: Displayed immediately after login if `mustChangePassword` is true. Requires "New Password" and "Confirm New Password". 
- **Visuals**: Centered card layout on a Zen Green background or subtle pattern to distinguish from the main app shell.

## 2. Application Shell Update
- **Header**: Remove the "Development Requester" dropdown. Replace with a User Profile menu on the right.
- **Profile Menu**: Shows `Name`, `Role` Badge (e.g., [Requester], [IT Staff]), and a `Logout` button.
- **Navigation**: 
  - Requester: My Tickets, Create Ticket.
  - IT Staff: Ticket Queue.
  - Admin: User Management.

## 3. IT Staff Ticket Queue
- **Layout**: Data table on desktop, cards on mobile.
- **Columns**: Ticket No., Created Date, Summary, Category, Requested Priority, **IT Priority** (editable or badge), **Current Status** (badge), **Ticket Owner**.
- **Actions**: Search bar, Filters (Status, Priority, Category, Assigned To), Pagination.
- **Clicking a row**: Navigates to IT Staff Ticket Detail.

## 4. IT Staff Ticket Detail
- **Header Section**: Ticket No, Category, Related System, Requester info.
- **Operations Section**: 
  - Dropdown to change **Status** (respecting allowed transitions).
  - Dropdown to change **IT Priority**.
  - Dropdown/Button to **Claim** or **Reassign** the ticket.
- **Attachments**: View and download attachments.
- **Collaboration Section**: 
  - Tabs or separate lists for **Public Comments** and **Internal Notes**.
  - Textarea to add new comment/note. Submit button.

## 5. Administrator User Management
- **List View**: Table showing Name, Email, Role (Badge), Status (Active/Inactive badge).
- **Search/Filter**: Search by name/email. Filter by Role.
- **Actions**: "Create User" button. "Edit" button per row.
- **Create/Edit User Modal**:
  - Fields: Name, Email, Role (Select), Initial Password (only on Create or "Reset Password" action), Is Active (Checkbox/Toggle).
  - Validation: Email format, required fields.
