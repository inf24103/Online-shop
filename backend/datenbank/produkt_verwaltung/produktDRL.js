/*Alle Infos zu Produkt $1 (Platzhalter)
SELECT * FROM Produkt WHERE produktid = $1;

//Suche mit Filtern und Sortierung
SELECT * FROM Produkt
WHERE
($1::text IS NULL OR produktname ILIKE '%' || $1 || '%') AND
($2::numeric IS NULL OR preis <= $2) AND
($3::integer IS NULL OR menge >= $3) AND
($4::text IS NULL OR kategorie = $4)
ORDER BY
CASE WHEN $5 = 'preis_asc' THEN preis END ASC,
    CASE WHEN $5 = 'preis_desc' THEN preis END DESC;*/

import {query} from '../index.js';

/* Alle Infos zu einem Produkt */
export const getProduktById = async (produktid) => {
    const sql = `SELECT * FROM Produkt WHERE produktid = $1;`;
    return await query(sql, [produktid]);
};

/* Suche mit Filtern und Sortierung */
export const searchProdukte = async (name, maxPreis, minMenge, kategorie, sortierung) => {
    const sql = `
    SELECT * FROM Produkt
    WHERE
      ($1::text IS NULL OR produktname ILIKE '%' || $1 || '%') AND
      ($2::numeric IS NULL OR preis <= $2) AND
      ($3::integer IS NULL OR menge >= $3) AND
      ($4::text IS NULL OR kategorie = $4)
    ORDER BY
      CASE WHEN $5 = 'preis_asc' THEN preis END ASC,
      CASE WHEN $5 = 'preis_desc' THEN preis END DESC;
  `;
    return await query(sql, [name, maxPreis, minMenge, kategorie, sortierung]);
};

/* Alle Produkte anzeigen */
export const getAllProdukte = async () => {
    const sql = `SELECT * FROM Produkt;`;
    return await query(sql);
};

export const getWarenkorbByBenutzerId = async (benutzerID) => {
    const sql = `SELECT * FROM Warenkorb WHERE benutzerid = $1;`;
    return await query(sql, [benutzerID]);
};

export const getProdukteByWarenkorbid = async (warenkorbid) => {
    const sql = `
        SELECT * FROM Produkt p
                 JOIN Product_Warenkorb pw ON p.produktid = pw.produktid
        WHERE pw.warenkorbid = $1;
    `;
    return await query(sql, [warenkorbid]);
};

export const updateProductQuantity = async (warenkorbid, produktid, increment) => {
    const sql = `
        UPDATE Product_Warenkorb
        SET anzahl = anzahl + $3
        WHERE warenkorbid = $1 AND produktid = $2;
    `;
    return await query(sql, [warenkorbid, produktid, increment]);
};

