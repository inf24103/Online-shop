import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";
import {
    addProductToWarenkorb,
    createProdukt,
    deleteProdukt,
    updateProdukt
} from "../backend/datenbank/produkt_verwaltung/produktDML.js";
import express from "express";
import {
    getAllProdukte,
    getProduktById, getProdukteByWarenkorbid,
    getWarenkorbByBenutzerId,
    searchProdukte
} from "../backend/datenbank/produkt_verwaltung/produktDRL.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/product/all', async (req, res) => {
    const products = await getAllProdukte();
    res.status(200).json(products);
});

router.get('/product/search', async (req, res) => {
    const { name, maxPreis, minMenge, kategorie, sortierung } = req.query;
    if (!name || !maxPreis || !minMenge || !kategorie || !sortierung) {
        return res.status(400).json({
            error: 'All fields are required: name, maxPreis, minMenge, kategorie, sortierung'
        });
    }

    try {
        const result = await searchProdukte(name, maxPreis, minMenge, kategorie, sortierung);
        res.status(200).json(result);
    } catch (error) {
        console.error('Fehler bei der Produktsuche:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

router.post('/product/new', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const {produktname, preis, menge, bild, kategorie, kurzbeschreibung, beschreibung} = req.body;
    if (!produktname || !preis || !menge || !bild || !kategorie || !kurzbeschreibung || !beschreibung) {
        return res.status(400).json({
            error: 'All fields are required: produktname, preis, menge, bild, kategorie, kurzbeschreibung, beschreibung'
        });
    }

    const product = await createProdukt(produktname, preis, menge, kategorie, kurzbeschreibung, beschreibung);

    return res.status(200).json(product)
})

router.get('/product/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    const produkt = await getProduktById(id)
    if (produkt.length === 0) {
        return res.status(404).json({message: "Product not found"})
    }
    res.status(200).json(produkt);
})

router.delete('/product/:id', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({message: 'Ungültige Produkt-ID'});
    }

    const produkt = await getProduktById(id);
    if (produkt.length === 0) {
        return res.status(404).json({message: 'Produkt nicht gefunden'});
    }

    await deleteProdukt(id);
    const produktNachLoeschung = await getProduktById(id);

    if (produktNachLoeschung.length > 0) {
        return res.status(400).json({message: 'Produkt konnte nicht gelöscht werden'});
    }

    res.status(200).json({message: 'Produkt wurde gelöscht'});
});

router.patch('/product/:id', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({message: 'Ungültige Produkt-ID'});
    }
    const produkt = await getProduktById(id);
    if (produkt.length === 0) {
        return res.status(404).json({message: 'Produkt nicht gefunden'});
    }

    const {produktname, preis, menge, bild, kategorie, kurzbeschreibung, beschreibung} = req.body;
    const updatedProduct = produkt[0];
    if (produktname !== undefined) updatedProduct.produktname = produktname;
    if (preis !== undefined) updatedProduct.preis = preis;
    if (menge !== undefined) updatedProduct.menge = menge;
    if (bild !== undefined) updatedProduct.bild = bild;
    if (kategorie !== undefined) updatedProduct.kategorie = kategorie;
    if (kurzbeschreibung !== undefined) updatedProduct.kurzbeschreibung = kurzbeschreibung;
    if (beschreibung !== undefined) updatedProduct.beschreibung = beschreibung;

    await updateProdukt(
        updatedProduct.produktname,
        updatedProduct.preis,
        updatedProduct.menge,
        updatedProduct.kategorie,
        updatedProduct.kurzbeschreibung,
        updatedProduct.beschreibung,
        updatedProduct.bild,
        id,
    );
    const aktualisiertesProduktNachUpdate = await getProduktById(id);
    res.status(200).json(aktualisiertesProduktNachUpdate);
});

router.post('/warenkorb/add', authenticateToken,async (req, res) => {
    const { produktid, anzahl } = req.body;

    if (!produktid || !anzahl) {
        return res.status(400).json({ error: 'All fields are required: warenkorbid, produktid, anzahl' });
    }

    const productidInt = parseInt(produktid);
    if (isNaN(productidInt)) {
        return res.status(400).json({message: 'Ungültige Produkt-ID'});
    }

    const anzahlInt = parseInt(anzahl );
    if (isNaN(productidInt) && anzahlInt <= 0) {
        return res.status(400).json({message: 'Ungültige anzahl'});
    }

    try {
        const product = await getProduktById(produktid);
        if (product.length === 0 || product.menge < 1) {
            return res.status(404).json({message: "product out of stock"})
        }

        const warenkorbid = await getWarenkorbByBenutzerId(req.jwtpayload.userid);
        const newEntry = await addProductToWarenkorb(warenkorbid[0].warenkorbid, productidInt, anzahlInt);
        res.status(200).json(newEntry);
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Produkts zum Warenkorb:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

router.get('/warenkorb/my',authenticateToken, async (req, res) => {
    const id = req.jwtpayload.userid
    if(isNaN(id)) {
        return res.status(401).json({message: 'Ungültige Produkt-ID'});
    }

    try {
        const warenkorb = await getWarenkorbByBenutzerId(id);
        res.status(200).json(warenkorb);
    } catch (error) {
        console.error('Fehler beim Ermitteln des Warenkorbs:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

router.get('/warenkorb/myproducts',authenticateToken, async (req, res) => {
    const id = req.jwtpayload.userid
    if(isNaN(id)) {
        return res.status(401).json({message: 'Ungültige Produkt-ID'});
    }

    try {
        const warenkorb = await getWarenkorbByBenutzerId(id);
        const products = await getProdukteByWarenkorbid(warenkorb[0].warenkorbid);
        res.status(200).json(products);
    } catch (error) {
        console.error('Fehler beim Ermitteln des Warenkorbs:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
})