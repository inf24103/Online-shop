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

import { query } from '../index.js';

/* Benutzer anlegen */
export const createBenutzer = async (benutzername, email, passwordhash) => {
    const sql = `
    INSERT INTO Benutzer (benutzername, email, passwordhash, rolle, kontostatus)
    VALUES ($1, $2, $3, 'user', 'aktiv');
  `;
    return await query(sql, [benutzername, email, passwordhash]);
};

/* Benutzer löschen */
export const deleteBenutzer = async (benutzerid) => {
    const sql = `DELETE FROM Benutzer WHERE benutzerid = $1;`;
    return await query(sql, [benutzerid]);
};

/* Benutzer aktualisieren (flexibel) */
export const updateBenutzer = async (benutzerid, benutzername, email, rolle, kontostatus) => {
    const sql = `
    UPDATE Benutzer
    SET
      benutzername = COALESCE($2, benutzername),
      email = COALESCE($3, email),
      rolle = COALESCE($4, rolle),
      kontostatus = COALESCE($5, kontostatus)
    WHERE benutzerid = $1;
  `;
    return await query(sql, [benutzerid, benutzername, email, rolle, kontostatus]);
};
