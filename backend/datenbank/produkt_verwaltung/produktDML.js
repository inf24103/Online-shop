/*Produkt erstellen, die VALUE $1 müssen mit den jeweiligen Namen ersetzt werden.
//produktname = $1, preis = $2, menge = $3, kategorie = $4, kurzbeschreibung = $5, beschreibung = $6
INSERT INTO Produkt (produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung)
VALUES ($1, $2, $3, $4, $5, $6);

//Produkt löschen
DELETE FROM Produkt WHERE produktid = $1;

//Produkt aktualisieren, Hier müsst ihr die Werte wie oben anpassen, aber müsst die Angabe von produktID angeben.
UPDATE Produkt
SET produktname = $1,
    preis = $2,
    menge = $3,
    kategorie = $4,
    kurzbeschreibung = $5,
    beschreibung = $6
WHERE produktid = $7;*/

import { query } from '../index.js';

/* Produkt erstellen */
export const createProdukt = async (produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung) => {
    const sql = `
    INSERT INTO Produkt (produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
    return await query(sql, [produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung]);
};

/* Produkt löschen */
export const deleteProdukt = async (produktid) => {
    const sql = `DELETE FROM Produkt WHERE produktid = $1;`;
    return await query(sql, [produktid]);
};

/* Produkt aktualisieren */
export const updateProdukt = async (produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung, produktid) => {
    const sql = `
    UPDATE Produkt
    SET produktname = $1,
        preis = $2,
        menge = $3,
        kategorie = $4,
        kurzbeschreibung = $5,
        beschreibung = $6
    WHERE produktid = $7;
  `;
    return await query(sql, [produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung, produktid]);
};



