const BASE_URL = 'http://localhost:4000'

export interface Requester {
    id: number
    name: string
    email: string
    isActive: boolean
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
    ticketOwner?: string | null
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

export interface CreateTicketPayload {
    categoryId: number
    relatedSystemId: number
    summary: string
    description: string
    requestedPriority: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface TicketsResponse {
    data: TicketListItem[]
    pagination: {
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

export async function fetchRequesters(): Promise<Requester[]> {
    const res = await fetch(`${BASE_URL}/api/requesters`)
    if (!res.ok) throw new Error('Failed to load requesters')
    return res.json()
}

export async function fetchCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/api/categories`)
    if (!res.ok) throw new Error('Failed to load categories')
    return res.json()
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
    const res = await fetch(`${BASE_URL}/api/related-systems`)
    if (!res.ok) throw new Error('Failed to load related systems')
    return res.json()
}

export async function createTicket(
    requesterId: number,
    payload: CreateTicketPayload
): Promise<Ticket> {
    const res = await fetch(`${BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requester-Id': String(requesterId),
        },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create ticket')
    }
    return res.json()
}

export async function fetchTickets(
    requesterId: number,
    query: TicketQuery = {}
): Promise<TicketsResponse> {
    const params = new URLSearchParams()
    if (query.search) params.set('search', query.search)
    if (query.categoryId) params.set('categoryId', String(query.categoryId))
    if (query.requestedPriority) params.set('requestedPriority', query.requestedPriority)
    if (query.status) params.set('status', query.status)
    if (query.sort) params.set('sort', query.sort)
    if (query.order) params.set('order', query.order)
    if (query.page) params.set('page', String(query.page))
    if (query.pageSize) params.set('pageSize', String(query.pageSize))
    const res = await fetch(`${BASE_URL}/api/tickets?${params.toString()}`, {
        headers: { 'X-Requester-Id': String(requesterId) },
    })
    if (!res.ok) throw new Error('Failed to fetch tickets')
    return res.json()
}

export async function fetchTicketDetail(
    requesterId: number,
    ticketId: number
): Promise<TicketDetail> {
    const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
        headers: { 'X-Requester-Id': String(requesterId) },
    })
    if (!res.ok) throw new Error('Failed to fetch ticket detail')
    return res.json()
}

export async function uploadAttachment(
    requesterId: number,
    ticketId: number,
    file: File
): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers: { 'X-Requester-Id': String(requesterId) },
        body: form,
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to upload attachment')
    }
    return res.json()
}

export async function downloadAttachment(
    requesterId: number,
    attachmentId: number,
    filename: string
): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/attachments/${attachmentId}/download`, {
        headers: { 'X-Requester-Id': String(requesterId) },
    })
    if (!res.ok) throw new Error('Failed to download attachment')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export async function removeAttachment(
    requesterId: number,
    attachmentId: number,
    removalReason: string
): Promise<Attachment> {
    const res = await fetch(`${BASE_URL}/api/attachments/${attachmentId}/remove`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-Requester-Id': String(requesterId),
        },
        body: JSON.stringify({ removalReason }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove attachment')
    }
    return res.json()
}
