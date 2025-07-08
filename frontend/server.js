// neues docker compose erstellen
// Docker 1. mal starten: docker compose up
// Docker wieder löschen: docker compose down -v
// cors wieder rein machen für die Kommunikation zum Backend Server
import express from "express";
import * as fs from "node:fs";
const app = express()
const port = 5000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const html = fs.readFileSync('../frontend/user/index.html', 'utf8');
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    res.send(html);
})

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`)
})