import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";
import {
    addProductToWarenkorb,
    createProdukt,
    createWarenkorb,
    deleteAllProductsInWarenkorb,
    deleteProductInWarenkorb,
    deleteProdukt,
    updateProdukt
} from "../datenbank/produkt_verwaltung/produktDML.js";
import express from "express";
import multer from "multer";
import {
    getAllProdukte,
    getProduktById,
    getProdukteByWarenkorbid,
    getWarenkorbByBenutzerId,
    searchProdukte,
    updateProductQuantity
} from "../datenbank/produkt_verwaltung/produktDRL.js";
import {addProduktToEinkauf, createEinkauf} from "../datenbank/einkauf_verwaltung/einkaufDML.js";
import {mail} from "../mailService/mailservice.js";
import {getUserById} from "../datenbank/user_verwaltung/userDRL.js";
import {generateOrderConfirmationTemplate} from "../mailService/orderConfirmation.js";
import {getEinkaeufeByBenutzer, getProdukteByEinkauf} from "../datenbank/einkauf_verwaltung/einkaufDRL.js";
import * as fs from "node:fs";
import * as path from "node:path";

const router = express.Router();
const upload = multer({
    dest: "tmp/",
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Nur Bildformate (jpg, png, webp) sind erlaubt!"), false);
        }
    }
});

// export our router to be mounted by the parent application
export default router

router.get('/product/all', async (req, res) => {
    const products = await getAllProdukte();
    res.status(200).json(products);
});

