import {query} from "../index.js";

export const createEinkaufTables = async () => {
    await query(`
    CREATE TABLE IF NOT EXISTS Einkauf (
        einkaufid SERIAL PRIMARY KEY,
        benutzerid INTEGER NOT NULL REFERENCES benutzer(benutzerid),
        datum DATE DEFAULT CURRENT_DATE
    );
  `);

    await query(`
    CREATE TABLE IF NOT EXISTS Einkauf_Produkt (
        einkauf_produktid SERIAL PRIMARY KEY,
        einkaufid INTEGER NOT NULL REFERENCES Einkauf(einkaufid),
        produktid INTEGER NOT NULL REFERENCES Produkt(produktid),
        anzahl INTEGER
    );
  `);
};

export const deleteEinkaufTables = async () => {
    await query(`
        DROP TABLE IF EXISTS Einkauf_Produkt;
    `);

    await query(`
        DROP TABLE IF EXISTS Einkauf;
    `);
};
