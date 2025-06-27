import { query } from './db.js'; // deine DB-Verbindung und query-Funktion

export const createTables = async () => {
    await query(`
    CREATE TABLE IF NOT EXISTS Einkauf (
        einkaufid SERIAL PRIMARY KEY,
        benutzerid INTEGER NOT NULL REFERENCES benutzer(benutzerid),
        datum DATE,
    );
  `);

    await query(`
    CREATE TABLE IF NOT EXISTS Einkauf_Produkt (
        einkauf_produktid SERIAL PRIMARY KEY,
        einkaufid INTEGER NOT NULL REFERENCES Einkauf(einkaufid),
        produktid INTEGER NOT NULL REFERENCES Produkt(produktid),
        anzahl INTEGER,
    );
  `);
};
