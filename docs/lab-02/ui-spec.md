# Lab 2 UI Specification — TokTickIT Zen Green Theme

**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation  
**Sprint:** Lab 2 | Semester 1/2026  
**Last Updated:** 2026-08-29  
**Status:** Draft — Approved before implementation

---

## 1. Design System — Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#006B3C` | App header background, primary buttons, strong emphasis |
| `--color-primary-hover` | `#005530` | Primary button hover state |
| `--color-secondary` | `#0B7A46` | Active nav tabs, focus ring accents, links, hover states |
| `--color-pale-green` | `#EAF6EF` | Selected rows, success backgrounds, subtle section emphasis |
| `--color-page-bg` | `#F5F7F6` | Page/body background |
| `--color-surface` | `#FFFFFF` | Cards, form surfaces, modals |
| `--color-border` | `#D1D5DB` | Input borders, card borders |
| `--color-border-focus` | `#0B7A46` | Input focus ring |
| `--color-text-primary` | `#1A2E22` | Main body text (dark charcoal-green, not pure black) |
| `--color-text-secondary` | `#4B5563` | Labels, helper text, muted information |
| `--color-text-placeholder` | `#9CA3AF` | Input placeholder text |
| `--color-readonly-bg` | `#F0F4F1` | Read-only field background (soft gray-green) |
| `--color-readonly-text` | `#374151` | Read-only field text |
| `--color-error` | `#991B1B` | Error text and border (dark red) |
| `--color-error-bg` | `#FEF2F2` | Error field background |
| `--color-warning` | `#92400E` | Warning text (amber) |
| `--color-warning-bg` | `#FFFBEB` | Warning callout background |
| `--color-success` | `#065F46` | Success text |
| `--color-success-bg` | `#ECFDF5` | Success state background |
| `--color-disabled-bg` | `#F3F4F6` | Disabled control background |
| `--color-disabled-text` | `#9CA3AF` | Disabled control text |

---

## 2. Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| App name / H1 | Inter, sans-serif | 700 Bold | 1.5rem (24px) |
| Section heading H2 | Inter, sans-serif | 600 SemiBold | 1.25rem (20px) |
| Card heading H3 | Inter, sans-serif | 600 SemiBold | 1rem (16px) |
| Body text | Inter, sans-serif | 400 Regular | 0.875rem (14px) |
| Label text | Inter, sans-serif | 500 Medium | 0.875rem (14px) |
| Helper / caption | Inter, sans-serif | 400 Regular | 0.75rem (12px) |
| Button text | Inter, sans-serif | 500 Medium | 0.875rem (14px) |
| Badge text | Inter, sans-serif | 600 SemiBold | 0.75rem (12px) |

**Google Font import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

---

## 3. Spacing Scale

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Tight gap (icon + label) |
| `--space-2` | 8px | Inner padding small |
| `--space-3` | 12px | Inner padding medium |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Section gap |
| `--space-6` | 24px | Card padding |
| `--space-8` | 32px | Section spacing |
| `--space-12` | 48px | Page section gap |

---

## 4. Component States

### 4.1 Input / Textarea

| State | Background | Border | Text |
|---|---|---|---|
| Default | `#FFFFFF` | `#D1D5DB` 1px | `#1A2E22` |
| Focus | `#FFFFFF` | `#0B7A46` 2px | `#1A2E22` |
| Invalid | `#FEF2F2` | `#991B1B` 2px | `#1A2E22` |
| Disabled | `#F3F4F6` | `#E5E7EB` 1px | `#9CA3AF` |
| Read-only | `#F0F4F1` | `#D1D5DB` 1px dashed | `#374151` |

- All inputs use consistent height: **40px**
- Description textarea: min-height **120px**; resizable vertically only
- Border radius: **6px**

### 4.2 Buttons

| Type | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `#006B3C` | White | None | `#005530` |
| Secondary | `#FFFFFF` | `#006B3C` | `#006B3C` 1px | `#EAF6EF` bg |
| Tertiary / Ghost | Transparent | `#0B7A46` | None | Light green underline |
| Destructive | `#991B1B` | White | None | `#7F1D1D` |
| Disabled | `#F3F4F6` | `#9CA3AF` | `#E5E7EB` | No hover |
| Busy | Primary bg | White | None | Spinner icon; no click |

- Button height: **40px**; border-radius: **6px**
- All buttons must include visible text; icons may support but not replace text
- Every icon-only control requires `aria-label` and `title` tooltip
- Busy state: show spinner + disable pointer-events; Submit button specifically must be disabled during API call

### 4.3 Badge Colors

