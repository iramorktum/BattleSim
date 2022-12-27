const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'gen_user',
    password: 'ssfpst1ye6',
    host: '90.156.224.18',
    port: 5432,
    database: 'default_db'
});

module.exports = pool;