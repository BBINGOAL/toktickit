# Lab 4 REST API Contract

Status: proposed contract for peer review. Base path `/api`; JSON request/response, cookie authentication. Existing auth, Tickets, attachments, comments, notes, reference and admin APIs remain, subject to explicit workflow changes below.

## Shared rules

- Authorize active users with completed required password change before business data or replay lookup. Requester reads require owned Ticket; Staff/Admin may access all Tickets. No-session 401, wrong role/ownership 403, absent accessible record 404.
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

Staff/Admin. Body requires `expectedVersion`, `expectedTicketVersion`; editable keys: actionDateTime, description, result, assigneeId, followUpRequired, followUpNote, attachmentNotes, status and cancellationReason. followsUpActionId/actor/Ticket/cycle are immutable after creation. Validate the full merged action, not only changed fields. No-op patch rejected 400. State change follows BR-08; cancellation reason required, completed result required. A nonterminal action may be edited and started/completed in one patch if all resulting fields are valid. Terminal states reject any edits with 409. Returns `{data: action, ticketVersion}` with incremented versions.

No DELETE endpoint; unsupported methods return 405 with Allow header. Idempotency-Key is optional for PATCH: when supplied use the same replay rules; otherwise retrying an already applied expectedVersion returns stale 409, never repeats a mutation.

### GET /tickets/:ticketId/actions/:actionId/history

Same visibility as action. Pagination 10/25/50, fixed createdAt ASC,id ASC. Returns events `{id,kind,actor:{id,name},before,after,createdAt}` and meta. Public fields only. No mutation endpoints for events.

### GET /staff/action-assignees

Staff/Admin only. Search optional trimmed <=100 chars, page/pageSize 10/25/50. Return active IT_STAFF/ADMIN `{id,name,role}` ordered name ASC,id ASC. Selection does not replace write-time validation; stale/inactive choices are rejected.

## Ticket workflow increments

GET `/tickets/:id` adds `version`, `workCycle`, `resolvedAt`, `allowedNextStatuses` (empty for Requester), and a concise public resolution-gate summary. Existing requester/attachments/owner fields remain.

PATCH `/tickets/:id/status`: Staff/Admin, Idempotency-Key required.

```json
{"status": "RESOLVED", "expectedVersion": 5, "resolutionSummary": "VPN configuration repaired and verified"}
```

For CANCELLED require `cancellationReason`; other statuses reject unrelated summary/reason fields. Backend enforces full matrix/gate atomically. Return updated Ticket including version/allowedNextStatuses. Reject missing expectedVersion (400). Simultaneous action insertion, follow-up changes or another Ticket write invalidate stale version.

PATCH `/tickets/:id/owner` adds required expectedVersion; body `{ownerId:null|positiveId,expectedVersion}`. Non-null target must be active Staff/Admin. PATCH `/tickets/:id/priority` adds expectedVersion; body `{itPriority:null|LOW|MEDIUM|HIGH,expectedVersion}`. Both increment Ticket version, record public events and compare parent lock/version. Direct unversioned legacy callers must be updated; no compatibility bypass.

POST `/tickets/:id/requester-resolved` remains Requester-only owned-ticket advisory action. Accept `{expectedVersion}`; first change increments parent version and records an advisory event, repeated already-true call returns current flag/time without duplicate event. Allowed statuses follow BR-15. Version check before first mutation; optional Idempotency-Key for replay.

GET `/tickets/:id/workflow-history`: authorized Ticket readers, page/pageSize 10/25/50, order createdAt ASC,id ASC. Events include kind, public before/after status/owner/priority or advisory change, actor name and cycle. Never serialize private notes.

## Dashboard APIs

### GET /dashboards/requester

Requester-only, no caller-supplied requesterId. No filters required. Returns:

```json
{"asOf":"2026-10-12T05:00:00Z","timezone":"Asia/Bangkok","windowStart":"2026-10-05T17:00:00Z","metrics":{"activeTickets":3,"waitingForRequester":1,"recentlyUpdated":4,"recentlyResolved":1},"recentTickets":[],"attentionTickets":[],"drillDown":{"activeTickets":"/tickets?scope=active&page=1","waitingForRequester":"/tickets?status=WAITING_FOR_REQUESTER&page=1","recentlyUpdated":"/tickets?updatedSince=2026-10-05T17%3A00%3A00Z&updatedUntil=2026-10-12T05%3A00%3A00Z&page=1","recentlyResolved":"/tickets?resolvedSince=2026-10-05T17%3A00%3A00Z&resolvedUntil=2026-10-12T05%3A00%3A00Z&page=1"}}
```

Preview arrays may be empty even though the example metrics are illustrative. Ticket preview includes id,ticketNumber,summary,status,itPriority,updatedAt,detailUrl only, max 5 per list; formulas in specification.md are authoritative.

### GET /dashboards/staff

Staff/Admin only. Same snapshot/timezone metadata; metrics `{unassignedActive,myActiveTickets,byStatus:{all eight keys},activeByPriority:{LOW,MEDIUM,HIGH,UNSET},myPendingActions}`. Bounded recentTickets/urgentTickets/myActions arrays and drillDown map. My action preview includes action/ticket IDs, Ticket number, description, state, updatedAt and `/tickets/:id?actionId=:actionId`. Optional Admin user-account counts are excluded.

### GET /staff/actions

Staff/Admin, implicit assignee=current user and parent ACTIVE, action PLANNED/IN_PROGRESS. Paginate 10/25/50, updatedAt DESC,id DESC; used by My Actions view-all. Client cannot substitute another userId. Return data/meta and action links.

## Drill-down and queue compatibility

Extend Requester GET `/tickets` with status,scope=active,updatedSince/updatedUntil,resolvedSince/resolvedUntil and updatedAt/status sort support while preserving existing category/search/requestedPriority filters. Never accept alternate requester identity.

Extend Staff GET `/staff/tickets` with scope=active,owner=me|unassigned,priority=UNSET plus existing enum priorities; preserve explicit ownerId/search/status/categoryId/sort/order. Reject conflicting owner/ownerId inputs. Both lists accept allowed sort/order and page >=1, pageSize 10/25/50; append id in the same direction as sort for stable ties. Empty totalPages=0, UI does not request negative/out-of-range pages. Search <=100 chars and date bounds valid ISO, since <=until; bounds inclusive.

Dashboard links use existing browser paths, fixed query names and backend ownership. Filtered counts and paginated totalItems must match the card at the same query snapshot; later changes may alter totals and are shown after refresh. No entire Ticket collection is returned by dashboard endpoints.

## Earlier behavior and security

Keep auth/login/logout/first-login/admin account protection and attachment MIME/size/removal/ownership rules. Comments and notes retain authorization and append-only content rules. Register new endpoints with requireAppAccess and avoid path collisions. Reject session/actor spoofing, private-note leakage and unsafe errors; retain credentialed same-origin/CORS policy. No new public user enumeration endpoint.

Migration/seed and old tests are updated alongside these versioned contracts. Their functionality remains available, but tests asserting unsafe unversioned writes must use fetched versions and idempotency keys. Health remains GET `/health` with existing safe response; no new cloud dependency.