| Value | Background | Text Color |
|---|---|---|
| Priority: LOW | `#DBEAFE` | `#1E40AF` (blue) |
| Priority: MEDIUM | `#FEF9C3` | `#854D0E` (amber) |
| Priority: HIGH | `#FEE2E2` | `#991B1B` (red) |
| Status: NEW | `#EAF6EF` | `#065F46` (green) |
| Status: IN PROGRESS | `#DBEAFE` | `#1E40AF` (blue) |
| Status: RESOLVED | `#F3F4F6` | `#374151` (gray) |

- Badge padding: `2px 8px`; border-radius: `9999px` (pill shape)
- Badge font: 12px SemiBold
- Badge must use both color AND text (never color alone)

### 4.4 Required Field Marker

- Red asterisk `*` appears after the label text
- Color: `#991B1B`
- The asterisk does NOT replace the validation message

### 4.5 Validation Messages

- Appear **immediately below** the associated field
- Color: `#991B1B`; font size: 12px
- Shown on blur (field loses focus) or on form submit attempt
- Must not appear only as a single error at the top of the form

### 4.6 Focus Indicators

- Focus ring: `2px solid #0B7A46` with `outline-offset: 2px`
- Must remain visible for keyboard users on all interactive elements

---

## 5. Application Shell

### Layout
- Fixed top navigation bar; height: **56px**
- Content area below nav; max-width: **1200px**; centered with `margin: 0 auto`
- Page padding: `0 24px` on desktop; `0 16px` on mobile

### Nav Bar Elements (left to right)
1. **App Logo / Name**: "TokTickIT" — white text, bold, left-aligned
2. **Navigation links**: "My Tickets" | "Create Ticket" — white text; active state uses `#EAF6EF` text or underline
3. **Requester info** (right side): Selected requester name + "Change Requester" action button (ghost style, white text)

### Nav States
- No requester selected: hide My Tickets + Create Ticket links; show only "Select Requester"
- Active link: visually distinct (underline or background accent)

---

## 6. Screen Specifications

### 6.1 Development Requester Selection Screen

**Purpose:** Testing-only mechanism to simulate a logged-in user.

**Layout:**
- Centered card on page background; max-width: **480px**
- Card padding: 32px; border-radius: 8px; white surface with subtle shadow

**Elements:**
1. Screen title: "Development Requester Selection" (H2)
2. Subtitle: "Choose a development requester to simulate the current requester context for Lab 2."
3. Info callout (amber/warning): "This is for testing only and is not a login screen."
4. Label: "Development Requester *" (required)
5. Dropdown select: lists active requesters by name only
6. Helper text below dropdown: "Only active development requesters are shown."
7. Info callout (blue/info): "Authentication coming in Lab 3 — this selection will be replaced with secure authentication."
8. Primary button: "Select Requester" (disabled until a requester is chosen)

**States:**
- Loading: skeleton or spinner while fetching requesters
- Error: "Failed to load requesters. Please try again." + Retry button
- No active requesters: "No active requesters available. Please contact your administrator."

---

### 6.2 Create Ticket Screen

**Purpose:** Capture all required ticket information and submit to the backend.

**Layout (Desktop ≥ 992px):**
```
┌─────────────────────────────────────────────┐
│ [Read-only] Ticket No: —    Ticket Date: —   │
│ [Read-only] Requester: {selected name}       │
├─────────────────────────────────────────────┤
│ Category *  [dropdown]  Related System * [dropdown] │
│ Requested Priority * [dropdown]              │
├─────────────────────────────────────────────┤
│ Summary *                                    │
│ [text input — full width]                    │
│ Description *                                │
│ [textarea — full width, resizable]           │
├─────────────────────────────────────────────┤
│ Attachments (optional)                       │
│ [File picker area]                           │
│ [Attached files list]                        │
├─────────────────────────────────────────────┤
│ [Cancel — secondary]    [Submit — primary]   │
└─────────────────────────────────────────────┘
```

**Field Details:**

| Field | Type | Required | Editable | Notes |
|---|---|---|---|---|
| Ticket Number | Text display | — | No | Shows "—" before creation; populated after success |
| Ticket Date | Text display | — | No | Shows current date/time as read-only |
| Requester | Text display | — | No | Shows selected Dev Requester name |
| Category | Select | Yes | Yes | Options from GET /api/categories |
| Related System | Select | Yes | Yes | Options from GET /api/related-systems |
| Requested Priority | Select | Yes | Yes | LOW / MEDIUM / HIGH |
| Summary | Text input | Yes | Yes | 5–200 chars; shows char count |
| Description | Textarea | Yes | Yes | 10–2000 chars; shows char count |
| Attachments | File picker | No | Yes | JPG, PNG, WEBP, PDF; max 5 MB each |

