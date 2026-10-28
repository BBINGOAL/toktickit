# Lab 4 REST API Contract

Status: reviewed contract; Actions/workflow and Requester Dashboard integrated. Issue #49 implements Staff/Admin Dashboard, paged My Actions and matching Queue filters. Base path `/api`; JSON request/response, cookie authentication. Existing auth, Tickets, attachments, comments, notes, reference and admin APIs remain, subject to explicit workflow changes below.

## Shared rules

- Authorize active users with completed required password change before business data or replay lookup. Requester reads require owned Ticket; Staff/Admin may access all Tickets. No-session 401. Non-owner Requester resource access returns the identical 404 NOT_FOUND response as a nonexistent Ticket/action/history/attachment; do not reveal existence through a different code, message, count or gate summary. Role-level denial (for example Requester action writes or Staff-only notes) returns 403 before any resource lookup, whether the supplied ID exists or not.
- Positive integer IDs/versions; reject unknown payload fields. Dates must have ISO 8601 offset; store/output UTC. Server validates dates against Ticket creation and current time. Trim text; limits and lifecycle are specified in specification.md BR-05 through BR-12.
- Errors preserve legacy `error` string and add a machine code: `{error,code,fieldErrors?}`. Codes include VALIDATION_ERROR, FORBIDDEN, NOT_FOUND, INVALID_TRANSITION, RESOLUTION_GATE, STALE_VERSION, IDEMPOTENCY_CONFLICT. Conflict includes `currentVersion` and allowed next states when relevant. Never expose SQL, stack traces, hashes or internal notes.
- Statuses: 200 read/update/replay, 201 newly created action, 400 malformed/invalid input, 401 no valid session, 403 forbidden, 404 not found, 409 transition/gate/version/key conflict, 500 safe server failure. Migration/database outages have safe failure output and no false success.
- `Idempotency-Key` is required for action creation and formal Ticket status mutations: 16-128 chars, `[A-Za-z0-9_-]+`, generated once per form intent. Scope by authenticated user and exact route. Persist digest/result in the state transaction. Same key+normalized payload replays original status/body, including 201; changed payload conflicts. Failed validation or rolled-back failure does not reserve a key. Retain records for the lab dataset (no expiration job).
- Action/workflow writes acquire parent lock and recheck expected versions/roles/assignee under transaction; state, version and event updates commit together. Action creation increments Ticket version. Audit timestamps originate at server.

## Actions Taken

### GET /tickets/:ticketId/actions

Owned Requester or Staff/Admin. Query `page` default 1; `pageSize` default 10, allowed 10/25/50. Fixed order actionDateTime ASC,id ASC. All actions/states/cycles are readable by authorized users.

```json
{
  "data": [{"id": 12, "ticketId": 7, "workCycle": 1, "actionDateTime": "2026-10-12T03:00:00Z", "description": "Inspect VPN configuration", "result": "", "performedBy": {"id": 3, "name": "IT Staff One"}, "assignee": {"id": 4, "name": "IT Staff Two"}, "followUpRequired": false, "followUpNote": "", "attachmentNotes": "See vpn.png on the Ticket", "followsUpActionId": null, "status": "PLANNED", "cancellationReason": null, "version": 0, "createdAt": "2026-10-12T03:05:00Z", "updatedAt": "2026-10-12T03:05:00Z"}],
  "meta": {"page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1},
  "ticketVersion": 2
}
```

Zero rows return data=[],totalItems=0,totalPages=0. Responses omit emails, password fields, private note data and MutationRequest records.

### POST /tickets/:ticketId/actions

Staff/Admin; Idempotency-Key required. Allowed initial state PLANNED only; performedById/workCycle/createdAt are server-derived.

```json
{"expectedTicketVersion": 2, "actionDateTime": "2026-10-12T03:00:00Z", "description": "Inspect VPN configuration", "result": "", "assigneeId": 4, "followUpRequired": false, "followUpNote": "", "attachmentNotes": "See vpn.png", "followsUpActionId": null}
```

Required: expectedTicketVersion, actionDateTime, description. Defaults: assignee=actor, texts empty, followUpRequired=false, followsUpActionId=null. Follow-up link must reference a COMPLETED follow-up-required action in same Ticket/current cycle; no self/cycle links or cross-ticket links. Return `{data: action, ticketVersion}` with 201. Inactive/non-staff assignee returns 400 field error. Terminal parent/gate mismatch returns 409. Version mismatch returns 409 without action insertion.

