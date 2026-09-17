const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf8');

code = code.replace(
  "import authRoutes from './routes/auth.routes'",
  "import authRoutes from './routes/auth.routes'\nimport { requireAuth } from './middleware/auth.middleware'"
);

code = code.replace(
  /\/\/ ─── Helper: Validate Requester ───────────────────────────[\s\S]*?async function validateRequester[\s\S]*?\n}\n/,
  ''
);

code = code.replace(
  /\/\/ ─── Dev Requesters ───────────────────────────────────────[\s\S]*?app\.get\('\/api\/requesters'[\s\S]*?\n}\)\n/,
  ''
);

code = code.replace(
  /app\.post\('\/api\/tickets', async \(req, res\) => \{[\s\S]*?res\.status\(403\)\.json\(\{ error: 'Requester not found or inactive' \}\); return\n    \}/,
  `app.post('/api/tickets', requireAuth, async (req, res) => {
    const requesterId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    if (userRole !== 'REQUESTER') {
        res.status(403).json({ error: 'Only requesters can create tickets' }); return
    }`
);

code = code.replace(
  /app\.get\('\/api\/tickets', async \(req, res\) => \{[\s\S]*?res\.status\(403\)\.json\(\{ error: 'Requester not found or inactive' \}\); return\n    \}/,
  `app.get('/api/tickets', requireAuth, async (req, res) => {
    const requesterId = (req as any).user.userId;`
);

code = code.replace(
  /app\.get\('\/api\/tickets\/:id', async \(req, res\) => \{[\s\S]*?res\.status\(403\)\.json\(\{ error: 'Requester not found or inactive' \}\); return\n    \}/,
  `app.get('/api/tickets/:id', requireAuth, async (req, res) => {
    const requesterId = (req as any).user.userId;
    const userRole = (req as any).user.role;`
);

code = code.replace(
  /if \(ticket\.requesterId !== requesterId\) \{[\s\S]*?res\.status\(403\)\.json\(\{ error: 'Access denied' \}\); return\n        \}/,
  `if (ticket.requesterId !== requesterId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' }); return
        }`
);

code = code.replace(
  /app\.post\('\/api\/tickets\/:id\/attachments', upload\.single\('file'\), async \(req, res\) => \{[\s\S]*?res\.status\(403\)\.json\(\{ error: 'Requester not found or inactive' \}\); return\n    \}/,
  `app.post('/api/tickets/:id/attachments', requireAuth, upload.single('file'), async (req, res) => {
    const requesterId = (req as any).user.userId;
    const userRole = (req as any).user.role;`
);

code = code.replace(
  /if \(ticket\.requesterId !== requesterId\) \{[\s\S]*?res\.status\(403\)\.json\(\{ error: 'Access denied' \}\); return\n        \}/,
  `if (ticket.requesterId !== requesterId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' }); return
        }`
);

code = code.replace(
  /app\.patch\('\/api\/attachments\/:id\/remove', async \(req, res\) => \{[\s\S]*?res\.status\(400\)\.json\(\{ error: 'Requester ID is required' \}\); return\n    \}/,
  `app.patch('/api/attachments/:id/remove', requireAuth, async (req, res) => {
    const requesterId = (req as any).user.userId;
    const userRole = (req as any).user.role;`
);

code = code.replace(
  /if \(attachment\.ticket\.requesterId !== requesterId\) \{[\s\S]*?res\.status\(403\)\.json\(\{ error: 'Access denied\. You do not own this attachment\.' \}\); return\n        \}/,
  `if (attachment.ticket.requesterId !== requesterId && userRole !== 'IT_STAFF' && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied. You do not own this attachment.' }); return
        }`
);

fs.writeFileSync('src/app.ts', code);
console.log('Refactor complete');
