const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:password@127.0.0.1:5434/localdb' });
pool.query('SELECT count(*) FROM "Ticket"').then(r => {
    console.log(r.rows);
    process.exit(0);
}).catch(console.error);