### PATCH /tickets/:ticketId/actions/:actionId

Staff/Admin. Body requires `expectedVersion`, `expectedTicketVersion`; editable keys: actionDateTime, description, result, assigneeId, followUpRequired, followUpNote, attachmentNotes, status and cancellationReason. followsUpActionId/actor/Ticket/cycle are immutable after creation. Validate the full merged action, not only changed fields. No-op patch rejected 400. State change follows exactly one BR-08 edge; cancellation reason required, completed result required. An edit may accompany PLANNED -> IN_PROGRESS or IN_PROGRESS -> COMPLETED, but PLANNED -> COMPLETED returns 409 INVALID_TRANSITION even when result is supplied. Start and complete are separate successful requests using refreshed versions; the backend never traverses two states implicitly. Terminal states reject any edits with 409. Returns `{data: action, ticketVersion}` with incremented versions.

No DELETE endpoint; unsupported methods return 405 with Allow header. Idempotency-Key is optional for PATCH: when supplied use the same replay rules; otherwise retrying an already applied expectedVersion returns stale 409, never repeats a mutation.

### GET /tickets/:ticketId/actions/:actionId/history

Same visibility as action. Pagination 10/25/50, fixed createdAt ASC,id ASC. Returns events `{id,kind,actor:{id,name},before,after,createdAt}` and meta. Public fields only. No mutation endpoints for events.

### GET /staff/action-assignees

Staff/Admin only. Search optional trimmed <=100 chars, page/pageSize 10/25/50. Return active IT_STAFF/ADMIN `{id,name,role}` ordered name ASC,id ASC. Selection does not replace write-time validation; stale/inactive choices are rejected.

## Ticket workflow increments

GET `/tickets/:id` adds `version`, `workCycle`, `resolvedAt`, `allowedNextStatuses` (empty for Requester), `canIndicateResolved`, and `resolutionGate: {canResolve,reasons,workCycle,summaryRequired}`. Existing requester/attachments/owner fields remain. Allowed next statuses express the role/state matrix; RESOLVED may be offered while the separately displayed gate is unmet, but the backend rejects that mutation with 409 RESOLUTION_GATE. Missing/non-owned Requester reads share `{error:"Resource not found",code:"NOT_FOUND"}` with 404.

PATCH `/tickets/:id/status`: Staff/Admin, Idempotency-Key required.

```json
{"status": "RESOLVED", "expectedVersion": 5, "resolutionSummary": "VPN configuration repaired and verified"}
```

For CANCELLED require `cancellationReason`; other statuses reject unrelated summary/reason fields. Backend enforces full matrix/gate atomically. Return updated Ticket including version/allowedNextStatuses. Reject missing expectedVersion (400). Simultaneous action insertion, follow-up changes or another Ticket write invalidate stale version.

PATCH `/tickets/:id/owner` adds required expectedVersion; body `{ownerId:null|positiveId,expectedVersion}`. Non-null target must be active Staff/Admin. PATCH `/tickets/:id/priority` adds expectedVersion; body `{itPriority:null|LOW|MEDIUM|HIGH,expectedVersion}`. Both increment Ticket version, record public events and compare parent lock/version. Direct unversioned legacy callers must be updated; no compatibility bypass.

Owner/priority mutations accept an optional Idempotency-Key with the same scoped exact-response replay semantics; the current client supplies it to keep uncertain retries safe. No-op owner/priority patches return 400 without extra events. Successful workflow mutations return the authoritative Ticket detail shape, including gate/allowed-next metadata. Public history kinds are STATUS, OWNER, PRIORITY and REQUESTER_RESOLVED; snapshot fields are public status/ownerId/itPriority/resolution/advisory/cycle/version only, never Internal Notes or credentials. Ticket cancellation also appends CANCELLED_BY_TICKET action events atomically.

PR #55 clarification: owner/priority remain editable by authorized Staff/Admin in CLOSED/CANCELLED, with version increments/events but no status/action changes. Formal Resolve requires an eligible Ticket owner, not that the submitting Staff/Admin equals that owner. Detail includes active and removed attachment metadata (including removedAt/removalReason), preserving Lab 2's visible soft-removal record. Removed-file download is 410 only for an authorized reader; non-owned/missing file reads share 404 NOT_FOUND before disk/removal checks.

