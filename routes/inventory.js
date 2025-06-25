import express, {application} from "express";
import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";
import {createProdukt, deleteProdukt} from "../backend/datenbank/produkt_verwaltung/produktDML.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/', async (req, res) => {
    const products = await getAllProducts();
    res.json(products);
});

router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    const produkt = await getProductById(id)
})

router.delete('/product/:id', async (req, res) => {
    await deleteProdukt(req.params.id)
})

router.post('/product/new', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const {produktname, preis, menge, bild, kategorie, kurzbeschreibung, beschreibung} = req.body;
    if (!produktname || !preis || !menge || !bild || !kategorie || !kurzbeschreibung || !beschreibung) {
        return res.status(400).json({
            error: 'All fields are required: produktname, preis, menge, bild, kategorie, kurzbeschreibung, beschreibung'
        });
    }

    const product = await createProdukt(produktname,preis, menge, kategorie, kurzbeschreibung,beschreibung);

    return res.json({ message: 'Product createn successful', product: product})
})

/*
createProduct("Name, Preis, Kategorie, Beschreibung, Kurzbeschreibung, Menge, Bild");
craeteUser("Benutzername, Vorname, Nachname, Land, PLZ, Ort, Straße, Hausnummer, E-Mail, Geburtsdatum, Password, Telefonnummer");
Supplements, Fitnesszubehör, Sportbekelidung, Trainingsgeräte
 */
