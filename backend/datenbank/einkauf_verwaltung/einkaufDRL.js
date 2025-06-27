import { query } from "../index.js";

// Alle Einkäufe eines Benutzers (nur IDs)
export const getEinkaeufeByBenutzer = async (benutzerid) => {
    const text = `
    SELECT einkaufid
    FROM Einkauf
    WHERE benutzerid = $1;
  `;
    const values = [benutzerid];
    const result = await query(text, values);
    return result.rows;
};

// Alle Produkte mit Menge für einen Einkauf
export const getProdukteByEinkauf = async (einkaufid) => {
    const text = `
    SELECT p.*, ep.menge
    FROM Produkt p
    JOIN Einkauf_Produkt ep ON p.produktid = ep.produktid
    WHERE ep.einkaufid = $1;
  `;
    const values = [einkaufid];
    const result = await query(text, values);
    return result.rows;
};
