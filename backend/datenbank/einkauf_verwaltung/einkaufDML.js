import { query } from "../index.js";

// Neuen Einkauf anlegen
export const createEinkauf = async (benutzerid) => {
    const text = `
    INSERT INTO Einkauf (benutzerid, datum)
    VALUES ($1, NOW())
    RETURNING einkaufid;
  `;
    const values = [benutzerid];
    const result = await query(text, values);
    return result.rows[0].einkaufid;
};

// Produkt zu Einkauf hinzufügen
export const addProduktToEinkauf = async (einkaufid, produktid, anzahl) => {
    const text = `
    INSERT INTO Einkauf_Produkt (einkaufid, produktid, anzahl)
    VALUES ($1, $2, $3);
  `;
    const values = [einkaufid, produktid, anzahl];
    return await query(text, values);
};
