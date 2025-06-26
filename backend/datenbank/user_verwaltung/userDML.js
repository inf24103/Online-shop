/* database queries containing:
INSERT, UPDATE, DELETE
aka. manipulating the data
*/


import {query} from '../index.js';

/* Benutzer anlegen */
export const createBenutzer = async (benutzername, nachname, vorname, email, passwordhash, plz, ort, strasse, hausnummer, telefonnr, rolle) => {
    const sql = `
        INSERT INTO Benutzer (benutzername, nachname, vorname, email, passwordhash, plz, ort, strasse, hausnummer,
                              telefonnr, rolle, kontostatus)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'entsperrt');
    `;
    return await query(sql, [benutzername, nachname, vorname, email, passwordhash, plz, ort, strasse, hausnummer, telefonnr, rolle]);
};

/* Benutzer löschen */
export const deleteBenutzer = async (benutzerid) => {
    const sql = `DELETE
                 FROM Benutzer
                 WHERE benutzerid = $1;`;
    return await query(sql, [benutzerid]);
};

/* Benutzer aktualisieren (flexibel) */
export const updateBenutzer = async (
    benutzerid, benutzername, nachname, vorname, email,
    rolle, kontostatus, plz, ort, strasse, hausnummer, telefonnr
) => {
    const sql = `
        UPDATE Benutzer
        SET benutzername = COALESCE($2, benutzername),
            nachname     = COALESCE($3, nachname),
            vorname      = COALESCE($4, vorname),
            email        = COALESCE($5, email),
            rolle        = COALESCE($6, rolle),
            kontostatus  = COALESCE($7, kontostatus),
            plz          = COALESCE($8, plz),
            ort          = COALESCE($9, ort),
            strasse      = COALESCE($10, strasse),
            hausnummer   = COALESCE($11, hausnummer),
            telefonnr    = $12
        WHERE benutzerid = $1;
    `;
    return await query(sql, [
        benutzerid, benutzername, nachname, vorname, email,
        rolle, kontostatus, plz, ort, strasse, hausnummer, telefonnr
    ]);
};