router.get('/product/search', async (req, res) => {
    let {name = null, maxPreis = null, minMenge = null, kategorie = null, sortierung = null} = req.query;
    name = name === "" ? null : name;
    maxPreis = maxPreis === "" ? null : maxPreis;
    minMenge = minMenge === "" ? null : minMenge;
    kategorie = kategorie === "" ? null : kategorie;
    sortierung = sortierung === "" ? null : sortierung;

    let sortierungArray = [];
    if (typeof sortierung === "string" && sortierung !== "") {
        sortierungArray = sortierung.split(",").map(s => s.trim());
    }

    try {
        const result = await searchProdukte(name, maxPreis, minMenge, kategorie, sortierungArray);
        res.status(200).json(result);
    } catch (error) {
        console.error('Fehler bei der Produktsuche:', error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
});

router.post('/product/new', authenticateTokenAndAuthorizeRole(['admin']), (req, res, next) => {
    upload.single("bild")(req, res, function (err) {
        if (err instanceof multer.MulterError || err instanceof Error) {
            console.log("Error bei ermittlung des Bidls:", err);
            return res.status(400).json({message: "Interner Serverfehler. Vermutlich falsches Bildformat. Nur Bildformate (jpg, png, webp) sind erlaubt."});
        }
        next();
    });
}, async (req, res) => {
    try {
        let {produktname, preis, verfuegbareMenge, kategorie, beschreibung} = req.body;
        if (!produktname || !preis || !verfuegbareMenge || !kategorie || !beschreibung) {
            return res.status(400).json({
                error: 'All fields are required: produktname, preis, menge, kategorie, beschreibung'
            });
        }
        preis = parseInt(preis);
        verfuegbareMenge = parseInt(verfuegbareMenge);
        if (isNaN(preis)) {
            return res.status(403).json({message: "Ungültiger Preis"})
        }
        if (isNaN(verfuegbareMenge)) {
            return res.status(403).json({message: "Ungültige Menge"})
        }
        const erlaubteKategorien = ["supplement", "trainingsgerät", "fitnesszubehör", "sportbekleidung"];
        if (!erlaubteKategorien.includes(kategorie.toLowerCase())) {
            return res.status(400).json({
                error: `Ungültige Kategorie. Erlaubte Kategorien sind: ${erlaubteKategorien.join(", ")}`
            });
        }
        if (!req.file) {
            return res.status(400).json({
                error: 'A bild is required'
            });
        }
        const mime = req.file.mimetype; // z. B. "image/jpeg"
        let bildFormat = "jpg"; // Default fallback

        if (mime === "image/png") bildFormat = "png";
        else if (mime === "image/webp") bildFormat = "webp";
        else if (mime === "image/jpeg") bildFormat = "jpg";
        else if (mime === "image/jpg") bildFormat = "jpg";
        else {
            console.warn("Unbekanntes Bildformat:", mime);
        }

        const produkt = await createProdukt(
            produktname,
            parseFloat(preis),
            parseInt(verfuegbareMenge),
            kategorie,
            beschreibung,
            bildFormat
        );

        const absoluterBildPfad = "productBilder/" + produkt[0].bild;
        const zielPfad = path.resolve(absoluterBildPfad);
        fs.mkdirSync(path.dirname(zielPfad), {recursive: true});
        fs.renameSync(req.file.path, zielPfad);

        return res.send(produkt)
    } catch (error) {
        console.error('Fehler bei erstellen des Produktes:', error);
        res.status(500).json({message: "Interner Serverfehler"});
    }
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

router.patch("/product/:id",
    authenticateTokenAndAuthorizeRole(["admin"]),
    (req, res, next) => {
        upload.single("bild")(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({message: "Upload-Fehler: " + err.message});
            } else if (err) {
                return res.status(400).json({message: err.message});
            }
            next();
        });
    },
    async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({message: 'Ungültige Produkt-ID'});
            }
            const produkt = await getProduktById(id);
            if (produkt.length === 0) {
                return res.status(404).json({message: 'Produkt nicht gefunden'});
            }

            let {produktname, preis, menge, kategorie, beschreibung} = req.body;
            const product = produkt[0];
            if (produktname !== undefined) product.produktname = produktname;
            if (preis !== undefined) product.preis = preis;
            if (menge !== undefined) product.menge = menge;
            if (kategorie !== undefined) product.kategorie = kategorie;
            if (beschreibung !== undefined) product.beschreibung = beschreibung;
            const erlaubteKategorien = ["supplement", "trainingsgerät", "fitnesszubehör", "sportbekleidung"];
            if (!erlaubteKategorien.includes(kategorie.toLowerCase())) {
                return res.status(400).json({
                    error: `Ungültige Kategorie. Erlaubte Kategorien sind: ${erlaubteKategorien.join(", ")}`
                });
            }
            if(menge < 1){
                product.menge = 1;
            }
            if (preis <= 0){
                product.preis = 1;
            }
            let bildFormat = "jpg";
            if(req.file !== undefined) {
                console.log(req.file);
                const alterBildPfad = path.resolve("productBilder", product.bild);
                if (fs.existsSync(alterBildPfad)) {
                    try {
                        fs.unlinkSync(alterBildPfad);
                        console.log("Altes Bild gelöscht:", alterBildPfad);
                    } catch (err) {
                        console.error("Fehler beim Löschen des alten Bilds:", err);
                        res.status(500).json({message: "Interner Serverfehler"});
                    }
                }

                const mime = req.file.mimetype;
                if (mime === "image/png") bildFormat = "png";
                else if (mime === "image/webp") bildFormat = "webp";
                else if (mime === "image/jpeg") bildFormat = "jpg";
                else if (mime === "image/jpg") bildFormat = "jpg";
                else {
                    console.warn("Unbekanntes Bildformat:", mime);
                }
            }

            await updateProdukt(
                product.produktname,
                product.preis,
                product.menge,
                product.kategorie,
                product.beschreibung,
                bildFormat,
                id,
            );
            const aktualisiertesProduktNachUpdate = await getProduktById(id);
            console.log(req.file !== undefined);
            console.log(aktualisiertesProduktNachUpdate);
            if (req.file !== undefined) {
                const absoluterBildPfad = "productBilder/" + aktualisiertesProduktNachUpdate[0].bild;
                const zielPfad = path.resolve(absoluterBildPfad);
                fs.mkdirSync(path.dirname(zielPfad), {recursive: true});
                fs.renameSync(req.file.path, zielPfad);
            }
            res.status(200).json(aktualisiertesProduktNachUpdate);
        } catch (error) {
            console.error("Fehler bei aktualisierne des Produkts:\n", error);
            res.status(500).json({message: "Interner Serverfehler"});
        }
    })

