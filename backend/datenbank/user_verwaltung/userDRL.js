/* database queries containing:
SELECT, WHERE, JOIN, GROUP BY, ORDER BY
aka. getting data
*/
import {query} from "../index.js";

export const getAllUsers = async () => {
    return await query('SELECT * FROM kunden');
};

export const getUserById = async (id) => {
    return await query('SELECT * FROM kunden WHERE kunden_id = $1', [id]);
};