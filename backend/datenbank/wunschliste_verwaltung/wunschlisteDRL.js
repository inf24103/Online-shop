import { query } from '../index.js';

/* Wunschliste nach ID abrufen */
export const getWunschlisteById = async (wunschlisteid) => {
    const sql = `
    SELECT * FROM Wunschliste WHERE wunschlisteid = $1;
  `;
    return await query(sql, [wunschlisteid]);
};

/* Alle Wunschlisten eines Benutzers */
export const getWunschlistenByBenutzerId = async (benutzerid) => {
    const sql = `
    SELECT * FROM Wunschliste WHERE benutzerid = $1;
  `;
    return await query(sql, [benutzerid]);
};

/* Alle Berechtigungen einer Wunschliste */
export const getBerechtigungenByWunschlisteId = async (wunschlisteid) => {
    const sql = `
    SELECT * FROM Wunschliste_Berechtigung WHERE wunschlisteid = $1;
  `;
    return await query(sql, [wunschlisteid]);
};