router.post('/warenkorb/add', authenticateToken, async (req, res) => {
    const {produktid, anzahl} = req.body;

    if (!produktid || !anzahl) {
        return res.status(400).json({error: 'All fields are required: warenkorbid, produktid, anzahl'});
    }

    const productidInt = parseInt(produktid);
    if (isNaN(productidInt)) {
        return res.status(400).json({message: 'Ungültige Produkt-ID'});
    }

    const anzahlInt = parseInt(anzahl);
    if (isNaN(productidInt) && anzahlInt <= 0) {
        return res.status(400).json({message: 'Ungültige anzahl'});
    }

    try {
        const product = await getProduktById(produktid);
        if (product.length === 0) {
            return res.status(404).json({message: "product not found"})
        }

        if (product[0].menge < 1) {
            return res.status(404).json({message: "product out of stock"})
        }

        if (product[0].menge < anzahlInt) {
            return res.status(400).json({message: 'Not enough products in stock'})
        }

        const warenkorb = await getWarenkorbByBenutzerId(req.jwtpayload.userid);
        const existingProduct = await getProdukteByWarenkorbid(warenkorb[0].warenkorbid);
        const productInCart = existingProduct.find(p => p.produktid === productidInt);

        if (productInCart) {
            await updateProductQuantity(warenkorb[0].warenkorbid, productidInt, anzahlInt);
            res.status(200).json({message: 'Produktanzahl im Warenkorb erhöht'});
        } else {
            const newEntry = await addProductToWarenkorb(warenkorb[0].warenkorbid, productidInt, anzahlInt);
            res.status(200).json(newEntry);
        }
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Produkts zum Warenkorb:', error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
});

router.delete('/warenkorb/:id', authenticateToken, async (req, res) => {
    const produktId = parseInt(req.params.id);
    if (isNaN(produktId) || produktId.length <= 0) {
        return res.status(400).json({message: 'Ungültige Produkt-ID'});
    }

    try {
        const warenkorb = await getWarenkorbByBenutzerId(req.jwtpayload.userid);

        const productsInCart = await getProdukteByWarenkorbid(warenkorb[0].warenkorbid);
        const productInCart = productsInCart.find(p => p.produktid === produktId);

        if (!productInCart) {
            return res.status(404).json({message: 'Produkt nicht im Warenkorb gefunden'});
        }

        const currentQuantity = productInCart.anzahl;
        const newQuantity = currentQuantity - 1;

        if (newQuantity > 0) {
            await updateProductQuantity(warenkorb[0].warenkorbid, produktId, -1);
            res.status(200).json({message: 'Produktanzahl im Warenkorb verringert'});
        } else {
            await deleteProductInWarenkorb(produktId, warenkorb[0].warenkorbid);
            res.status(200).json({message: 'Produkt aus dem Warenkorb entfernt'});
        }
    } catch (error) {
        console.error('Fehler beim Verringern der Produktanzahl im Warenkorb:', error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
});

router.get('/warenkorb/my', authenticateToken, async (req, res) => {
    const id = req.jwtpayload.userid
    if (isNaN(id)) {
        return res.status(401).json({message: 'Ungültige Benutezr-ID'});
    }

    try {
        let warenkorb = await getWarenkorbByBenutzerId(id);
        if (!warenkorb === undefined) {
            await createWarenkorb(id)
            warenkorb = await getWarenkorbByBenutzerId(id);
            if (warenkorb === undefined) {
                return res.status(500).json({message: "Warenkorb konnte nicht für den Benutzer erstellt werden"});
            }
        }
        res.status(200).json(warenkorb);
    } catch (error) {
        console.error('Fehler beim Ermitteln des Warenkorbs:', error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
});

router.get('/warenkorb/myproducts', authenticateToken, async (req, res) => {
    const id = req.jwtpayload.userid
    if (isNaN(id)) {
        return res.status(401).json({message: 'Ungültige Produkt-ID'});
    }

    try {
        let warenkorb = await getWarenkorbByBenutzerId(id);
        if (!warenkorb === undefined) {
            await createWarenkorb(id)
            warenkorb = await getWarenkorbByBenutzerId(id);
            if (warenkorb === undefined) {
                return res.status(500).json({message: "Warenkorb konnte nicht für den Benutzer erstellt werden"});
            }
        }
        const products = await getProdukteByWarenkorbid(warenkorb[0].warenkorbid);
        res.status(200).json(products);
    } catch (error) {
        console.error('Fehler beim Ermitteln des Warenkorbs:', error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
})

router.get("/kaeufe/kaufen", authenticateToken, async (req, res) => {
    try {
        const userid = req.jwtpayload.userid;
        const warenkorb = await getWarenkorbByBenutzerId(userid);
        const products = await getProdukteByWarenkorbid(warenkorb[0].warenkorbid);
        const user = await getUserById(userid);

        if (products.length === 0) {
            return res.status(400).json({message: "No products in the cart"});
        }
        for (let i = 0; i < products.length; i++) {
            if (products[i].menge < products[i].anzahl) {
                return res.status(400).json({message: "Es können nur noch: " + products[i].menge + " von " + products[i].produktname + " gekauft werden. Bitte reduziere die Anzahl der zu kaufenden Produkte im Warenkorb"});
            }
        }

        const einkauf = await createEinkauf(userid);
        let gesamtpreis = 0;
        for (let i = 0; i < products.length; i++) {
            gesamtpreis += products[i].preis * products[i].anzahl;
            await addProduktToEinkauf(einkauf[0].einkaufid, products[i].produktid, products[i].anzahl);
            const updatedProduct = products[i];
            updatedProduct.produktname = products[i].produktname;
            updatedProduct.preis = products[i].preis;
            updatedProduct.menge = products[i].menge - products[i].anzahl;
            updatedProduct.bild = products[i].bild;
            updatedProduct.kategorie = products[i].kategorie;
            updatedProduct.beschreibung = products[i].beschreibung;
            updatedProduct.produktid = products[i].produktid;

            await updateProdukt(
                updatedProduct.produktname,
                updatedProduct.preis,
                updatedProduct.menge,
                updatedProduct.kategorie,
                updatedProduct.beschreibung,
                updatedProduct.bild,
                updatedProduct.produktid,
            );

        }
        mail(user[0].email, "Fitura: Kaufbestätigung", generateOrderConfirmationTemplate(user[0].benutzername, products, gesamtpreis));

        await deleteAllProductsInWarenkorb(warenkorb[0].warenkorbid);

        return res.status(200).json({message: "Produkte gekauft"});
    } catch (error) {
        console.error("Error in /kaufen:\n" + error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
})

router.get("/kaeufe/my", authenticateToken, async (req, res) => {
    const id = req.jwtpayload.userid
    if (isNaN(id)) {
        return res.status(401).json({message: 'Ungültige Benutzer-ID'});
    }

    try {
        const einkaufe = await getEinkaeufeByBenutzer(id);
        res.status(200).json(einkaufe);
    } catch (error) {
        console.error('Fehler beim Ermitteln der Einkäufe:\n', error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }

});

router.get('/kaeufe/:einkaufid', authenticateToken, async (req, res) => {
    try {
        const einkaufid = parseInt(req.params.einkaufid)
        const benutzerid = parseInt(req.jwtpayload.userid)
        if (isNaN(einkaufid)) {
            return res.status(401).json({message: 'Ungültige Produkt-ID'});
        }
        if (isNaN(benutzerid)) {
            return res.status(401).json({message: 'Ungültige Benutzer-ID'});
        }
        const einkauefe = await getEinkaeufeByBenutzer(benutzerid);
        if (einkauefe.length === 0) {
            return res.status(400).json({message: "Keine Einkäufe gefunden für den eingeloggten Benutzer"});
        }
        let found = false;
        for (let i = 0; i < einkauefe.length; i++) {
            if (einkauefe[i].einkaufid === einkaufid) {
                found = true;
                break;
            }
        }
        if (!found) {
            return res.status(403).json({message: "Einkauf nicht gefunden oder nicht eigener."});
        }
        const products = await getProdukteByEinkauf(einkaufid);
        res.status(200).json(products);
    } catch (error) {
        console.error('Fehler beim Ermitteln des Warenkorbs:', error);
        res.status(500).json({error: 'Interner Serverfehler'});
    }
})