/*
Code for accessing the db on an abstract level
*/

import dotenv from 'dotenv';
import {Pool} from 'pg'

dotenv.config()

// setup Pool object for pg with connection details
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
    max: 20,
    idleTimeout: 30000,
    connectionTimeout: 2000,
});

export const query = async (text, params) => {
    console.log('DB: next query', {text, params});
    try {
        const start = Date.now()
        const res = await pool.query(text, params)
        const duration = Date.now() - start
        console.log('DB: executed query', {text, params, duration, rows: res.rowCount})
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

// Listener for idling client errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
})

