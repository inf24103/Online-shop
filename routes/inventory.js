import express from "express";
import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/', async (req, res) => {
    const products = await getAllProducts();
    res.json(products);
});

router.get('/:id', authenticateTokenAndAuthorizeRole('user'), async (req, res) => {
    const id = parseInt(req.params.id)
    const produkt = getProductById(id)
})

router.use((err, req, res) => {
    console.error("Error in inventory routing: " + err.message);
    res.status(500).send("Internal Server Error");
});

router.get('/mycart', authenticateToken, async (req, res) => {
    const warenkorb = getWarenkorbByBenutzerID(req.jwtpayload.username);
    res.json(warenkorb);
})

router.put('/cartadd/:id', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id);
    const product = getProductById(id);
    if(product === undefined) {
        res.status(404).send("Product could not be added, not found");
    }
    const cart = getWarenkorbByBenutezrID(req.jwtpayload.userid)


})

/*
createProduct("Name, Preis, Kategorie, Beschreibung, Kurzbeschreibung, Menge, Bild");
craeteUser("Benutzername, Vorname, Nachname, Land, PLZ, Ort, Straße, Hausnummer, E-Mail, Geburtsdatum, Password, Telefonnummer");
Supplements, Fitnesszubehör, Sportbekelidung, Trainingsgeräte
 */
