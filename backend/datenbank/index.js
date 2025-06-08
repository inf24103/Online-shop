/*
Code for accessing the db on an abstract level
*/

import { Pool } from 'pg'

// setup Pool object for pg with connection details
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '1234',
    port: 5432,
});

export const query = async (text, params) => {
    await pool.connect();
    try {
        const start = Date.now()
        const res = await pool.query(text, params)
        const duration = Date.now() - start
        console.log('executed query', { text, params, duration, rows: res.rowCount})
        return res.rows;
    } catch (err) {
        console.error('Query error', err);
        throw err;
    }
};

export const endConnection = async () => {
    pool.end;
    console.log('Connection to database closed');
}

function checkForSQLInjection(text, params) {
    return true
}

// Listener for idling client errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
})

