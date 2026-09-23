const fs = require('fs');
let code = fs.readFileSync('src/app.ts', 'utf8');

// Export upload
code = code.replace(/const upload = multer\(\{/g, 'export const upload = multer({');

// Replace tickets endpoints with router
code = code.replace(/\/\/ ─── Helper: Validate Requester ───────────────────────────[\s\S]*?app\.patch\('\/api\/attachments\/:id\/remove', async \(req, res\) => \{[\s\S]*?\}\)\r?\n\r?\n/g, '');

code = code.replace(/\/\/ ─── Dev Requesters ───────────────────────────────────────[\s\S]*?app\.get\('\/api\/requesters', async \(_req, res\) => \{[\s\S]*?\}\)\r?\n/g, '');

code = code.replace(/import authRoutes from '\.\/routes\/auth\.routes'/g, "import authRoutes from './routes/auth.routes'\nimport ticketRoutes from './routes/ticket.routes'");

code = code.replace(/app\.use\('\/api\/auth', authRoutes\)/g, "app.use('/api/auth', authRoutes)\napp.use('/api', ticketRoutes)");

// Remove create ticket
code = code.replace(/\/\/ ─── Ticket Helper ────────────────────────────────────────[\s\S]*?app\.post\('\/api\/tickets', async \(req, res\) => \{[\s\S]*?\}\)\r?\n/g, '');


fs.writeFileSync('src/app.ts', code);
console.log('App.ts cleaned up');
