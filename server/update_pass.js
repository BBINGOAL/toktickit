const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres:password@127.0.0.1:5434/localdb'});

const hash = bcrypt.hashSync('password123', 10);
pool.query('UPDATE "User" SET "passwordHash" = $1', [hash])
  .then(() => {
    console.log('Passwords updated to password123');
    process.exit(0);
  })
  .catch(console.error);
