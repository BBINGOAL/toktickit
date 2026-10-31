import path from 'node:path'
import { test,expect,prisma,signIn } from './fixtures'
import { createTestTicket, removeTestData, TEST_PASSWORD } from '../../server/tests/lab-03/test-helpers'

test('Staff cards match Queue totals and My Actions page two opens an action beyond Ticket list page one',async({page,work})=>{
  const tickets:number[]=[]
  try{
    for(let i=0;i<12;i++){
      const t=await createTestTicket(work.requester.id);tickets.push(t.id)
      await prisma.ticket.update({where:{id:t.id},data:{ownerId:work.staff.id,itPriority:i%2?'HIGH':null}})
    }
    const base=new Date(Date.now()-120000)
    await prisma.ticket.update({where:{id:work.ticket.id},data:{createdAt:base}})
    const actions:number[]=[]
    for(let i=0;i<12;i++){
      const a=await prisma.actionTaken.create({data:{ticketId:work.ticket.id,workCycle:1,actionDateTime:new Date(base.getTime()+i*1000),description:`Dashboard pending action ${i}`,assigneeId:work.staff.id,performedById:work.colleague.id,updatedAt:new Date(base.getTime()+i*1000)}});actions.push(a.id)
    }
    await signIn(page,work.staff);await expect(page).toHaveURL(/\/staff\/dashboard$/)
    await expect(page.getByRole('link',{name:'My Active Tickets: 13',exact:true})).toBeVisible()
    await expect(page.getByRole('link',{name:'My Pending Actions: 12',exact:true})).toBeVisible()
    for(const name of ['My Active Tickets: 13','Unassigned Active:']){
      await page.goto('/staff/dashboard')
      const card=page.getByRole('link',{name:name.endsWith(':')?new RegExp('^Unassigned Active: \\d+$'):name,exact:true})
      const count=Number((await card.innerText()).match(/\d+/)![0]);await card.click()
      await expect(page.getByText(`${count} tickets found`,{exact:true})).toBeVisible()
    }
    await page.goto('/staff/dashboard');await page.getByRole('link',{name:'My Active Tickets: 13',exact:true}).click()
    await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await page.getByLabel('Search',{exact:true}).fill('No matching issue')
    await page.getByRole('button',{name:'Search',exact:true}).click()
    await expect(page.getByText(/No tickets found/)).toBeVisible()
    expect(new URL(page.url()).searchParams.get('owner')).toBe('me')
    expect(new URL(page.url()).searchParams.get('scope')).toBe('active')
    await page.goBack();await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await page.reload();await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await page.goto('/staff/dashboard');await page.getByRole('link',{name:'My Pending Actions: 12',exact:true}).click()
    await expect(page.getByText('12 pending actions · Page 1 of 2')).toBeVisible()
    await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.getByText('12 pending actions · Page 2 of 2')).toBeVisible()
    const url=page.url();await page.reload();await expect(page).toHaveURL(url)
    await expect(page.getByText('12 pending actions · Page 2 of 2')).toBeVisible()
    // This action is on page two of Ticket's work-time ordering, regardless of Dashboard ordering.
    await page.goto(`/tickets/${work.ticket.id}?actionId=${actions[11]}`)
    const dialog=page.getByRole('dialog',{name:`Action #${actions[11]}`,exact:true})
    await expect(dialog).toBeVisible();await expect(dialog).toBeFocused()
    await expect(dialog).toContainText('Dashboard pending action 11')
    await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0)
  }finally{await removeTestData([],tickets)}
})

test('Admin reuses Dashboard with Users navigation and Requesters are denied by route and APIs',async({page,work})=>{
  await signIn(page,work.admin);await expect(page).toHaveURL(/\/staff\/dashboard$/)
  await expect(page.getByRole('link',{name:'My Pending Actions: 0',exact:true})).toBeVisible()
  await expect(page.getByRole('link',{name:'User Management',exact:true})).toBeVisible()
  await page.getByRole('link',{name:'My Pending Actions: 0',exact:true}).click()
  await expect(page.getByText('No pending actions assigned to you on active Tickets.')).toBeVisible()
  await expect(page.getByRole('button',{name:'Next page',exact:true})).toBeDisabled()
  await page.context().clearCookies();await signIn(page,work.requester)
  await page.goto('/staff/dashboard');await expect(page.getByRole('heading',{name:'Access denied',exact:true})).toBeVisible()
  for(const url of ['/api/dashboards/staff','/api/staff/actions'])expect((await page.request.get('http://localhost:4000'+url)).status()).toBe(403)
})

