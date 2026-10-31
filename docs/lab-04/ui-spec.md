# Lab 4 UI Specification

Status: final main 768975d verified on 2026-10-31; backend 278 plus performance 1, client 109 and full application Chromium 49 pass. See release-verification.md for exact scope and real capture conditions.

## Application shell and routes

Preserve Zen Green tokens, existing role labels/navigation and active-page indication. After sign-in or required password change, Requester lands on `/dashboard`; Staff/Admin on `/staff/dashboard`. Existing My Tickets, Create Ticket, Ticket Queue, Ticket Detail and Admin Users remain reachable. Signed-out users return to login; direct forbidden routes show a clear forbidden state, not a misleading working dashboard.

Current #49 boundary: Requester login/required password change lands on /dashboard; Staff/Admin now land on /staff/dashboard, including after first-password change. Wrong-role protected routes display Access denied with permitted shell navigation. Dashboard cards use server totals/URLs; loading never invents zero counts, recoverable refresh failures label previous data, and 401/403 clears it. Late responses from an earlier user/query are ignored.

Dashboard navigation is a real link with visible active state. Grid: one metric column on narrow mobile, two on tablet, up to four on desktop; labels/counts wrap without clipping. Major verification widths: 390x844, 768x1024, 1280x900, plus 320px minimum-width smoke. Page must not scroll horizontally. Wide tables may scroll inside a labeled container with visible access to hidden actions.

## Requester Dashboard

Cards: Active Tickets, Waiting for You, Recently Updated (7 calendar dates), Recently Resolved (same window). Explain timezone/window using API metadata; show 0 explicitly. Cards are keyboard links to exact filtered My Tickets URLs. Recent Tickets and Needs Your Attention list Ticket number, summary, status and updated time (max 5 each), with detail links and view-all. Quick actions: Create Ticket and My Tickets.

Backend performs calculations; frontend never counts a partially loaded list. Refresh displays last snapshot time. No charts required. Never expose other Requesters' rows or Staff-only notes. All cards/list items have meaningful link text.

## Staff/Admin Dashboard

Cards: Unassigned Active, My Active Tickets, My Pending Actions. Status and active IT-priority groups have text labels/counts and filtered Queue links. Lists: My Actions, Recent Tickets and Urgent Tickets (each max 5). My Actions links focus/scroll to the action on Ticket Detail; view-all uses a paged My Actions mode on Staff Dashboard backed by `/api/staff/actions`. Preserve selected page in URL, use page size 10/25/50 and display matching total. Admin reuses this screen and retains Users navigation.

Use unset-priority label rather than a blank badge. Urgent indicates HIGH IT priority on an active Ticket, not requested priority. Current-user actions are assigned to the signed-in user, not all actions they originally created.

Issue #49: three primary Staff cards, status/priority groups with all keys including zeros, bounded work/recent/urgent previews, and /staff/dashboard?view=my-actions&page=1&pageSize=10. Preserve My Actions page/size on refresh/Back; reset page on size change. Its direct action link opens the named details/history dialog with initial focus and Escape close, independent of action-list page one; safe missing/inaccessible feedback has explicit retry. A read-only dialog does not add edit rights. Queue now offers search/status/IT priority including UNSET/owner/scope/sort/order and 10/25/50 pagination. Filters reset page atomically and preserve other Dashboard predicates; clear removes them. Its labeled focusable table scrolls internally rather than widening the page. Empty/out-of-range, loading, retry and role denial are distinct.

## Actions Taken on Ticket Detail

Add a clearly labeled shared section separate from Public Comments and private Internal Notes. List shows work date/time (actionDateTime), description, result, performer, assignee, status, follow-up flag/note, attachment notes and work cycle. Primary order is actionDateTime ASC,id ASC; createdAt appears separately as Recorded at in details/audit and does not reorder the action list. Paginate, retain selected action across refresh where possible. Show zero state and no Requester mutation controls. Multiple staff and multiple actions can be displayed without implying they replaced Ticket owner.

Staff/Admin can open an accessible create/edit dialog. Fields: action date/time, description, result, active assignee selection, follow-up checkbox, conditional required note, attachment notes, optional predecessor choice for a follow-up. Actor, Ticket and work cycle are read-only server values. Initial state PLANNED; action state controls offer only permitted transitions. Completion requires result. Cancellation requires confirmation plus reason. COMPLETED/CANCELLED records have read-only detail/history; new linked follow-up records resolve earlier follow-up requirements.

Render history chronologically by createdAt ASC,id ASC with actor/time/change descriptions. Start is offered for PLANNED; Complete is offered only for IN_PROGRESS. Starting then completing requires two successful versioned requests, with no direct PLANNED-to-COMPLETED shortcut. History and action fields use plain text, no unsanitized HTML. Attachment Notes identify existing files and do not create a new upload interface. Retain existing Ticket attachments interface.

Create/save/start/complete/cancel disables while pending. A submission intent keeps one idempotency key through retry; create a new key after successful save or deliberately abandoning/restarting the form. On recoverable failure retain all fields. Conflict displays current version, lets user load current values, and preserves draft for comparison; never silently retry an old overwrite. Inactive assignee error stays near selector and refreshes choices.

## Ticket workflow

Issue #47 implementation: `TicketWorkflow` renders separately from Actions Taken. A status selection is intentional draft state; use Apply status to submit. RESOLVED reveals a required resolution summary and CANCELLED a required reason/confirmation. Owner and nullable priority changes use the current version and their own exact-intent key. Workflow history is paginated read-only. A stale reload retains summary/reason drafts without automatically resending. See workflow-verification.md for feature-branch results, not final-main evidence.

