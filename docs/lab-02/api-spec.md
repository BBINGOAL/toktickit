# Lab 2 API Specification

**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation  
**Sprint:** Lab 2 | Semester 1/2026  
**Last Updated:** 2026-08-29  
**Base URL:** `http://localhost:3000`  
**Content-Type:** `application/json` (unless noted for file upload)

---

## 1. Global Conventions

### Request Headers
```
Content-Type: application/json
X-Requester-Id: {requesterId}   ← Required on all ticket/attachment endpoints (simulates auth)
```

> `X-Requester-Id` replaces real authentication in Lab 2. It carries the selected Development Requester's ID. All ticket and attachment endpoints must validate this header.

### Consistent Error Shape
All error responses return:
```json
{
  "error": "Human-readable error message"
}
```
Server errors must **never** leak stack traces or internal details.

### HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | Successful retrieval or update |
| 201 | Resource created successfully |
| 400 | Invalid input / validation failure |
| 403 | Ownership failure — requester does not own the resource |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate) |
| 410 | Gone — resource has been soft-removed |
| 413 | Payload Too Large — file exceeds 5 MB |
| 415 | Unsupported Media Type — file type not allowed |
| 422 | Unprocessable — business rule violation (e.g., attachment limit) |
| 500 | Unexpected server error |

---

## 2. Reference Data Endpoints

### 2.1 GET /api/health

**Purpose:** Verify the API server is running.

**Response 200:**
```json
{
  "status": "ok",
  "service": "TokTickIT API"
}
```

---

### 2.2 GET /api/categories

**Purpose:** Retrieve all active ticket categories for dropdown population.

**Response 200:**
```json
[
  { "id": 1, "name": "Account and Access" },
  { "id": 2, "name": "Hardware" },
  { "id": 3, "name": "Software" },
  { "id": 4, "name": "Network" }
]
```

**Error 500:**
```json
{ "error": "Failed to fetch categories" }
```

---

### 2.3 GET /api/related-systems

**Purpose:** Retrieve all active related systems for dropdown population.

**Response 200:**
```json
[
  { "id": 1, "name": "Email" },
  { "id": 2, "name": "Campus Wi-Fi" },
  { "id": 3, "name": "VPN" },
  { "id": 4, "name": "LEB2 App" },
  { "id": 5, "name": "Grade Submission App" },
  { "id": 6, "name": "Printer" }
]
```

**Error 500:**
```json
{ "error": "Failed to fetch related systems" }
```

---

### 2.4 GET /api/requesters

**Purpose:** Retrieve all active Development Requesters for the selector screen.

**Response 200:**
```json
[
  { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.anderson@example.com" },
  { "id": 2, "name": "Michael Brown",     "email": "michael.brown@example.com" },
  { "id": 3, "name": "Sarah Johnson",     "email": "sarah.johnson@example.com" },
  { "id": 4, "name": "David Lee",         "email": "david.lee@example.com" }
]
```

> Inactive requesters (isActive = false) are **never** included.

**Error 500:**
```json
{ "error": "Failed to fetch requesters" }
```

---

## 3. Ticket Endpoints

### 3.1 POST /api/tickets

**Purpose:** Create a new ticket for the selected Development Requester.

**Headers required:** `X-Requester-Id: {requesterId}`

**Request Body:**
```json
{
  "categoryId": 2,
  "relatedSystemId": 6,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery drains much faster than usual even when the system is idle. This started after last week's Windows update.",
  "requestedPriority": "MEDIUM"
}
```

**Field Validation:**

| Field | Required | Rule |
|---|---|---|
| categoryId | Yes | Must be an integer referencing an active Category |
| relatedSystemId | Yes | Must be an integer referencing an active RelatedSystem |
| summary | Yes | String; 5–200 characters after trimming |
| description | Yes | String; 10–2000 characters after trimming |
| requestedPriority | Yes | Must be one of: `LOW`, `MEDIUM`, `HIGH` |

**Response 201:**
```json
{
  "id": 1,
  "ticketNumber": "TKT-2026-000001",
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 6,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery drains much faster than usual...",
  "requestedPriority": "MEDIUM",
  "itPriority": null,
  "status": "NEW",
  "ticketOwner": null,
  "resolutionSummary": null,
  "createdAt": "2026-05-12T09:14:00.000Z",
  "updatedAt": "2026-05-12T09:14:00.000Z"
}
```

**Error Responses:**

| Scenario | Status | Body |
|---|---|---|
| Missing or invalid X-Requester-Id | 400 | `{ "error": "Requester ID is required" }` |
| Requester not found / inactive | 403 | `{ "error": "Requester not found or inactive" }` |
| Validation failure | 400 | `{ "error": "Validation failed", "details": { "summary": "Summary must be between 5 and 200 characters" } }` |
| Invalid categoryId | 400 | `{ "error": "Category not found or inactive" }` |
| Invalid relatedSystemId | 400 | `{ "error": "Related system not found or inactive" }` |
| Server error | 500 | `{ "error": "Failed to create ticket" }` |