POST `/tickets/:id/requester-resolved` remains Requester-only owned-ticket advisory action. Accept `{expectedVersion}`; first change increments parent version and records an advisory event, repeated already-true call returns current flag/time without duplicate event. Allowed statuses follow BR-15. Version check before first mutation; optional Idempotency-Key for replay.

GET `/tickets/:id/workflow-history`: authorized Ticket readers, page/pageSize 10/25/50, order createdAt ASC,id ASC. Events include kind, public before/after status/owner/priority or advisory change, actor name and cycle. Never serialize private notes.

## Dashboard APIs

### GET /dashboards/requester

Requester-only, no caller-supplied requesterId. No filters required. Returns:

```json
{"asOf":"2026-10-12T05:00:00Z","timezone":"Asia/Bangkok","windowStart":"2026-10-05T17:00:00Z","metrics":{"activeTickets":3,"waitingForRequester":1,"recentlyUpdated":4,"recentlyResolved":1},"recentTickets":[],"attentionTickets":[],"drillDown":{"activeTickets":"/tickets?scope=active&page=1","waitingForRequester":"/tickets?status=WAITING_FOR_REQUESTER&page=1","recentlyUpdated":"/tickets?updatedSince=2026-10-05T17%3A00%3A00Z&updatedUntil=2026-10-12T05%3A00%3A00Z&page=1","recentlyResolved":"/tickets?resolvedSince=2026-10-05T17%3A00%3A00Z&resolvedUntil=2026-10-12T05%3A00%3A00Z&page=1"}}
```

Preview arrays may be empty even though the example metrics are illustrative. Ticket preview includes id,ticketNumber,summary,status,itPriority,updatedAt,detailUrl only, max 5 per list; formulas in specification.md are authoritative.

Issue #48 implementation: no dashboard query parameters accepted (400 on supplied parameters), unsupported methods 405 after session authentication. One repeatable-read transaction uses six bounded aggregate/preview queries and one server asOf; no client clock/count calculation. Actual drill-down URLs also include sort=updatedAt&order=desc&page=1. Attention view-all reuses waitingForRequester; Recent Tickets view-all uses the unfiltered updatedAt-desc list. Time-window bounds are inclusive. A later list request may legitimately reflect changes committed after the dashboard snapshot.

### GET /dashboards/staff

Staff/Admin only. Same snapshot/timezone metadata; metrics `{unassignedActive,myActiveTickets,byStatus:{all eight keys},activeByPriority:{LOW,MEDIUM,HIGH,UNSET},myPendingActions}`. Bounded recentTickets/urgentTickets/myActions arrays and drillDown map. My action preview includes action/ticket IDs, Ticket number, description, state, updatedAt and `/tickets/:id?actionId=:actionId`. Optional Admin user-account counts are excluded.

Issue #49: one repeatable-read snapshot, eight aggregate/bounded preview queries (auth/transaction statements excluded from that count). No query parameters allowed. byStatus counts all accessible Tickets; activeByPriority and unassigned/my-active apply ACTIVE. My Actions uses current assignee, not creator/performer, unfinished state and active parent. Every preview is capped at five and ordered updatedAt DESC,id DESC. Groups include explicit zeros and UNSET maps to null IT priority. All metrics are backend-owned. DrillDown includes unassignedActive, myActiveTickets, myPendingActions, byStatus and activeByPriority maps, plus recentTickets/urgentTickets. Queue URLs include matching filters and sort=updatedAt&order=desc&page=1; My Actions links to `/staff/dashboard?view=my-actions&page=1&pageSize=10`. A new list request may reflect changes committed after the card snapshot.

### GET /staff/actions

Staff/Admin, implicit assignee=current user and parent ACTIVE, action PLANNED/IN_PROGRESS. Paginate 10/25/50, updatedAt DESC,id DESC; used by My Actions view-all. Client cannot substitute another userId. Return data/meta and action links.

Only page/pageSize are accepted, with strict positive-decimal/offset bounds as Requester pagination. Other user/assignee/filter inputs are rejected 400; role checks occur before query validation. Item fields: id, ticketId, ticketNumber, description, status, updatedAt, detailUrl. Empty totalPages=0; out-of-range positive pages return empty data with actual totals. Unauthorized role 403, no session/inactive 401, required password change 403, safe query failure 500; unsupported methods on dashboard/My Actions routes return 405 after authentication.

