import { query } from '../index.js';

export const createWunschlisteTables = async () => {
    const sqlWunschliste = `
    CREATE TABLE IF NOT EXISTS Wunschliste (
      wunschlisteid SERIAL PRIMARY KEY,
      wunschlistename VARCHAR(50),
      beschreibung VARCHAR(250)
    );
  `;

  const sqlWunschlisteProdukte = `
  CREATE TABLE IF NOT EXISTS Wunschliste_Produkt (
    wunschlisteid INTEGER NOT NULL REFERENCES Wunschliste(wunschlisteid),
    produktid INTEGER NOT NULL REFERENCES Produkt(produktid),
    PRIMARY KEY (wunschlisteid, produktid)
    );
  `;

    const sqlBerechtigung = `
    CREATE TABLE IF NOT EXISTS Wunschliste_Berechtigung (
      wunschlisteid INTEGER NOT NULL REFERENCES Wunschliste(wunschlisteid),
      benutzerid INTEGER NOT NULL REFERENCES Benutzer(benutzerid),
      berechtigung VARCHAR(50),
      PRIMARY KEY (wunschlisteid, benutzerid)
    );
  `;

    await query(sqlWunschliste);
    await query(sqlBerechtigung);
    await query(sqlWunschlisteProdukte);
};

export const deleteWunschlisteTables = async () => {
  const sqlDeleteWunschlisteProdukte = `
    DROP TABLE IF EXISTS Wunschliste_Produkt;
  `;

  const sqlDeleteBerechtigung = `
    DROP TABLE IF EXISTS Wunschliste_Berechtigung;
  `;

  const sqlDeleteWunschliste = `
    DROP TABLE IF EXISTS Wunschliste;
  `;

  await query(sqlDeleteWunschlisteProdukte);
  await query(sqlDeleteBerechtigung);
  await query(sqlDeleteWunschliste);
};