---

### 3.2 GET /api/tickets

**Purpose:** Retrieve a paginated list of tickets belonging to the selected Requester, with optional search, filter, and sort.

**Headers required:** `X-Requester-Id: {requesterId}`

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Case-insensitive partial match on `ticketNumber` and `summary` |
| `categoryId` | integer | — | Filter by category ID |
| `requestedPriority` | `LOW\|MEDIUM\|HIGH` | — | Filter by requested priority |
| `itPriority` | `LOW\|MEDIUM\|HIGH` | — | Filter by IT priority |
| `status` | `NEW` | — | Filter by current status |
| `sort` | `ticketNumber\|createdAt\|updatedAt` | `createdAt` | Sort field |
| `order` | `asc\|desc` | `desc` | Sort direction |
| `page` | integer ≥ 1 | `1` | Page number |
| `pageSize` | `10\|25\|50` | `10` | Results per page |

**Example Request:**
```
GET /api/tickets?search=laptop&categoryId=2&sort=createdAt&order=desc&page=1&pageSize=10
X-Requester-Id: 1
```

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "ticketNumber": "TKT-2026-000001",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 6, "name": "Corporate Laptop" },
      "requestedPriority": "MEDIUM",
      "itPriority": null,
      "status": "NEW",
      "ticketOwner": null,
      "createdAt": "2026-05-12T09:14:00.000Z",
      "updatedAt": "2026-05-12T09:14:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Error Responses:**

| Scenario | Status | Body |
|---|---|---|
| Missing X-Requester-Id | 400 | `{ "error": "Requester ID is required" }` |
| Invalid pageSize value | 400 | `{ "error": "pageSize must be 10, 25, or 50" }` |
| Invalid page value | 400 | `{ "error": "page must be a positive integer" }` |
| Invalid sort field | 400 | `{ "error": "sort must be one of: ticketNumber, createdAt, updatedAt" }` |
| Server error | 500 | `{ "error": "Failed to fetch tickets" }` |

> Only tickets where `requesterId` matches the header are returned. No cross-requester leakage.

---

### 3.3 GET /api/tickets/:id

**Purpose:** Retrieve full details of one ticket owned by the selected Requester.

**Headers required:** `X-Requester-Id: {requesterId}`

