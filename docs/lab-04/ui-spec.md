# Lab 4 UI Specification

Status: reviewed intended UI contract. Issue #46 Actions Taken is implemented with UI 53/53 and Actions E2E 9/9 passing, including four widths, keyboard and local image inspection. Verification used isolated native PostgreSQL 18.1 because Docker remained stopping; see ui-verification.md. Dashboards, formal Ticket workflow and whole-product visual/contrast/200% zoom checks remain future issues. This is not completed final-main product evidence.

## Application shell and routes

Preserve Zen Green tokens, existing role labels/navigation and active-page indication. After sign-in or required password change, Requester lands on `/dashboard`; Staff/Admin on `/staff/dashboard`. Existing My Tickets, Create Ticket, Ticket Queue, Ticket Detail and Admin Users remain reachable. Signed-out users return to login; direct forbidden routes show a clear forbidden state, not a misleading working dashboard.

Dashboard navigation is a real link with visible active state. Grid: one metric column on narrow mobile, two on tablet, up to four on desktop; labels/counts wrap without clipping. Major verification widths: 390x844, 768x1024, 1280x900, plus 320px minimum-width smoke. Page must not scroll horizontally. Wide tables may scroll inside a labeled container with visible access to hidden actions.

## Requester Dashboard

Cards: Active Tickets, Waiting for You, Recently Updated (7 calendar dates), Recently Resolved (same window). Explain timezone/window using API metadata; show 0 explicitly. Cards are keyboard links to exact filtered My Tickets URLs. Recent Tickets and Needs Your Attention list Ticket number, summary, status and updated time (max 5 each), with detail links and view-all. Quick actions: Create Ticket and My Tickets.

Backend performs calculations; frontend never counts a partially loaded list. Refresh displays last snapshot time. No charts required. Never expose other Requesters' rows or Staff-only notes. All cards/list items have meaningful link text.

## Staff/Admin Dashboard

Cards: Unassigned Active, My Active Tickets, My Pending Actions. Status and active IT-priority groups have text labels/counts and filtered Queue links. Lists: My Actions, Recent Tickets and Urgent Tickets (each max 5). My Actions links focus/scroll to the action on Ticket Detail; view-all uses a paged My Actions mode on Staff Dashboard backed by `/api/staff/actions`. Preserve selected page in URL, use page size 10/25/50 and display matching total. Admin reuses this screen and retains Users navigation.

Use unset-priority label rather than a blank badge. Urgent indicates HIGH IT priority on an active Ticket, not requested priority. Current-user actions are assigned to the signed-in user, not all actions they originally created.

## Actions Taken on Ticket Detail

Add a clearly labeled shared section separate from Public Comments and private Internal Notes. List shows work date/time (actionDateTime), description, result, performer, assignee, status, follow-up flag/note, attachment notes and work cycle. Primary order is actionDateTime ASC,id ASC; createdAt appears separately as Recorded at in details/audit and does not reorder the action list. Paginate, retain selected action across refresh where possible. Show zero state and no Requester mutation controls. Multiple staff and multiple actions can be displayed without implying they replaced Ticket owner.

Staff/Admin can open an accessible create/edit dialog. Fields: action date/time, description, result, active assignee selection, follow-up checkbox, conditional required note, attachment notes, optional predecessor choice for a follow-up. Actor, Ticket and work cycle are read-only server values. Initial state PLANNED; action state controls offer only permitted transitions. Completion requires result. Cancellation requires confirmation plus reason. COMPLETED/CANCELLED records have read-only detail/history; new linked follow-up records resolve earlier follow-up requirements.

Render history chronologically by createdAt ASC,id ASC with actor/time/change descriptions. Start is offered for PLANNED; Complete is offered only for IN_PROGRESS. Starting then completing requires two successful versioned requests, with no direct PLANNED-to-COMPLETED shortcut. History and action fields use plain text, no unsanitized HTML. Attachment Notes identify existing files and do not create a new upload interface. Retain existing Ticket attachments interface.

Create/save/start/complete/cancel disables while pending. A submission intent keeps one idempotency key through retry; create a new key after successful save or deliberately abandoning/restarting the form. On recoverable failure retain all fields. Conflict displays current version, lets user load current values, and preserves draft for comparison; never silently retry an old overwrite. Inactive assignee error stays near selector and refreshes choices.

## Ticket workflow

Show only API allowedNextStatuses for Staff/Admin plus current read-only status. Formal Resolve opens/uses resolution summary input and displays unmet gate reasons. Cancellation collects a reason. Submit current expectedVersion and a workflow idempotency key; on success refresh Ticket/action summaries, new versions and history. On stale state, explain another change occurred and reload before another intentional change.

Requester sees advisory resolution control only in allowed states; label it "Problem appears resolved" with explanation that Staff review is required. Formal Ticket status remains unchanged. Reopened Tickets display new cycle and preserve old history. Stable history ordering applies even for equal timestamps.

Queue and My Tickets consume dashboard URLs and show current filters. Staff sorting controls and pagination expose all matching data; reset page to 1 on filter change and use 10/25/50 sizes. Clear filters returns to normal detailed view.

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

Use existing typography/colors/spacing and semantic headings, buttons, links and table headers. Status/priority include text, never color-only meaning. Focus indicator at least a visible 2px outline; verify every actionable card/form/pagination element by keyboard. Form labels have stable IDs; checkbox state and required notes are announced. Modal has dialog role, accessible name, focus trap, Escape close when safe, initial focus and restoration to trigger. Warn before discarding a dirty draft; do not lose it on API failure.

At desktop/tablet/mobile widths verify cards, action list, create/edit/cancel modes, dashboard preview/view-all and workflow controls. Long names/descriptions/IDs wrap. Modal stays within viewport with internal vertical scrolling. No clipped nav, overlap or whole-page horizontal overflow. Check adequate text contrast (normal text 4.5:1, large text 3:1) and keyboard focus visibility against actual styles. Test zoom 200% and headings/screen-reader names; remove obsolete placeholder controls and console errors.

Screenshots are real runtime captures stored locally under `artifacts/lab-04/screenshots/{staff-dashboard,requester-dashboard,actions-taken}/`. They and report assets remain uncommitted per student instruction. Visual checklist starts pending; mark complete only after inspecting actual rendered states.

| Check | Planned evidence | Status |
|---|---|---|
| Zen Green consistency, statuses and private/shared distinction | Major screens and Ticket Detail | Pending |
| Dashboard cards/counts/drill-down | Both role dashboards, zero and populated | Pending |
| Actions modes, editable/read-only and validation placement | List/create/edit/terminal/follow-up/conflict | Actions branch checks pass; runtime lifecycle/failure E2E pass; images inspected |
| Keyboard, focus, modal, labels and contrast | Keyboard inspection and component/E2E | Actions labels/focus cycle/Escape/restore pass; whole-product contrast/zoom remain #50 |
| Clipping, overlap and overflow | Desktop/tablet/mobile plus minimum width/zoom | Actions page/dialog bounds pass at 320/390/768/1280; checkbox/header corrected after image inspection; dashboards/zoom remain pending |