**Form States:**

| State | Behavior |
|---|---|
| Initial | Empty form; reference data loaded; dropdowns populated |
| Loading reference data | Skeleton or spinner; form disabled until data loads |
| Validation error | Field-level error messages shown below invalid fields; Submit stays enabled |
| Submitting | Submit button shows spinner + "Submitting…" text; button disabled; form inputs disabled |
| Success | Form replaced by success card: "Ticket Created!" + generated Ticket Number (highlighted) + "View My Tickets" button |
| API failure | Form remains visible with all values preserved; top-of-form error banner shown; Submit re-enabled |

**Attachment Sub-section:**
- "Add Attachment" button opens native file picker
- Invalid type: immediate inline error message per file; file rejected
- Oversized file: immediate inline error; file rejected
- Pending upload list: file name + size + remove (×) button
- Maximum 5 attachments; Add button disabled with tooltip when limit reached

---

### 6.3 My Tickets Screen

**Purpose:** Allow the Requester to find and manage their tickets.

**Layout (Desktop ≥ 992px):**
```
┌──────────────────────────────────────────────────────────┐
│ My Tickets                    [+ Create Ticket — primary] │
│ View and track all of your support requests.             │
├──────────────────────────────────────────────────────────┤
│ [🔍 Search...] [Category ▾] [Req.Priority ▾] [IT Pri ▾] [Status ▾] [Clear Filters] │
├──────────────────────────────────────────────────────────┤
│ Ticket No. ↕ | Created Date ↕ | Summary | Category | ... │  ← table header
│ TKT-2026-000001 | ... | ... | ... | ... |               │  ← rows
├──────────────────────────────────────────────────────────┤
│ Showing 1–10 of 42 tickets   [< Prev] [1][2][3] [Next >] │
│                               Page size: [10 ▾]          │
└──────────────────────────────────────────────────────────┘
```

**Table Columns:**

| Column | Sortable | Mobile |
|---|---|---|
| Ticket No. | Yes | Shown |
| Created Date | Yes | Shown |
| Summary | No | Shown (truncated) |
| Category | No | Hidden → filter badge |
| Requested Priority | No | Badge |
| IT Priority | No | Hidden on mobile |
| Current Status | No | Badge |
| Ticket Owner | No | Hidden on mobile |
| Last Updated | Yes | Hidden on mobile |

**Controls:**
- Search: debounced 300ms; searches ticketNumber + summary
- Filters: Category, Requested Priority, IT Priority, Current Status — all as dropdowns with "All X" default
- Clear Filters: resets search + all filters; only visible when any filter is active
- Sort: clicking column header toggles asc/desc; shows ↑↓ indicator
- Pagination: page number buttons + Prev/Next; shows "Showing X–Y of Z tickets"
- Page size selector: 10 / 25 / 50

**Screen States:**

| State | Behavior |
|---|---|
| Loading | Table rows replaced by skeleton shimmer |
| Empty (no tickets) | Illustration + "You have no tickets yet." + "Create your first ticket" button |
| No results (filtered) | "No tickets match your search or filters." + "Clear Filters" link |
| Error | "Failed to load tickets. Please try again." + Retry button |

---

### 6.4 Requester Ticket Detail Screen

**Purpose:** Inspect full ticket information and manage attachments.

