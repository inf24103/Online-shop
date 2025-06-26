import { query } from '../index.js';

/* Wunschliste erstellen */
export const createWunschliste = async (benutzerid, beschreibung) => {
    const sql = `
    INSERT INTO Wunschliste (benutzerid, beschreibung)
    VALUES ($1, $2)
    RETURNING wunschlisteid;
  `;
    return await query(sql, [benutzerid, beschreibung]);
};

/* Benutzer berechtigen */
export const addBerechtigung = async (wunschlisteid, benutzerid, berechtigung) => {
    const sql = `
    INSERT INTO Wunschliste_Berechtigung (wunschlisteid, benutzerid, berechtigung)
    VALUES ($1, $2, $3);
  `;
    return await query(sql, [wunschlisteid, benutzerid, berechtigung]);
};

/* Wunschliste löschen */
export const deleteWunschliste = async (wunschlisteid) => {
    const sql = `
    DELETE FROM Wunschliste WHERE wunschlisteid = $1;
  `;
    return await query(sql, [wunschlisteid]);
};
