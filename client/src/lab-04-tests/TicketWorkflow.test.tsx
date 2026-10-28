import { fireEvent,render,screen,waitFor } from '@testing-library/react'
import { beforeEach,describe,expect,it,vi } from 'vitest'
import TicketWorkflow from '../components/TicketWorkflow'
import * as api from '../api/workflow'
import { fetchTicketDetail } from '../api'
import { useAuth } from '../context/AuthContext'
import type { TicketDetail } from '../api'
vi.mock('../api/workflow',async original=>({...await original<typeof import('../api/workflow')>(),changeWorkflow:vi.fn(),fetchWorkflowHistory:vi.fn()}))
vi.mock('../api',()=>({fetchTicketDetail:vi.fn()}))
vi.mock('../context/AuthContext',()=>({useAuth:vi.fn()}))
const ticket:TicketDetail={id:7,ticketNumber:'WF-7',summary:'VPN error',description:'Connection fails',status:'IN_PROGRESS',version:4,workCycle:1,requestedPriority:'HIGH',itPriority:'MEDIUM',owner:null,category:{id:1,name:'Network'},relatedSystem:{id:1,name:'VPN'},requester:{id:9,name:'Requester'},attachments:[],createdAt:'2026-10-12T03:00:00Z',updatedAt:'2026-10-12T03:00:00Z',allowedNextStatuses:['WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],resolutionGate:{canResolve:false,reasons:['Finish pending work.'],summaryRequired:true,workCycle:1}}
const changed=vi.fn()
const renderWork=(t=ticket)=>render(<TicketWorkflow ticket={t} onChanged={changed}/> )
beforeEach(()=>{
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({user:{id:2,name:'Staff',role:'IT_STAFF'},setUser:vi.fn(),logout:vi.fn(),loading:false})
  vi.mocked(api.fetchWorkflowHistory).mockResolvedValue({data:[],meta:{page:1,pageSize:10,totalItems:0,totalPages:0}})
  vi.mocked(api.changeWorkflow).mockResolvedValue({...ticket,status:'WAITING_FOR_REQUESTER',version:5})
  vi.spyOn(window,'confirm').mockReturnValue(true)
})
describe('Ticket workflow controls',()=>{
  it('offers only server-provided transitions and displays gate reasons',async()=>{
    renderWork();expect(screen.queryByRole('option',{name:'CLOSED'})).not.toBeInTheDocument()
    expect(screen.getByText('Finish pending work.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Update Status'),{target:{value:'WAITING_FOR_REQUESTER'}})
    fireEvent.click(screen.getByRole('button',{name:'Apply status'}))
    await waitFor(()=>expect(api.changeWorkflow).toHaveBeenCalledWith(7,'status',{status:'WAITING_FOR_REQUESTER',expectedVersion:4},expect.any(String)))
    expect(changed).toHaveBeenCalled()
  })
  it('requires a summary and a cancellation reason, never sends unrelated fields',async()=>{
    renderWork();fireEvent.change(screen.getByLabelText('Update Status'),{target:{value:'RESOLVED'}})
    fireEvent.click(screen.getByRole('button',{name:'Apply status'}));expect(await screen.findByRole('alert')).toHaveTextContent('Enter a resolution summary.')
    expect(api.changeWorkflow).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Resolution summary (required)'),{target:{value:'Verified VPN'}})
    fireEvent.click(screen.getByRole('button',{name:'Apply status'}))
    await waitFor(()=>expect(api.changeWorkflow).toHaveBeenCalledWith(7,'status',{status:'RESOLVED',expectedVersion:4,resolutionSummary:'Verified VPN'},expect.any(String)))
  })
  it('confirms cancellation and submits its reason',async()=>{
    renderWork();fireEvent.change(screen.getByLabelText('Update Status'),{target:{value:'CANCELLED'}})
    fireEvent.click(screen.getByRole('button',{name:'Apply status'}));expect(await screen.findByRole('alert')).toHaveTextContent('Enter a cancellation reason.')
    fireEvent.change(screen.getByLabelText('Ticket cancellation reason (required)'),{target:{value:'Duplicate request'}})
    fireEvent.click(screen.getByRole('button',{name:'Apply status'}))
    await waitFor(()=>expect(api.changeWorkflow).toHaveBeenCalledWith(7,'status',{status:'CANCELLED',expectedVersion:4,cancellationReason:'Duplicate request'},expect.any(String)))
  })
  it('Requester sees only advisory control and preserves formal status',async()=>{
    vi.mocked(useAuth).mockReturnValue({user:{id:9,name:'Requester',role:'REQUESTER'},setUser:vi.fn(),logout:vi.fn(),loading:false})
    renderWork({...ticket,allowedNextStatuses:[],canIndicateResolved:true})
    expect(screen.queryByLabelText('Update Status')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Problem appears resolved'}))
    await waitFor(()=>expect(api.changeWorkflow).toHaveBeenCalledWith(7,'requester-resolved',{expectedVersion:4},expect.any(String)))
  })
  it('prevents duplicate requests and retries exact intent after lost response',async()=>{
    vi.mocked(api.changeWorkflow).mockRejectedValueOnce(new TypeError('lost response')).mockResolvedValueOnce({...ticket,version:5})
    renderWork();fireEvent.click(screen.getByRole('button',{name:'Assign to me'}));fireEvent.click(screen.getByRole('button',{name:'Assign to me'}))
    await screen.findByRole('alert');expect(api.changeWorkflow).toHaveBeenCalledOnce()
    expect(screen.getByText(/previous request may already have succeeded/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Retry same workflow submission'}))
    await waitFor(()=>expect(api.changeWorkflow).toHaveBeenCalledTimes(2))
    expect(api.changeWorkflow.mock.calls[0]).toEqual(api.changeWorkflow.mock.calls[1])
  })
  it('retains a resolution draft on stale conflict and reloads explicitly without retry',async()=>{
    vi.mocked(api.changeWorkflow).mockRejectedValue(new api.WorkflowError(409,{currentVersion:8}))
    vi.mocked(fetchTicketDetail).mockResolvedValue({...ticket,version:8})
    renderWork();fireEvent.change(screen.getByLabelText('Update Status'),{target:{value:'RESOLVED'}})
    fireEvent.change(screen.getByLabelText('Resolution summary (required)'),{target:{value:'Keep this resolution draft'}})
    fireEvent.click(screen.getByRole('button',{name:'Apply status'}));await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button',{name:'Reload Ticket (keep drafts)'}))
    await waitFor(()=>expect(changed).toHaveBeenCalledWith(expect.objectContaining({version:8})))
    expect(screen.getByLabelText('Resolution summary (required)')).toHaveValue('Keep this resolution draft')
    expect(api.changeWorkflow).toHaveBeenCalledOnce()
  })
  it('shows a safe retry state for history failure',async()=>{
    vi.mocked(api.fetchWorkflowHistory).mockRejectedValueOnce(Error('database internal error')).mockResolvedValueOnce({data:[],meta:{page:1,pageSize:10,totalItems:0,totalPages:0}})
    renderWork();await screen.findByText('Unable to load workflow history.')
    fireEvent.click(screen.getByRole('button',{name:'Retry Ticket history'}));await screen.findByText('No workflow history yet.')
    expect(screen.queryByText('database internal error')).not.toBeInTheDocument()
  })
})