**Layout:**
```
┌───────────────────────────────────────────────┐
│ ← Back to My Tickets                          │
├───────────────────────────────────────────────┤
│ My Tickets > Ticket Details                   │
├─────────────────────────┬─────────────────────┤
│ Ticket No. [read-only]  │ Ticket Date [r-o]   │
│ Category [r-o]          │ Related System [r-o] │
│ Requester [r-o]         │ Req. Priority [badge]│
│ IT Priority [badge]     │ Current Status[badge]│
│ Ticket Owner [r-o]      │                     │
├─────────────────────────┴─────────────────────┤
│ Summary [read-only text]                      │
│ Description [read-only text]                  │
│ Resolution Summary [read-only text or —]      │
├───────────────────────────────────────────────┤
│ Attachments                    [+ Add]        │
│ ┌─────────────────────────────────────────┐   │
│ │ 📎 filename.pdf  1.2 MB  [⬇ Download] [🗑 Remove] │
│ │ 📎 photo.jpg     800 KB  [⬇ Download] [🗑 Remove] │
│ │ 🚫 removed-doc.pdf  Removed: "Wrong file" │
│ └─────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

**Attachment Item States:**

| State | Display | Download | Remove |
|---|---|---|---|
| Active | filename + size + type icon | ✅ Shown | ✅ Shown |
| Uploading | progress indicator | — | Cancel |
| Upload failed | error message + retry | — | — |
| Removed | filename (strikethrough or muted) + removal reason | ❌ Hidden | ❌ Hidden |

**Remove Attachment Flow:**
1. Requester clicks "Remove" → Confirmation dialog opens
2. Dialog: "Remove attachment?" + reason text input (required)
3. Confirm button disabled until reason is entered (min 1 char)
4. On confirm → PATCH request → attachment marked removed in UI immediately
5. On cancel → dialog closes; no change

**Add Attachment (to existing ticket):**
- Disabled when ticket already has 5 active attachments; tooltip explains limit
- File validation same as Create Ticket

---

## 7. Responsive Layout Rules

| Viewport | Rules |
|---|---|
| **Desktop ≥ 992px** | Multi-column form layout; full table in My Tickets; max-width 1200px centered |
| **Tablet 768–991px** | Two-column form where practical; table or condensed table; Summary + Description full width |
| **Mobile < 768px** | All fields stack vertically; My Tickets shows card layout (not table); buttons full-width; no horizontal scrolling |
| **All sizes** | No clipped labels; no overlapping messages; no hidden required buttons; all attachment names readable |

### My Tickets — Mobile Card Layout
Each ticket shown as a card:
```
┌─────────────────────────────┐
│ TKT-2026-000001             │
│ May 12, 2026  09:14 AM      │
│ Laptop battery drains quickly│
│ [Hardware] [Medium] [New]   │
│ Owner: Michael Brown        │
└─────────────────────────────┘
```

---

## 8. Accessibility Rules

- All form inputs have a `<label>` with `for` attribute matching the input `id`
- All icon-only buttons have `aria-label` describing the action
- Focus ring visible on all interactive elements (keyboard navigation)
- Error messages associated with inputs via `aria-describedby`
- Required fields marked with `aria-required="true"` in addition to visual asterisk
- Color is never the only indicator — badges include text; errors include icons or messages
- Disabled controls have `disabled` attribute (not just visual styling)

---

## 9. Visual Inspection Checklist

To be completed using Playwright screenshots at each viewport.

| Check | Desktop | Tablet | Mobile |
|---|---|---|---|
| Header background is `#006B3C` | ☐ | ☐ | ☐ |
| Read-only fields have distinct background `#F0F4F1` | ☐ | ☐ | ☐ |
| Editable fields have white background with border | ☐ | ☐ | ☐ |
| Required asterisks `*` present and red | ☐ | ☐ | ☐ |
| Validation messages appear below fields (not only top) | ☐ | ☐ | ☐ |
| Submit button shows busy spinner during submission | ☐ | — | ☐ |
| Success state shows generated Ticket Number | ☐ | — | ☐ |
| Priority badges use correct colors | ☐ | ☐ | ☐ |
| Status badges use correct colors | ☐ | ☐ | ☐ |
| No horizontal page scrolling | ☐ | ☐ | ☐ |
| No clipped labels or text | ☐ | ☐ | ☐ |
| No overlapping elements | ☐ | ☐ | ☐ |
| Pagination controls visible and usable | ☐ | ☐ | ☐ |
| Removed attachment: no download button | ☐ | — | ☐ |
| Empty state shown (not error) when no tickets | ☐ | — | ☐ |
| No-results state distinct from empty state | ☐ | — | ☐ |
| Focus rings visible on keyboard navigation | ☐ | — | ☐ |

---

## 10. Screenshot Paths

| Screen | Path |
|---|---|
| Requester Selector | `artifacts/lab-02/screenshots/requester-selector/` |
| Create Ticket — initial | `artifacts/lab-02/screenshots/create-ticket/initial.png` |
| Create Ticket — validation | `artifacts/lab-02/screenshots/create-ticket/validation.png` |
| Create Ticket — submitting | `artifacts/lab-02/screenshots/create-ticket/submitting.png` |
| Create Ticket — success | `artifacts/lab-02/screenshots/create-ticket/success.png` |
| Create Ticket — failure | `artifacts/lab-02/screenshots/create-ticket/failure.png` |
| My Tickets — list | `artifacts/lab-02/screenshots/my-tickets/list.png` |
| My Tickets — empty | `artifacts/lab-02/screenshots/my-tickets/empty.png` |
| My Tickets — no-results | `artifacts/lab-02/screenshots/my-tickets/no-results.png` |
| My Tickets — mobile | `artifacts/lab-02/screenshots/my-tickets/mobile.png` |
| Ticket Detail | `artifacts/lab-02/screenshots/ticket-detail/detail.png` |
| Ticket Detail — attachment removed | `artifacts/lab-02/screenshots/ticket-detail/removed.png` |
