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

import {query} from '../index.js';

/* Produkt erstellen */
export const createProdukt = async (produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung) => {
    const sql = `
        INSERT INTO Produkt (produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    return await query(sql, [produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung]);
};

/* Produkt löschen */
export const deleteProdukt = async (produktid) => {
    const sql = `DELETE
                 FROM Produkt
                 WHERE produktid = $1;`;
    return await query(sql, [produktid]);
};

/* Produkt aktualisieren */
export const updateProdukt = async (produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung, bild, produktid) => {
    const sql = `
        UPDATE Produkt
        SET produktname      = $1,
            preis            = $2,
            menge            = $3,
            kategorie        = $4,
            kurzbeschreibung = $5,
            beschreibung     = $6,
            bild             = $7
        WHERE produktid = $8;
    `;
    return await query(sql, [produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung, bild, produktid]);
};

export const createWarenkorb = async (benutzerid) => {
    const sql = `
        INSERT INTO Warenkorb (benutzerid)
        VALUES ($1) RETURNING warenkorbid, erstellt;
    `;
    return await query(sql, [benutzerid]);
};

export const deleteWarenkorb = async (benutzerid) => {
    const sql = `
        DELETE
        FROM Warenkorb
        WHERE benutzerid = $1 RETURNING warenkorbid, erstellt;
        ;
    `;
    return await query(sql, [benutzerid]);
};

export const deleteProdukteWarenkorb = async (warenkorbid) => {
    const sql = `
        DELETE FROM Product_Warenkorb
        WHERE warenkorbid = $1
        RETURNING produktid, warenkorbid;
    `;
    return await query(sql, [warenkorbid]);
};


export const addProductToWarenkorb = async (warenkorbid, produktid, anzahl) => {
    const sql = `
        INSERT INTO Product_Warenkorb (warenkorbid, produktid, anzahl)
        VALUES ($1, $2, $3) RETURNING id, warenkorbid, produktid, anzahl;
    `;
    return await query(sql, [warenkorbid, produktid, anzahl]);
};

export const deleteProductInWarenkorb = async (produktid, warenkorbid) => {
    const sql = `DELETE
                 FROM Product_Warenkorb
                 WHERE produktid = $1
                   AND warenkorbid = $2;`;
    return await query(sql, [produktid, warenkorbid]);
};