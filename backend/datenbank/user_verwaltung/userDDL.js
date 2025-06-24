/* database queries containing:
CREATE, ALTER, DROP, TRUNCATE
aka. manipulating whole tables
*/
/*CREATE TABLE Benutzer (
    benutzerid SERIAL PRIMARY KEY,
    benutzername VARCHAR(25) NOT NULL,
    nachname VARCHAR(30) NOT NULL,
    vorname VARCHAR(30) NOT NULL,
    geburtsdatum DATE NOT NULL,
    email VARCHAR(100),
    passwordhash VARCHAR(25) NOT NULL,
    adresse VARCHAR(100),
    erstelldatum TIMESTAMP,
    rolle VARCHAR,
    kontostatus VARCHAR(20),
    authentifizierung BOOLEAN DEFAULT FALSE,
);*/

import { query } from '../index.js';

export const createBenutzerTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Benutzer (
        benutzerid SERIAL PRIMARY KEY,
        benutzername VARCHAR(25) NOT NULL,
        nachname VARCHAR(30) NOT NULL,
        vorname VARCHAR(30) NOT NULL,
        geburtsdatum DATE NOT NULL,
        email VARCHAR(100),
        passwordhash VARCHAR(25) NOT NULL,
        plz INTEGER NOT NULL,
        ort VARCHAR(30) NOT NULL,
        strasse VARCHAT(50) NOT NULL,
        hausnummer INTEGER NOT NULL,
        telefonnr INTEGER,
        erstelldatum TIMESTAMP,
        rolle VARCHAR,
        kontostatus VARCHAR(20),
        authentifizierung BOOLEAN DEFAULT FALSE
    );
  `;
    await query(sql);
};
