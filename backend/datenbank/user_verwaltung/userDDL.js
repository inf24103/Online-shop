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
            nachname VARCHAR(50) NOT NULL,
            vorname VARCHAR(50) NOT NULL,
            email VARCHAR(100),
            passwordhash VARCHAR(60) NOT NULL,
            plz VARCHAR(10) NOT NULL,
            ort VARCHAR(50) NOT NULL,
            strasse VARCHAR(100) NOT NULL,
            hausnummer VARCHAR(10) NOT NULL,
            telefonnr VARCHAR(15),
            erstelldatum TIMESTAMP,
            rolle VARCHAR(20),
            kontostatus VARCHAR(20),
            authentifizierung BOOLEAN DEFAULT FALSE
            );
  `;
    await query(sql);
};

export const deleteBenutzerTable = async () => {
    const sql = `
        DROP TABLE IF EXISTS Benutzer;
    `;
    await query(sql);
};
