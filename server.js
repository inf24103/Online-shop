import express from "express";
import morgan from "morgan";
import {mountRoutes} from "./routes/router.js";
import cookieParser from "cookie-parser";
import {createBenutzerTable, deleteBenutzerTable} from "./backend/datenbank/user_verwaltung/userDDL.js";
import {
    createProductWarenkorbTable,
    createProduktTable,
    createWarenkorbTable,
    deleteProductTable, deleteWarenkorbProduktTable, deleteWarenkorbTable
} from "./backend/datenbank/produkt_verwaltung/produktDDL.js";
import cors from "cors";

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

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`)
    //createSampleData()
})

async function createSampleData() {
    // Lösche abhängige Tabellen zuerst
    await deleteWarenkorbProduktTable();
    await deleteWarenkorbTable();
    await deleteProductTable();
    await deleteBenutzerTable()
    await deleteEinkaufTables();
    await deleteWunschlisteTables();
    await dropOneTimeLoginTable();

    // Erstelle Tabellen in der richtigen Reihenfolge
    await createBenutzerTable();
    await createProduktTable();
    await createWarenkorbTable();
    await createProductWarenkorbTable();
    await createEinkaufTables();
    await createWunschlisteTables();
    await createOneTimeLoginTable();
}