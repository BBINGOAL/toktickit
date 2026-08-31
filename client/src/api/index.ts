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

export async function uploadAttachment(
    requesterId: number,
    ticketId: number,
    file: File
): Promise<void> {
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
}
