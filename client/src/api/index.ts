const BASE_URL = 'http://localhost:4000'

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
    return fetch(input, { ...init, credentials: 'include' })
}

export async function login(payload: any) {
    const res = await apiFetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Login failed')
    }
    return res.json()
}

export async function logout() {
    await apiFetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' })
}

export interface User {
    id: number
    name: string
    email: string
    role: string
}

export interface Category {
    id: number
    name: string
}

export interface RelatedSystem {
    id: number
    name: string
}

export interface TicketListItem {
    id: number
    ticketNumber: string
    summary: string
    category: { id: number; name: string }
    relatedSystem: { id: number; name: string }
    requestedPriority: string
    itPriority?: string | null
    status: string
    owner?: { id: number; name: string } | null
    createdAt: string
    updatedAt: string
}

export interface TicketDetail extends TicketListItem {
    description: string
    requester: { id: number; name: string }
    attachments: Attachment[]
}

export interface Attachment {
    id: number
    originalFilename: string
    mimeType: string
    sizeBytes: number
    isRemoved: boolean
    removedAt?: string | null
    removalReason?: string | null
    createdAt: string
}

export interface Ticket {
    id: number
    ticketNumber: string
    summary: string
    status: string
    requestedPriority: string
    itPriority?: string
    createdAt: string
    updatedAt: string
}

export interface PublicComment {
    id: number
    content: string
    author: { id: number; name: string; role: string }
    createdAt: string
}

export interface InternalNote {
    id: number
    content: string
    author: { id: number; name: string; role: string }
    createdAt: string
}

export interface CreateTicketPayload {
    categoryId: number
    relatedSystemId: number
    summary: string
    description: string
    requestedPriority: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface TicketsResponse {
    data: TicketListItem[]
    meta: {
        page: number
        pageSize: number
        totalItems: number
        totalPages: number
    }
}

export interface TicketQuery {
    search?: string
    categoryId?: number
    requestedPriority?: string
    status?: string
    sort?: string
    order?: string
    page?: number
    pageSize?: number
}

export interface StaffTicketQuery {
    search?: string
    status?: string
    priority?: string
    ownerId?: number
    page?: number
    pageSize?: number
}

export async function fetchCategories(): Promise<Category[]> {
    const res = await apiFetch(`${BASE_URL}/api/categories`)
    if (!res.ok) throw new Error('Failed to load categories')
    return res.json()
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
    const res = await apiFetch(`${BASE_URL}/api/related-systems`)
    if (!res.ok) throw new Error('Failed to load related systems')
    return res.json()
}

// ─── Requesters ───────────────────────────────────────────

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const res = await apiFetch(`${BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create ticket')
    }
    return res.json()
}

export async function fetchTickets(query: TicketQuery = {}): Promise<TicketsResponse> {
    const params = new URLSearchParams()
    if (query.search) params.set('search', query.search)
    if (query.categoryId) params.set('categoryId', String(query.categoryId))
    if (query.requestedPriority) params.set('requestedPriority', query.requestedPriority)
    if (query.status) params.set('status', query.status)
    if (query.sort) params.set('sort', query.sort)
    if (query.order) params.set('order', query.order)
    if (query.page) params.set('page', String(query.page))
    if (query.pageSize) params.set('pageSize', String(query.pageSize))
    const res = await apiFetch(`${BASE_URL}/api/tickets?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch tickets')
    return res.json()
}

export async function fetchTicketDetail(ticketId: number): Promise<TicketDetail> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}`)
    if (!res.ok) throw new Error('Failed to fetch ticket detail')
    return res.json()
}

// ─── IT Staff ─────────────────────────────────────────────

export async function fetchStaffTickets(query: StaffTicketQuery = {}): Promise<TicketsResponse> {
    const params = new URLSearchParams()
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    if (query.priority) params.set('priority', query.priority)
    if (query.ownerId) params.set('ownerId', String(query.ownerId))
    if (query.page) params.set('page', String(query.page))
    if (query.pageSize) params.set('pageSize', String(query.pageSize))
    const res = await apiFetch(`${BASE_URL}/api/staff/tickets?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch staff tickets')
    return res.json()
}

export async function updateTicketStatus(ticketId: number, status: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
}

export async function updateTicketOwner(ticketId: number, ownerId: number | null): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/owner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId })
    });
    if (!res.ok) throw new Error('Failed to update owner');
    return res.json();
}

export async function updateTicketPriority(ticketId: number, itPriority: string): Promise<any> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itPriority })
    });
    if (!res.ok) throw new Error('Failed to update priority');
    return res.json();
}

// ─── Collaboration ────────────────────────────────────────

export async function fetchComments(ticketId: number): Promise<PublicComment[]> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
}

export async function addComment(ticketId: number, content: string): Promise<PublicComment> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
}

export async function fetchNotes(ticketId: number): Promise<InternalNote[]> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/notes`);
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
}

export async function addNote(ticketId: number, content: string): Promise<InternalNote> {
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
}

// ─── Attachments ──────────────────────────────────────────

export async function uploadAttachment(ticketId: number, file: File): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    const res = await apiFetch(`${BASE_URL}/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: form,
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to upload attachment')
    }
    return res.json()
}

export async function downloadAttachment(attachmentId: number, filename: string): Promise<void> {
    const res = await apiFetch(`${BASE_URL}/api/attachments/${attachmentId}/download`)
    if (!res.ok) throw new Error('Failed to download attachment')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export async function removeAttachment(attachmentId: number, removalReason: string): Promise<Attachment> {
    const res = await apiFetch(`${BASE_URL}/api/attachments/${attachmentId}/remove`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removalReason }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove attachment')
    }
    return res.json()
}
