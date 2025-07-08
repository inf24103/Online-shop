/*CREATE TABLE Produkt (
    produktid SERIAL PRIMARY KEY,
    produktname VARCHAR(30),
    preis DECIMAL(10,2),
    menge INTEGER,
    preis_pro_menge ?,
    bild BYTEA,
    kategorie VARCHAR(50),
    kurzbeschreibung VARCHAR(100),
    beschreibung VARCHAR(500),
);

CREATE TABLE Warenkorb (
    warenkorbid SERIAL PRIMARY KEY,
    benutzerid INTEGER NOT NULL REFERENCES benutzer(benutzerid),
    erstellt TIMESTAMP,
);
*/

import { query } from '../index.js';

export const createProduktTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Produkt (
      produktid SERIAL PRIMARY KEY,
      produktname VARCHAR(30),
      preis DECIMAL(10,2),
      menge INTEGER,
      bild VARCHAR(500),
      kategorie VARCHAR(50),
      beschreibung VARCHAR(5000)
    );
  `;
    await query(sql);
};

export const createWarenkorbTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Warenkorb (
      warenkorbid SERIAL PRIMARY KEY,
      benutzerid INTEGER NOT NULL REFERENCES Benutzer(benutzerid),
      erstellt TIMESTAMP DEFAULT NOW()
    );
  `;
    await query(sql);
};

export const createProductWarenkorbTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Product_Warenkorb (
      id SERIAL PRIMARY KEY,
      warenkorbid INTEGER NOT NULL REFERENCES Warenkorb(warenkorbid),
      produktid INTEGER NOT NULL REFERENCES Produkt(produktid),
      anzahl INTEGER NOT NULL CHECK (anzahl > 0)
    );
  `;
    await query(sql);
};

export const deleteProductTable = async () => {
    const sql = `
        DROP TABLE IF EXISTS Produkt CASCADE;
    `;
    await query(sql);
};

export const deleteWarenkorbTable = async () => {
    const sql = `
        DROP TABLE IF EXISTS Warenkorb CASCADE;
    `;
    await query(sql);
};

export const deleteWarenkorbProduktTable = async () => {
    const sql = `
        DROP TABLE IF EXISTS Product_Warenkorb CASCADE;
    `;
    await query(sql);
};