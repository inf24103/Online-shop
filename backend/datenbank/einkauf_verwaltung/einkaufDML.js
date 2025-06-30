import { query } from "../index.js";

// Neuen Einkauf anlegen
export const createEinkauf = async (benutzerid) => {
    const text = `
    INSERT INTO Einkauf (benutzerid, datum)
    VALUES ($1, NOW())
    RETURNING einkaufid;
  `;
    const values = [benutzerid];
    return await query(text, values);
};

export const addProduktToEinkauf = async (einkaufid, produktid, anzahl) => {
    const text = `
    INSERT INTO Einkauf_Produkt (einkaufid, produktid, anzahl)
    VALUES ($1, $2, $3);
  `;
    const values = [einkaufid, produktid, anzahl];
    return await query(text, values);
};

// Alle Einkäufe eines Benutzers und die zugehörigen Produkte löschen
export const deleteEinkaeufeByBenutzer = async (benutzerid) => {
    const deleteProductsText = `
    DELETE FROM Einkauf_Produkt
    WHERE einkaufid IN (
        SELECT einkaufid
        FROM Einkauf
        WHERE benutzerid = $1
    );
  `;
    const params = [benutzerid];
    await query(deleteProductsText, params);

    const deleteEinkaeufeText = `
    DELETE FROM Einkauf
    WHERE benutzerid = $1;
  `;
    return await query(deleteEinkaeufeText, params);
};