### GET /tickets/:ticketId/actions/:actionId

Added in #49 for a bounded direct action link, independently of the current Ticket action-list page. Authorized Ticket readers, including its Requester, receive `{data: publicAction, ticketVersion}` from one repeatable-read snapshot. Reject malformed IDs or supplied query parameters 400; missing, wrong-Ticket and non-owned resources share 404 NOT_FOUND. No private notes or credentials. This adds read-only GET alongside the existing versioned Staff/Admin PATCH; no new mutation permission. The UI opens the named action details/history dialog with focus, without fetching the whole collection or rewriting list order.

## Drill-down and queue compatibility

Extend Requester GET `/tickets` with status,scope=active,updatedSince/updatedUntil,resolvedSince/resolvedUntil and updatedAt/status sort support while preserving existing category/search/requestedPriority filters. Never accept alternate requester identity.

Requester implementation rejects unknown/repeated/object query values, invalid enums, nondecimal/unsafe pagination, search over 100 characters, invalid calendar dates, missing ISO timezone or reversed bounds. Page and category IDs are positive decimal integers; pageSize 10/25/50; offsets must fit a signed 32-bit integer. Optional itPriority remains LOW/MEDIUM/HIGH. Resolved date filters also require current status RESOLVED/CLOSED; status/scope/date predicates intersect rather than overwrite each other. Count and paginated rows use one repeatable-read snapshot. Default sort createdAt DESC; all sorts append id in the same direction. No matches gives totalPages=0; an out-of-range positive page gives an empty data array with actual totals.

Extend Staff GET `/staff/tickets` with scope=active,owner=me|unassigned,priority=UNSET plus existing enum priorities; preserve explicit ownerId/search/status/categoryId/sort/order. Reject conflicting owner/ownerId inputs. Both lists accept allowed sort/order and page >=1, pageSize 10/25/50; append id in the same direction as sort for stable ties. Empty totalPages=0, UI does not request negative/out-of-range pages. Search <=100 chars and date bounds valid ISO, since <=until; bounds inclusive.

Issue #49 replaces the earlier permissive Queue parser: pageSize=1 is no longer valid (use 10/25/50); nondecimal/unsafe page, ID, unknown/duplicate parameters, invalid enum/sort/date input and owner plus ownerId are 400. owner=me resolves to the session user; ownerId must be a positive signed-32-bit ID, never a requester identity override. Staff Queue keeps public categoryId/ownerId plus names but does not return full Ticket descriptions or private note fields. Count/rows share a repeatable-read snapshot. Existing category/search/status/priority filters remain and intersect scope/date/owner filters.

PR #56 date-encoding clarification: in query strings, a positive ISO timezone offset must encode `+` as `%2B`. For example `updatedSince=2026-10-22T00%3A00%3A00%2B07%3A00`; the same instant is `2026-10-21T17%3A00%3A00Z`. A literal unencoded plus becomes a space and is rejected 400. Use URLSearchParams or an HTTP client's query encoder for updatedSince/Until and resolvedSince/Until. Current Dashboard links use UTC Z and the client transport encodes supplied offsets; an automated transport test covers this.

Dashboard links use existing browser paths, fixed query names and backend ownership. Filtered counts and paginated totalItems must match the card at the same query snapshot; later changes may alter totals and are shown after refresh. No entire Ticket collection is returned by dashboard endpoints.

## Earlier behavior and security

Keep auth/login/logout/first-login/admin account protection and attachment MIME/size/removal/ownership rules. Apply the shared non-enumerating 404 policy to earlier resource-specific reads as well as new action APIs; regression expectations must change where old code returned existence-revealing ownership 403. Role-level write/note denial remains 403 independent of the ID. Comments and notes retain authorization and append-only content rules. Register new endpoints with requireAppAccess and avoid path collisions. Reject session/actor spoofing, private-note leakage and unsafe errors; retain credentialed same-origin/CORS policy. No new public user enumeration endpoint.

Migration/seed and old tests are updated alongside these versioned contracts. Their functionality remains available, but tests asserting unsafe unversioned writes must use fetched versions and idempotency keys. Health remains GET `/health` with existing safe response; no new cloud dependency.
