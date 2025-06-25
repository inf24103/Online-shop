/* database queries containing:
INSERT, UPDATE, DELETE
aka. manipulating the data
*/
/* Benutzer anlegen
INSERT INTO Benutzer (benutzername, email, passwordhash, rolle, kontostatus)
VALUES ($1, $2, $3, 'user', 'aktiv');

// Benutzer löschen
DELETE FROM Benutzer WHERE benutzerid = $1;

// Benutzer aktualisieren (flexibel)
UPDATE Benutzer
SET benutzername = COALESCE($2, benutzername),
    email = COALESCE($3, email),
    rolle = COALESCE($4, rolle),
    kontostatus = COALESCE($5, kontostatus)
WHERE benutzerid = $1;


//Warenkorb für Benutzer erstellen
INSERT INTO Warenkorb (benutzerid, erstellt) VALUES ($1, NOW());

//Produkt in Warenkorb hinzufügen
INSERT INTO Produkt_Zu_Warenkorb (warenkorbid, produktid, menge)
VALUES (
    (SELECT warenkorbid FROM Warenkorb WHERE benutzerid = $1),
    $2,
    $3
);*/

import {query} from '../index.js';

/* Benutzer anlegen */
export const createBenutzer = async (benutzername, nachname, vorname, email, passwordhash, plz, ort, strasse, hausnummer, telefonnr) => {
    const sql = `
        INSERT INTO Benutzer (benutzername, nachname, vorname, email, passwordhash, plz, ort, strasse, hausnummer,
                              telefonnr, rolle, kontostatus)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'admin', 'aktiv');
    `;
    return await query(sql, [benutzername, nachname, vorname, email, passwordhash, plz, ort, strasse, hausnummer, telefonnr]);
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