test('Staff Dashboard exposes loading safe retry and expired session without false counts',async({page,work})=>{
  await signIn(page,work.staff);await expect(page.getByRole('heading',{name:'Staff Dashboard',exact:true})).toBeVisible()
  let release!:()=>void;const blocked=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/api/dashboards/staff',async route=>{await blocked;await route.fulfill({status:500,contentType:'application/json',body:'{"error":"SQL PRIVATE"}'})})
  await page.reload();await expect(page.getByRole('status')).toHaveText('Loading dashboard…')
  await expect(page.getByRole('button',{name:'Refresh dashboard',exact:true})).toBeDisabled();release()
  await expect(page.getByRole('button',{name:'Retry dashboard',exact:true})).toBeVisible()
  await expect(page.getByRole('alert')).not.toContainText('PRIVATE')
  await page.unroute('**/api/dashboards/staff');await page.getByRole('button',{name:'Retry dashboard',exact:true}).click()
  await expect(page.getByRole('link',{name:'My Pending Actions: 0',exact:true})).toBeVisible()
  await page.route('**/api/dashboards/staff',route=>route.fulfill({status:401,body:'{}'}))
  await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click()
  await expect(page.getByRole('alert')).toContainText('session has expired')
  await expect(page.getByRole('link',{name:'My Pending Actions: 0',exact:true})).toHaveCount(0)
})

test('Staff first-password change lands on Staff Dashboard',async({page,work})=>{
  await prisma.user.update({where:{id:work.colleague.id},data:{mustChangePassword:true}})
  await page.goto('/');await page.getByLabel('Email Address',{exact:true}).fill(work.colleague.email)
  await page.getByLabel('Password',{exact:true}).fill(TEST_PASSWORD);await page.getByRole('button',{name:'Sign In',exact:true}).click()
  await page.getByLabel('New Password',{exact:true}).fill('newPassword123');await page.getByLabel('Confirm New Password',{exact:true}).fill('newPassword123')
  await page.getByRole('button',{name:'Set Password and Login',exact:true}).click()
  await expect(page).toHaveURL(/\/staff\/dashboard$/);await expect(page.getByRole('heading',{name:'Staff Dashboard',exact:true})).toBeVisible()
})

for(const role of ['staff','admin'] as const)for(const width of [320,390,768,1280]){
  test(`${role} Dashboard and Queue fit ${width}px with keyboard links and internal table scroll`,async({page,work})=>{
    await prisma.user.update({where:{id:work[role].id},data:{name:'VeryLongStaffNameWithoutSpaces'.repeat(5)}})
    await prisma.ticket.update({where:{id:work.ticket.id},data:{ownerId:null,summary:'VeryLongTicketSummaryWithoutSpaces'.repeat(5)}})
    await page.setViewportSize({width,height:900});await signIn(page,work[role])
    const card=page.getByRole('link',{name:new RegExp('^Unassigned Active: \\d+$')})
    await expect(card).toBeVisible()
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    for(let n=0;n<25&&!await card.evaluate(node=>node===document.activeElement);n++)await page.keyboard.press('Tab')
    await expect(card).toBeFocused();expect(await card.evaluate(node=>getComputedStyle(node).outlineStyle)).not.toBe('none')
    await page.screenshot({path:path.resolve(__dirname,`../../artifacts/lab-04/screenshots/staff-dashboard/${role}-${width}.png`),fullPage:true})
    await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'IT Staff Ticket Queue',exact:true})).toBeVisible()
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    const table=page.getByRole('region',{name:'Ticket Queue table',exact:true})
    await expect(table).toBeVisible();await table.focus();await page.keyboard.press('ArrowRight')
    if(await table.evaluate(node=>node.scrollWidth>node.clientWidth)){
      await table.evaluate(node=>{node.scrollLeft=node.scrollWidth});expect(await table.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0)
    }
  })
}
