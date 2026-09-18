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

 / /    % % %  A d m i n   U s e r   M a n a g e m e n t    % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
 
 e x p o r t   i n t e r f a c e   A d m i n U s e r   { 
         i d :   n u m b e r ; 
         n a m e :   s t r i n g ; 
         e m a i l :   s t r i n g ; 
         r o l e :   s t r i n g ; 
         i s A c t i v e :   b o o l e a n ; 
         m u s t C h a n g e P a s s w o r d :   b o o l e a n ; 
         c r e a t e d A t :   s t r i n g ; 
         u p d a t e d A t :   s t r i n g ; 
 } 
 
 e x p o r t   a s y n c   f u n c t i o n   f e t c h A d m i n U s e r s ( s e a r c h ? :   s t r i n g ,   r o l e ? :   s t r i n g ) :   P r o m i s e < A d m i n U s e r [ ] >   { 
         c o n s t   p a r a m s   =   n e w   U R L S e a r c h P a r a m s ( ) 
         i f   ( s e a r c h )   p a r a m s . s e t ( " s e a r c h " ,   s e a r c h ) 
         i f   ( r o l e )   p a r a m s . s e t ( " r o l e " ,   r o l e ) 
         c o n s t   r e s   =   a w a i t   a p i F e t c h ( ` $ { B A S E _ U R L } / a p i / a d m i n / u s e r s ? $ { p a r a m s . t o S t r i n g ( ) } ` ) 
         i f   ( ! r e s . o k )   t h r o w   n e w   E r r o r ( " F a i l e d   t o   f e t c h   u s e r s " ) 
         r e t u r n   r e s . j s o n ( ) 
 } 
 
 e x p o r t   a s y n c   f u n c t i o n   c r e a t e A d m i n U s e r ( d a t a :   a n y ) :   P r o m i s e < A d m i n U s e r >   { 
         c o n s t   r e s   =   a w a i t   a p i F e t c h ( ` $ { B A S E _ U R L } / a p i / a d m i n / u s e r s ` ,   { 
                 m e t h o d :   " P O S T " , 
                 h e a d e r s :   {   " C o n t e n t - T y p e " :   " a p p l i c a t i o n / j s o n "   } , 
                 b o d y :   J S O N . s t r i n g i f y ( d a t a ) 
         } ) 
         i f   ( ! r e s . o k )   { 
                 c o n s t   e r r   =   a w a i t   r e s . j s o n ( ) 
                 t h r o w   n e w   E r r o r ( e r r . e r r o r   | |   " F a i l e d   t o   c r e a t e   u s e r " ) 
         } 
         r e t u r n   r e s . j s o n ( ) 
 } 
 
 e x p o r t   a s y n c   f u n c t i o n   u p d a t e A d m i n U s e r ( i d :   n u m b e r ,   d a t a :   a n y ) :   P r o m i s e < A d m i n U s e r >   { 
         c o n s t   r e s   =   a w a i t   a p i F e t c h ( ` $ { B A S E _ U R L } / a p i / a d m i n / u s e r s / $ { i d } ` ,   { 
                 m e t h o d :   " P U T " , 
                 h e a d e r s :   {   " C o n t e n t - T y p e " :   " a p p l i c a t i o n / j s o n "   } , 
                 b o d y :   J S O N . s t r i n g i f y ( d a t a ) 
         } ) 
         i f   ( ! r e s . o k )   { 
                 c o n s t   e r r   =   a w a i t   r e s . j s o n ( ) 
                 t h r o w   n e w   E r r o r ( e r r . e r r o r   | |   " F a i l e d   t o   u p d a t e   u s e r " ) 
         } 
         r e t u r n   r e s . j s o n ( ) 
 } 
 
 e x p o r t   a s y n c   f u n c t i o n   r e s e t A d m i n U s e r P a s s w o r d ( i d :   n u m b e r ,   n e w I n i t i a l P a s s w o r d :   s t r i n g ) :   P r o m i s e < a n y >   { 
         c o n s t   r e s   =   a w a i t   a p i F e t c h ( ` $ { B A S E _ U R L } / a p i / a d m i n / u s e r s / $ { i d } / r e s e t - p a s s w o r d ` ,   { 
                 m e t h o d :   " P O S T " , 
                 h e a d e r s :   {   " C o n t e n t - T y p e " :   " a p p l i c a t i o n / j s o n "   } , 
                 b o d y :   J S O N . s t r i n g i f y ( {   n e w I n i t i a l P a s s w o r d   } ) 
         } ) 
         i f   ( ! r e s . o k )   { 
                 c o n s t   e r r   =   a w a i t   r e s . j s o n ( ) 
                 t h r o w   n e w   E r r o r ( e r r . e r r o r   | |   " F a i l e d   t o   r e s e t   p a s s w o r d " ) 
         } 
         r e t u r n   r e s . j s o n ( ) 
 } 
  
 