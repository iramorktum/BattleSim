const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'gen_user',
    password: 'dabkuowcr3',
    host: '90.156.227.101',
    port: 5432,
    database: 'default_db'
});

module.exports = pool;