**Response 200:**
```json
{
  "id": 1,
  "ticketNumber": "TKT-2026-000001",
  "requester": { "id": 1, "name": "Jennifer Anderson" },
  "category": { "id": 2, "name": "Hardware" },
  "relatedSystem": { "id": 6, "name": "Corporate Laptop" },
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery drains much faster than usual...",
  "requestedPriority": "MEDIUM",
  "itPriority": null,
  "status": "NEW",
  "ticketOwner": null,
  "resolutionSummary": null,
  "createdAt": "2026-05-12T09:14:00.000Z",
  "updatedAt": "2026-05-12T09:14:00.000Z",
  "attachments": [
    {
      "id": 1,
      "originalFilename": "battery-screenshot.png",
      "mimeType": "image/png",
      "sizeBytes": 204800,
      "isRemoved": false,
      "removedAt": null,
      "removalReason": null,
      "createdAt": "2026-05-12T09:20:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Scenario | Status | Body |
|---|---|---|
| Missing X-Requester-Id | 400 | `{ "error": "Requester ID is required" }` |
| Ticket not found | 404 | `{ "error": "Ticket not found" }` |
| Ticket belongs to another requester | 403 | `{ "error": "Access denied. You do not own this ticket." }` |
| Server error | 500 | `{ "error": "Failed to fetch ticket" }` |

---

## 4. Attachment Endpoints

### 4.1 POST /api/tickets/:id/attachments

**Purpose:** Upload a file attachment to an existing ticket.

**Headers required:** `X-Requester-Id: {requesterId}`  
**Content-Type:** `multipart/form-data`

**Form Fields:**
```
file: <binary file data>
```

**Validation Rules:**

| Rule | Behavior |
|---|---|
| Allowed types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| Max size | 5 MB (5,242,880 bytes) |
| Max active attachments | 5 per ticket (isRemoved = false) |
| Ownership | requesterId must match ticket.requesterId |

**Response 201:**
```json
{
  "id": 2,
  "ticketId": 1,
  "originalFilename": "error-log.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 512000,
  "isRemoved": false,
  "createdAt": "2026-05-12T10:00:00.000Z"
}
```

**Error Responses:**

| Scenario | Status | Body |
|---|---|---|
| Ticket not found | 404 | `{ "error": "Ticket not found" }` |
| Ownership failure | 403 | `{ "error": "Access denied. You do not own this ticket." }` |
| File type not allowed | 415 | `{ "error": "File type not allowed. Allowed types: JPG, PNG, WEBP, PDF." }` |
| File exceeds 5 MB | 413 | `{ "error": "File size exceeds the 5 MB limit." }` |
| Attachment limit reached | 422 | `{ "error": "Ticket already has 5 active attachments. Remove one before adding another." }` |
| No file provided | 400 | `{ "error": "No file was uploaded." }` |
| Server error | 500 | `{ "error": "Failed to upload attachment" }` |

---

### 4.2 GET /api/attachments/:id

**Purpose:** Retrieve metadata for a single attachment.

**Headers required:** `X-Requester-Id: {requesterId}`

**Response 200:**
```json
{
  "id": 1,
  "ticketId": 1,
  "originalFilename": "battery-screenshot.png",
  "mimeType": "image/png",
  "sizeBytes": 204800,
  "isRemoved": false,
  "removedAt": null,
  "removalReason": null,
  "createdAt": "2026-05-12T09:20:00.000Z"
}
```

**Error Responses:**

| Scenario | Status | Body |
|---|---|---|
| Attachment not found | 404 | `{ "error": "Attachment not found" }` |
| Requester does not own ticket | 403 | `{ "error": "Access denied." }` |
| Server error | 500 | `{ "error": "Failed to fetch attachment" }` |

---

### 4.3 GET /api/attachments/:id/download

**Purpose:** Download the binary file of an active attachment.

**Headers required:** `X-Requester-Id: {requesterId}`

**Response 200:**
- Content-Type: the file's MIME type (e.g., `image/png`)
- Content-Disposition: `attachment; filename="{originalFilename}"`
- Body: binary file stream

**Error Responses:**

| Scenario | Status | Body |
|---|---|---|
| Attachment not found | 404 | `{ "error": "Attachment not found" }` |
| Attachment has been soft-removed | 410 | `{ "error": "This attachment has been removed and is no longer available." }` |
| Requester does not own ticket | 403 | `{ "error": "Access denied." }` |
| File missing from disk | 500 | `{ "error": "File could not be retrieved." }` |

---

### 4.4 PATCH /api/attachments/:id/remove

**Purpose:** Soft-remove an attachment. The file record is retained; `isRemoved` is set to true.

**Headers required:** `X-Requester-Id: {requesterId}`

**Request Body:**
```json
{
  "removalReason": "Uploaded wrong file"
}
```

**Validation:**
- `removalReason`: required; minimum 1 character after trimming

**Response 200:**
```json
{
  "id": 1,
  "ticketId": 1,
  "originalFilename": "battery-screenshot.png",
  "isRemoved": true,
  "removedAt": "2026-05-13T08:00:00.000Z",
  "removalReason": "Uploaded wrong file"
}
```

**Error Responses:**

| Scenario | Status | Body |
|---|---|---|
| Attachment not found | 404 | `{ "error": "Attachment not found" }` |
| Already removed | 409 | `{ "error": "Attachment has already been removed." }` |
| Requester does not own ticket | 403 | `{ "error": "Access denied. You do not own this attachment." }` |
| Missing removalReason | 400 | `{ "error": "A removal reason is required." }` |
| Server error | 500 | `{ "error": "Failed to remove attachment" }` |

---

## 5. Ownership Enforcement Summary

Every ticket and attachment endpoint performs these checks in order:

1. **Validate `X-Requester-Id` header** — must be present and a valid integer → `400` if missing
2. **Verify requester exists and is active** → `403` if not found or inactive
3. **Find the resource** (ticket or attachment) → `404` if not found
4. **Check ownership** — `ticket.requesterId === X-Requester-Id` → `403` if mismatch
5. **Apply business rules** (e.g., attachment limits, soft-remove checks)
6. **Execute operation**

---

## 6. Ticket Number Generation

The backend generates the Ticket Number on `POST /api/tickets`:

- **Format:** `TKT-{YYYY}-{NNNNNN}` where YYYY = current year, NNNNNN = zero-padded 6-digit sequential number
- **Example:** `TKT-2026-000001`, `TKT-2026-000042`
- Sequence is global (not per-year reset in Lab 2)
- Generated inside a database transaction to prevent duplicates under concurrent requests
- Stored in `Ticket.ticketNumber` as a unique string

---

## 7. Pagination Response Metadata

All list endpoints return pagination metadata:

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 42,
    "totalPages": 5
  }
}
```

- `totalItems`: total matching records (after search/filter)
- `totalPages`: `Math.ceil(totalItems / pageSize)`
- If `page` exceeds `totalPages`, return an empty `data` array (not an error)
