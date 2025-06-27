import {query} from "../index.js";

export const createOneTimeLoginTable = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS OneTimeLogin (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            login_code VARCHAR(50),
            login_token VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CHECK ((login_code IS NOT NULL OR login_token IS NOT NULL) AND
            NOT (login_code IS NOT NULL AND login_token IS NOT NULL)
            )
            );
    `);
};

export const saveLoginCode = async (benutzername, loginCode) => {
    await query(`
        INSERT INTO OneTimeLogin (username, login_code)
        VALUES ($1, $2)
    `, [benutzername, loginCode]);
};

export const saveLoginToken = async (benutzername, token) => {
    await query(`
        INSERT INTO OneTimeLogin (username, login_token)
        VALUES ($1, $2)
    `, [benutzername, token]);
};

export const getLoginToken = async (username, loginLink) => {
    return await query(`
        SELECT login_token FROM OneTimeLogin
        WHERE username = $1 AND login_token = $2
    `, [username, loginLink]);
};

export const getLoginCode = async (username, code) => {
    return await query(`
        SELECT login_code FROM OneTimeLogin
        WHERE username = $1 AND login_code = $2
    `, [username, code]);
};

export const deleteLoginCode = async (userId) => {
    await query(`
        DELETE FROM OneTimeLogin
        WHERE username = $1 AND login_code IS NOT NULL
    `, [userId]);
};

export const deleteLoginToken = async (userId) => {
    await query(`
        DELETE FROM OneTimeLogin
        WHERE username = $1 AND login_token IS NOT NULL
    `, [userId]);
};

export const dropOneTimeLoginTable = async () => {
    await query(`
        DROP TABLE IF EXISTS OneTimeLogin;
    `);
};