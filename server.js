import express from "express";
import morgan from "morgan";
import {mountRoutes} from "./routes/router.js";
import cookieParser from "cookie-parser";
import {
    createProductWarenkorbTable,
    createProduktTable, createWarenkorbTable,
    deleteProductTable,
    deleteWarenkorbProduktTable,
    deleteWarenkorbTable
} from "./backend/datenbank/produkt_verwaltung/produktDDL.js";
import {createBenutzerTable, deleteBenutzerTable} from "./backend/datenbank/user_verwaltung/userDDL.js";
import cors from "cors";
import {createEinkaufTables, deleteEinkaufTables} from "./backend/datenbank/einkauf_verwaltung/einkaufDDL.js";
import {
    createWunschlisteTables,
    deleteWunschlisteTables
} from "./backend/datenbank/wunschliste_verwaltung/wunschlisteDDL.js";
import {createOneTimeLoginTable, dropOneTimeLoginTable} from "./backend/datenbank/auth/authAllMethods.js";
import {createBenutzer, updateBenutzer} from "./backend/datenbank/user_verwaltung/userDML.js";
import {getUserById, getUserByUsername} from "./backend/datenbank/user_verwaltung/userDRL.js";

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

    // create admin account
    await createAdminAccount()
    console.log("Innit db successfully!");
}

async function createAdminAccount() {
    await createBenutzer("admin", "admin", "amdin", "admin", "$2b$12$i2V4lHexLcYzjcUXo30ywuFyRlznGMFNr96T0XqHqgPsF1tJjXl3y", "12345", "admin", "admin", "admin", "admin", 'admin');
    const user = await getUserByUsername("admin");
    user[0].authentifizierung = true
    await updateBenutzer(
        user[0].benutzerid,
        user[0].benutzername,
        user[0].nachname,
        user[0].vorname,
        user[0].email,
        user[0].rolle,
        user[0].kontostatus,
        user[0].plz,
        user[0].ort,
        user[0].strasse,
        user[0].hausnummer,
        user[0].telefonnr,
        user[0].authentifizierung
    );
}