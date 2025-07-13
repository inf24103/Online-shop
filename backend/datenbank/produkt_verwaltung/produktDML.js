import {query} from '../index.js';
import {getAllProdukte} from "./produktDRL.js";

/* Produkt erstellen */
export const createProdukt = async (produktname, preis, menge, kategorie, beschreibung, bildFormat) => {
    // Kategorie säubern
    const safeKategorie = kategorie.replace(/[\/\\:*?"<>|]/g, '').trim().toLowerCase();

    const allProducts = await getAllProdukte()
    const productNr = allProducts.length
    const bildPfad = `${safeKategorie}/${productNr}.${bildFormat}`;

    const sql = `
        INSERT INTO Produkt (produktname, preis, menge, kategorie, beschreibung, bild)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    return await query(sql, [produktname, preis, menge, kategorie, beschreibung, bildPfad]);
};

/* Produkt löschen */
export const deleteProdukt = async (produktid) => {
    const sql = `DELETE
                 FROM Produkt
                 WHERE produktid = $1;`;
    return await query(sql, [produktid]);
};

/* Produkt aktualisieren */
export const updateProdukt = async (produktname, preis, menge, kategorie, beschreibung, bildFormat, produktid) => {
    const safeKategorie = kategorie.replace(/[\/\\:*?"<>|]/g, '').trim().toLowerCase();

    const productNr = produktid - 1
    const bildPfad = `${safeKategorie}/${productNr}.${bildFormat}`;
    const sql = `
        UPDATE Produkt
        SET produktname      = $1,
            preis            = $2,
            menge            = $3,
            kategorie        = $4,
            beschreibung     = $5,
            bild             = $6
        WHERE produktid = $7;
    `;
    return await query(sql, [produktname, preis, menge, kategorie, beschreibung, bildPfad, produktid]);
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

export const deleteAllProductsInWarenkorb = async (warenkorbid) => {
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