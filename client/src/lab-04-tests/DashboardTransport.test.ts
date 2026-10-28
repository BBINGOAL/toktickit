import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadAttachment, fetchStaffTickets, fetchTickets } from '../api'
import { fetchStaffDashboard } from '../api/dashboards'
afterEach(()=>vi.restoreAllMocks())
describe('dashboard transport and PR #56 compatibility',()=>{
  it('encodes a positive timezone offset instead of sending a literal plus',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('{"data":[],"meta":{}}'))
    await fetchTickets({updatedSince:'2026-10-28T00:00:00+07:00'})
    expect(String(fetch.mock.calls[0][0])).toContain('%2B07%3A00')
    expect(new URL(String(fetch.mock.calls[0][0])).searchParams.get('updatedSince')).toBe('2026-10-28T00:00:00+07:00')
    expect(fetch.mock.calls[0][1]?.credentials).toBe('include')
  })
  it('retains staff Queue drill-down, sorting and page parameters with cookies',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('{"data":[],"meta":{}}'))
    await fetchStaffTickets({scope:'active',owner:'me',priority:'UNSET',sort:'updatedAt',order:'desc',page:2,pageSize:10})
    const q=new URL(String(fetch.mock.calls[0][0])).searchParams
    expect(Object.fromEntries(q)).toMatchObject({scope:'active',owner:'me',priority:'UNSET',sort:'updatedAt',order:'desc',page:'2'})
    expect(fetch.mock.calls[0][1]?.credentials).toBe('include')
  })
  it('treats removed-download 410 as an error before reading a blob',async()=>{
    const blob=vi.fn()
    vi.spyOn(globalThis,'fetch').mockResolvedValue({ok:false,status:410,blob} as unknown as Response)
    await expect(downloadAttachment(1,'removed.png')).rejects.toThrow('Failed to download attachment')
    expect(blob).not.toHaveBeenCalled()
  })
  it('uses safe messages for dashboard authorization failures',async()=>{
    vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('{"error":"SQL SECRET"}',{status:403}))
    await expect(fetchStaffDashboard()).rejects.toMatchObject({status:403,message:'You do not have access to this dashboard.'})
  })
})
