// cors wieder rein machen für die Kommunikation zum Backend Server
import express from "express";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';import morgan from "morgan";
const app = express()
const port = 5000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(".", ".")));
/*
app.use(express.static(path.join(".", "pictures")));
app.use(express.static(path.join(".", "ProductPage")));
app.use(express.static(path.join(".", "Profilverwaltung")));
app.use(express.static(path.join(".", "public")));
app.use(express.static(path.join(".", "SignUpPage")));
app.use(express.static(path.join(".", "LoginPage")));
app.use(express.static(path.join(".", "unauthorized")));
app.use(express.static(path.join(".", "user")));
app.use(express.static(path.join(".", "Userverwaltung")));
 */

// configure logging before each api call
morgan.token('source', function () {
    return 'Morgan:';
});
const customFormat = ':source :method :url :status :res[content-length] - :response-time ms';
app.use(morgan(customFormat));


// Globales abfangen unbehandelter Fehler
app.use((err, req, res, next) => {
    console.error("Server: Es ist ein unbehandelter Fehler aufgetreten:\n " + err.stack);
    return res.status(500).json({
        error: 'Ein Fehler ist aufgetreten!'
    });
});

// unter Gastbuch beispiel
// bei jedem Endpunkt das html Template einlesen
// dann mit res.send(htmlSend)
app.get("/", (req, res) => {
    console.log("gelogged");
    //res.status(200).json({message:"gelogged"});
    renderPage('index.html','user', res)
})

function renderPage(page, ordner, res) {
    const fullPath = path.join('.', ordner, page);
    fs.readFile(fullPath, 'utf-8', (err, content) => {
        if (err) return res.status(500).send('Seitenfehler');
        res.send(content);
    });
}

app.listen(port, () => {
    console.log(`Frontend-Server läuft auf http://localhost:${port}`)
    console.log("minutes: ", new Date().getMinutes(), "seconds: ",new Date().getSeconds());
})