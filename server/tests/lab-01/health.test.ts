import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../../src/app'   // import app ไม่ใช่ index

describe('GET /api/health', () => {
    it('returns 200 with correct JSON', async () => {
        const response = await request(app).get('/api/health')

        // ตรวจสอบ status code
        expect(response.status).toBe(200)

        // ตรวจสอบ body
        expect(response.body.status).toBe('ok')
        expect(response.body.service).toBe('TokTickIT API')
    })
})