Show only API allowedNextStatuses for Staff/Admin plus current read-only status. Formal Resolve opens/uses resolution summary input and displays unmet gate reasons. Cancellation collects a reason. Submit current expectedVersion and a workflow idempotency key; on success refresh Ticket/action summaries, new versions and history. On stale state, explain another change occurred and reload before another intentional change.

Requester sees advisory resolution control only in allowed states; label it "Problem appears resolved" with explanation that Staff review is required. Formal Ticket status remains unchanged. Reopened Tickets display new cycle and preserve old history. Stable history ordering applies even for equal timestamps.

Queue and My Tickets consume dashboard URLs and show current filters. Staff sorting controls and pagination expose all matching data; reset page to 1 on filter change and use 10/25/50 sizes. Clear filters returns to normal detailed view.

Requester implementation: My Tickets reads query filters/page/sort directly from the URL, preserves Dashboard date/scope bounds during category/priority/status/search/sort/pagination changes and resets page atomically for changed filters. Back/Forward/reload restores query state. Clear Filters removes Dashboard bounds too. Wide results have a labeled keyboard-focusable internal scroll region; sort headers and page controls are keyboard buttons. Positive out-of-range pages retain actual totals with an earlier-page explanation.

## Feedback states

| State | Required behavior |
|---|---|
| Loading | Labeled busy state; no premature zero/error cards; pending buttons disabled. |
| Empty/no results | Meaningful text, 0 counts, preserved filters, actionable view-all/create where permitted. |
| Validation | Field-level errors connected by aria-describedby plus focusable summary. |
| Success | Concise live announcement and refreshed authoritative state; no duplicated events. |
| Forbidden | Clear role/ownership denial and permitted navigation, no leaked partial content. |
| Not found | Same generic Ticket/action unavailable message for missing and non-owned resources, with return link; no ownership/existence hint or indefinitely spinning state. |
| Conflict | Visible explanation/current version, reload option and preserved draft. |
| Safe API failure | Retry control, safe text, existing/draft data retained and no false success. |

## Accessibility, responsive and visual inspection

Issue #50 extends shared focus-trapped Dialog to Administrator create/edit and attachment removal. It restores the opener, prevents Escape while saving, and confirms discarding dirty user drafts. User filters have accessible names and ignore outdated search responses. Comments/private notes have labelled inputs, explicit loading/error/reload/success states, synchronous pending locks and retained text on failure; private notes remain Staff/Admin only. Attachment removal keeps the reason after failure, and upload is triggered by a keyboard-operable button.

Create Ticket labels are linked to controls with field-error descriptions and a focused validation summary. Responsive grids stack on phones. If creation succeeds but an attachment fails, show the saved Ticket number and upload warning with navigation to My Tickets; never offer the same creation form again. This avoids resubmitting an already-created Ticket. Arbitrary server outage text is suppressed in earlier write transports; known validation/domain feedback remains available.

Staff cards label their asOf snapshot and explicitly state Queue/My Actions links load current data. Linked-action Close/Escape clears only actionId with replace; malformed links receive their own feedback. ActionsTaken is separated into list, editor, details, history, pager and presentation helpers; one Dialog implements the existing focus/draft behavior.

Use existing typography/colors/spacing and semantic headings, buttons, links and table headers. Status/priority include text, never color-only meaning. Focus indicator at least a visible 2px outline; verify every actionable card/form/pagination element by keyboard. Form labels have stable IDs; checkbox state and required notes are announced. Modal has dialog role, accessible name, focus trap, Escape close when safe, initial focus and restoration to trigger. Warn before discarding a dirty draft; do not lose it on API failure.

At desktop/tablet/mobile widths verify cards, action list, create/edit/cancel modes, dashboard preview/view-all and workflow controls. Long names/descriptions/IDs wrap. Modal stays within viewport with internal vertical scrolling. No clipped nav, overlap or whole-page horizontal overflow. Check adequate text contrast (normal text 4.5:1, large text 3:1) and keyboard focus visibility against actual styles. Test zoom 200% and headings/screen-reader names; remove obsolete placeholder controls and console errors.

Screenshots are real runtime captures stored locally under `artifacts/lab-04/screenshots/{staff-dashboard,requester-dashboard,actions-taken}/`. They and report assets remain uncommitted per student instruction. The checklist below records inspected runtime states and scoped automated checks.

| Check | Planned evidence | Status |
|---|---|---|
| Zen Green consistency, statuses and private/shared distinction | Major screens and Ticket Detail | Main pass: actual captures inspected; Bootstrap precedes app theme and rendered button colors asserted; main 768975d verified |
| Dashboard cards/counts/drill-down | Both role dashboards, zero and populated | Requester and Staff/Admin API/UI/E2E pass on verified main; main 768975d verified |
| Actions modes, editable/read-only and validation placement | List/create/edit/terminal/follow-up/conflict | Actions integrated checks pass; runtime lifecycle/failure E2E pass; images inspected |
| Keyboard, focus, modal, labels and contrast | Keyboard inspection and component/E2E | Main pass: earlier/new forms and Admin/removal dialogs, rendered solid-text contrast, four widths and 200% CSS zoom; precise audit limits in hardening-verification.md; main 768975d verified |
| Clipping, overlap and overflow | Desktop/tablet/mobile plus minimum width/zoom | Main pass: earlier/new role screens at 320/390/768/1280, bounded 200% CSS zoom dialogs; Requester Create/Staff Action/Admin user captures inspected; main 768975d verified |
