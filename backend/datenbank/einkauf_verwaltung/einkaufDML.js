/*
//Einkauf erstellen
INSERT INTO Einkauf (benutzerid, datum, bestätigung)
VALUES ($1, NOW(), TRUE)
RETURNING einkaufid;

//Produkt zu Einkauf hinzufügen
INSERT INTO Einkauf_Produkt (einkaufid, produktid, menge)
VALUES ($1, $2, $3);*/

import { query } from "../index.js";

// Neuen Einkauf anlegen
export const createEinkauf = async (benutzerid) => {
    const text = `
    INSERT INTO Einkauf (benutzerid, datum, bestätigung)
    VALUES ($1, NOW(), TRUE)
    RETURNING einkaufid;
  `;
    const values = [benutzerid];
    const result = await query(text, values);
    return result.rows[0].einkaufid;
};

// Produkt zu Einkauf hinzufügen
export const addProduktToEinkauf = async (einkaufid, produktid, menge) => {
    const text = `
    INSERT INTO Einkauf_Produkt (einkaufid, produktid, menge)
    VALUES ($1, $2, $3);
  `;
    const values = [einkaufid, produktid, menge];
    return await query(text, values);
};
