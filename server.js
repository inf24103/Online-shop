import express from "express";
import morgan from "morgan";
import {mountRoutes} from "./routes/router.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import {
    createProductWarenkorbTable,
    createProduktTable, createWarenkorbTable,
    deleteProductTable,
    deleteWarenkorbProduktTable,
    deleteWarenkorbTable
} from "./backend/datenbank/produkt_verwaltung/produktDDL.js";
import {createBenutzerTable, deleteBenutzerTable} from "./backend/datenbank/user_verwaltung/userDDL.js";
import {createEinkaufTables, deleteEinkaufTables} from "./backend/datenbank/einkauf_verwaltung/einkaufDDL.js";
import {
    createWunschlisteTables,
    deleteWunschlisteTables
} from "./backend/datenbank/wunschliste_verwaltung/wunschlisteDDL.js";
import {createOneTimeLoginTable, dropOneTimeLoginTable} from "./backend/datenbank/auth/authAllMethods.js";

const app = express()
const port = process.env.PORT || 3000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// configure logging before each api call
morgan.token('source', function () {
    return 'Morgan:';
});
const customFormat = ':source :method :url :status :res[content-length] - :response-time ms';
app.use(morgan(customFormat));

mountRoutes(app);

// Globales abfangen unbehandelter Fehler
app.use((err, req, res, next) => {
    console.error("Server: Es ist ein unbehandelter Fehler aufgetreten:\n " + err.stack);
    return res.status(500).json({
        error: 'Ein Fehler ist aufgetreten!'
    });
});

// Docker 1. mal starten: docker compose up
// Docker wieder löschen: docker compose down -v

app.listen(port, () => {
    init()
    console.log(`Server läuft auf http://localhost:${port}`)
})

async function init() {
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

    console.log("Innit db successfully!");
}