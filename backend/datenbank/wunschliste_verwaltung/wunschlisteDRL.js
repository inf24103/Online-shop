import { query } from '../index.js';

/* Wunschliste nach ID abrufen */
export const getWunschlisteById = async (wunschlisteid) => {
    const sql = `
    SELECT * FROM Wunschliste WHERE wunschlisteid = $1;
  `;
    return await query(sql, [wunschlisteid]);
};

/* Alle Wunschlisten eines Benutzers */
export const getEigeneWunschlistenByBenutzerId = async (benutzerid) => {
    const sql = `
        SELECT w.wunschlisteid, w.wunschlistename, w.beschreibung
        FROM Wunschliste w
        JOIN Wunschliste_Berechtigung b ON w.wunschlisteid = b.wunschlisteid
        WHERE b.benutzerid = $1 AND b.berechtigung = 'owner';
    `;
    return await query(sql, [benutzerid]);
};

export const getAlleWunschlistenByBenutzer = async (benutzerid) => {
    const sql = `
        SELECT w.wunschlisteid, w.wunschlistename, w.beschreibung, b.berechtigung
        FROM Wunschliste w
        JOIN Wunschliste_Berechtigung b ON w.wunschlisteid = b.wunschlisteid
        WHERE b.benutzerid = $1;
    `;
    return await query(sql, [benutzerid]);
}

export const getProdukteByWunschliste = async (wunschlisteid) => {
    const sql = `
        SELECT p.produktid, p.produktname, p.beschreibung, p.preis
        FROM Produkt p
        JOIN Wunschliste_Produkt wp ON p.produktid = wp.produktid
        WHERE wp.wunschlisteid = $1;
    `;
    return await query(sql, [wunschlisteid]);
}

/* Alle Berechtigungen einer Wunschliste */
export const getBerechtigungenByWunschlisteId = async (wunschlisteid) => {
    const sql = `
    SELECT * FROM Wunschliste_Berechtigung WHERE wunschlisteid = $1;
  `;
    return await query(sql, [wunschlisteid]);
};
