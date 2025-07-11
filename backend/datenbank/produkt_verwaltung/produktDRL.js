import {query} from '../index.js';

/* Alle Infos zu einem Produkt */
export const getProduktById = async (produktid) => {
    const sql = `SELECT * FROM Produkt WHERE produktid = $1;`;
    return await query(sql, [produktid]);
};


export const searchProdukte = async (name, maxPreis, minMenge, kategorie, sortierungArray) => {
    const sortierMapping = {
        "preis_asc": "preis ASC",
        "preis_desc": "preis DESC",
        "name_asc": "produktname ASC",
        "name_desc": "produktname DESC"
    };

    // Default: kein ORDER BY
    let orderByClause = "";

    if (Array.isArray(sortierungArray) && sortierungArray.length > 0) {
        const sqlParts = sortierungArray
            .map(s => sortierMapping[s])
            .filter(Boolean); // entfernt undefined, falls falscher Wert übergeben wurde

        if (sqlParts.length > 0) {
            orderByClause = "ORDER BY " + sqlParts.join(", ");
        }
    }

    const sql = `
        SELECT * FROM Produkt
        WHERE
            ($1::text IS NULL OR produktname ILIKE '%' || $1 || '%') AND
            ($2::numeric IS NULL OR preis <= $2) AND
            ($3::integer IS NULL OR menge >= $3) AND
            ($4::text IS NULL OR kategorie = $4)
            ${orderByClause};
    `;
    return await query(sql, [name, maxPreis, minMenge, kategorie]);
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

