import {
    createProductWarenkorbTable,
    createProduktTable, createWarenkorbTable,
    deleteProductTable,
    deleteWarenkorbProduktTable,
    deleteWarenkorbTable
} from "./produkt_verwaltung/produktDDL.js";
import {createBenutzerTable, deleteBenutzerTable} from "./user_verwaltung/userDDL.js";
import {createEinkaufTables, deleteEinkaufTables} from "./einkauf_verwaltung/einkaufDDL.js";
import {createWunschlisteTables, deleteWunschlisteTables} from "./wunschliste_verwaltung/wunschlisteDDL.js";
import {createOneTimeLoginTable, dropOneTimeLoginTable} from "./auth/authAllMethods.js";

await deleteWarenkorbProduktTable();
await deleteWarenkorbTable();
await deleteProductTable();
await deleteBenutzerTable()
await deleteEinkaufTables();
await deleteWunschlisteTables();
await dropOneTimeLoginTable();

await createBenutzerTable();
await createProduktTable();
await createWarenkorbTable();
await createProductWarenkorbTable();
await createEinkaufTables();
await createWunschlisteTables();
await createOneTimeLoginTable();