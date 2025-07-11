/* database queries containing:
SELECT, WHERE, JOIN, GROUP BY, ORDER BY
aka. getting data
*/
import {query} from "../index.js";

export const getAllUsers = async () => {
    return await query('SELECT * FROM benutzer');
};

export const getUserById = async (id) => {
    return await query('SELECT * FROM benutzer WHERE benutzerid = $1', [id]);
};

export const getUserByUsername = async (username) => {
    return await query('SELECT * FROM benutzer WHERE benutzername = $1', [username]);
};

export const getUserByEmail = async (username) => {
    return await query('SELECT * FROM benutzer WHERE email = $1', [username]);
};