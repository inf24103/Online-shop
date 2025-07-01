import { query } from '../index.js';

/* Wunschliste erstellen */
export const createWunschliste = async (beschreibung, wunschlistename) => {
    const sql = `
    INSERT INTO Wunschliste (beschreibung, wunschlistename)
    VALUES ($1, $2)
    RETURNING wunschlisteid;
  `;
    return await query(sql, [beschreibung, wunschlistename]);
};

/* Benutzer berechtigen */
export const addBerechtigung = async (wunschlisteid, benutzerid, berechtigung) => {
    const sql = `
    INSERT INTO Wunschliste_Berechtigung (wunschlisteid, benutzerid, berechtigung)
    VALUES ($1, $2, $3);
  `;
    return await query(sql, [wunschlisteid, benutzerid, berechtigung]);
};

export const updateBerechtigung = async (wunschlisteid, benutzerid, neueBerechtigung) => {
    const sql = `
    UPDATE Wunschliste_Berechtigung
    SET berechtigung = $3
    WHERE wunschlisteid = $1 AND benutzerid = $2;
  `;
    const params = [wunschlisteid, benutzerid, neueBerechtigung];

    return await query(sql, params)
};

export const deleteProduktFromWunschliste = async (wunschlisteid, produktid) => {
    const sql = `
        DELETE
        FROM Wunschliste_Produkt
        WHERE wunschlisteid = $1
        AND produktid = $2;
    `;
    const params = [wunschlisteid, produktid];

    return await query(sql, params)
}

export const addProduktToWunschliste = async (wunschlisteid, produktid) => {
    const sql = `
        INSERT INTO Wunschliste_Produkt (wunschlisteid, produktid)
        VALUES ($1, $2);
    `;
    const params = [wunschlisteid, produktid];

    return await query(sql, params)
}


/* Wunschliste löschen */
export const deleteWunschliste = async (wunschlisteid) => {
    const sql = `
    DELETE FROM Wunschliste WHERE wunschlisteid = $1;
  `;
    return await query(sql, [wunschlisteid]);
};

export const deleteAllProductsFromWunschliste = async (wunschlisteId) => {
    const sqlDeleteProducts = `
    DELETE FROM Wunschliste_Produkt
    WHERE wunschlisteid = $1;
  `;
    await query(sqlDeleteProducts, [wunschlisteId]);
};

export const deleteAllPermissionsFromWunschliste = async (wunschlisteId) => {
    const sqlDeletePermissions = `
    DELETE FROM Wunschliste_Berechtigung
    WHERE wunschlisteid = $1;
  `;
    await query(sqlDeletePermissions, [wunschlisteId]);
};
