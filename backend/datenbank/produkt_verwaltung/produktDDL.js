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
    benutzerid INTEGER NOT NULL REFERENCES beuntzer(benutzerid),
    erstellt TIMESTAMP,
)*/

import { query } from '../index.js';

export const createProduktTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS Produkt (
      produktid SERIAL PRIMARY KEY,
      produktname VARCHAR(30),
      preis DECIMAL(10,2),
      menge INTEGER,
      preis_pro_menge DECIMAL(10,2),
      bild BYTEA,
      kategorie VARCHAR(50),
      kurzbeschreibung VARCHAR(100),
      beschreibung VARCHAR(500)
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
