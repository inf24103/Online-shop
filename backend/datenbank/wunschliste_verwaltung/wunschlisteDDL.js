import { query } from '../index.js';

export const createWunschlisteTables = async () => {
    const sqlWunschliste = `
    CREATE TABLE IF NOT EXISTS Wunschliste (
      wunschlisteid SERIAL PRIMARY KEY,
      beschreibung VARCHAR(250)
    );
  `;

    const sqlBerechtigung = `
    CREATE TABLE IF NOT EXISTS Wunschliste_Berechtigung (
      wunschlisteid INTEGER NOT NULL REFERENCES Wunschliste(wunschlisteid),
      benutzerid INTEGER NOT NULL REFERENCES Benutzer(benutzerid),
      berechtigung VARCHAR(50),
      PRIMARY KEY (wunschlisteid, benutzerid)
    );
  `;

    await query(sqlWunschliste);
    await query(sqlBerechtigung);
};
