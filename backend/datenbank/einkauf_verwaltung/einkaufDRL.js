import { query } from "../index.js";

export const getEinkaeufeByBenutzer = async (benutzerid) => {
    const text = `
    SELECT *
    FROM Einkauf
    WHERE benutzerid = $1;
  `;
    const values = [benutzerid];
    return await query(text, values);
};

export const getProdukteByEinkauf = async (einkaufid) => {
    const text = `
    SELECT p.*, ep.anzahl
    FROM Produkt p
    JOIN Einkauf_Produkt ep ON p.produktid = ep.produktid
    WHERE ep.einkaufid = $1;
  `;
    const values = [einkaufid];
    return await query(text, values);
};
