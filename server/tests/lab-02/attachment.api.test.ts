import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import path from 'path'
import app from '../../src/app'

const VALID_REQUESTER_ID = '1'
let createdTicketId: number

const validTicketBody = {
    categoryId: 1,
    relatedSystemId: 1,
    summary: 'Attachment test ticket here',
    description: 'Testing attachment upload and removal for this ticket.',
    requestedPriority: 'LOW',
}


beforeAll(async () => {
    // Create a ticket to be used by attachment tests
    const res = await request(app)
        .post('/api/tickets')
        .set('X-Requester-Id', VALID_REQUESTER_ID)
        .send(validTicketBody)
    createdTicketId = res.body.id
})

describe('POST /api/tickets/:id/attachments', () => {
    it('should return 400 if no file uploaded', async () => {
        const res = await request(app)
            .post(`/api/tickets/${createdTicketId}/attachments`)
            .set('X-Requester-Id', VALID_REQUESTER_ID)
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('No file was uploaded.')
    })

    it('should return 415 for invalid file type', async () => {
        const res = await request(app)
            .post(`/api/tickets/${createdTicketId}/attachments`)
            .set('X-Requester-Id', VALID_REQUESTER_ID)
            .attach('file', Buffer.from('fake file content'), { filename: 'test.exe', contentType: 'application/octet-stream' })
        expect(res.status).toBe(415)
    })

    it('should upload a valid file and return 201', async () => {
        const res = await request(app)
            .post(`/api/tickets/${createdTicketId}/attachments`)
            .set('X-Requester-Id', VALID_REQUESTER_ID)
            .attach('file', Buffer.from('fake png content'), { filename: 'test.png', contentType: 'image/png' })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('id')
        expect(res.body.originalFilename).toBe('test.png')
        expect(res.body.isRemoved).toBe(false)
    })
})

describe('PATCH /api/attachments/:id/remove', () => {
    let attachmentId: number

    it('should create an attachment to remove', async () => {
        const res = await request(app)
            .post(`/api/tickets/${createdTicketId}/attachments`)
            .set('X-Requester-Id', VALID_REQUESTER_ID)
            .attach('file', Buffer.from('another file'), { filename: 'remove-me.png', contentType: 'image/png' })
        expect(res.status).toBe(201)
        attachmentId = res.body.id
    })

    it('should return 400 if removalReason is missing', async () => {
        const res = await request(app)
            .patch(`/api/attachments/${attachmentId}/remove`)
            .set('X-Requester-Id', VALID_REQUESTER_ID)
            .send({})
        expect(res.status).toBe(400)
    })

    it('should soft-remove attachment successfully', async () => {
        const res = await request(app)
            .patch(`/api/attachments/${attachmentId}/remove`)
            .set('X-Requester-Id', VALID_REQUESTER_ID)
            .send({ removalReason: 'Uploaded wrong file' })
        expect(res.status).toBe(200)
        expect(res.body.isRemoved).toBe(true)
        expect(res.body.removalReason).toBe('Uploaded wrong file')
    })

    it('should return 409 if already removed', async () => {
        const res = await request(app)
            .patch(`/api/attachments/${attachmentId}/remove`)
            .set('X-Requester-Id', VALID_REQUESTER_ID)
            .send({ removalReason: 'Trying again' })
        expect(res.status).toBe(409)
    })
})
