import {query} from '../index.js';

/* Produkt erstellen */
export const createProdukt = async (produktname, preis, menge, kategorie, beschreibung, bildname) => {
    // Kategorie säubern
    const safeKategorie = kategorie.replace(/[\/\\:*?"<>|]/g, '').trim().toLowerCase();

    // Bildname säubern: Sonderzeichen entfernen, Leerzeichen durch
    console.log(bildname)
    const safeBildname = bildname
        .replace(/[\/\\:*?"<>|]/g, '_')   // Sonderzeichen
        .replace(/\s+/g, '_')           // Leerzeichen → _
        .trim();
    const bildPfad = `productBilder/${safeKategorie}/${safeBildname}`;

    // Prüfen, ob dieser Bildpfad schon verwendet wird
    const checkSql = `SELECT * FROM Produkt WHERE bild = $1`;
    const existing = await query(checkSql, [bildPfad]);
    if (existing.length > 0) {
        throw new Error(`Bildpfad '${bildPfad}' ist bereits einem anderen Produkt zugeordnet.`);
    }

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
export const updateProdukt = async (produktname, preis, menge, kategorie, beschreibung, bild, produktid) => {
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
    return await query(sql, [produktname, preis, menge, kategorie, beschreibung, bild, produktid]);
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