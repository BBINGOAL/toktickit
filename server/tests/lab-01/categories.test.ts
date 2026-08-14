import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../../src/app'

describe('GET /api/categories', () => {
  it('returns 200 with the four seeded categories', async () => {
    const response = await request(app).get('/api/categories')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body).toHaveLength(4)

    // ตรวจสอบว่ามี category ครบทั้ง 4
    const names = response.body.map((c: { name: string }) => c.name)
    expect(names).toContain('Account and Access')
    expect(names).toContain('Hardware')
    expect(names).toContain('Software')
    expect(names).toContain('Network')
  })
})
