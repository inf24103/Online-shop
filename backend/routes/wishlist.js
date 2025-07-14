import express from "express";
import {authenticateToken} from "../middleware/middleware.js";
import {
    addBerechtigung,
    addProduktToWunschliste,
    createWunschliste,
    deleteAllPermissionsFromWunschliste,
    deleteAllProductsFromWunschliste,
    deleteProduktFromWunschliste,
    deleteWunschliste,
    removeBenutzer,
    updateBerechtigung,
    updateBeschreibung,
    updateName
} from "../datenbank/wunschliste_verwaltung/wunschlisteDML.js";
import {getUserById, getUserByUsername} from "../datenbank/user_verwaltung/userDRL.js";
import {
    getAlleWunschlistenByBenutzer,
    getBerechtigungenByWunschlisteId,
    getEigeneWunschlistenByBenutzerId,
    getFremdeWunschlistenByBenutzer,
    getProdukteByWunschliste
} from "../datenbank/wunschliste_verwaltung/wunschlisteDRL.js";
import {getProduktById} from "../datenbank/produkt_verwaltung/produktDRL.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.post("/new", authenticateToken, async (req, res) => {
    const userid = req.jwtpayload.userid;
    try {
        const {beschreibung, name} = req.body;
        if (!name || !beschreibung) {
            return res.status(400).json({
                error: 'All fields are required: name, beschreibung'
            });
        }

        const wunschliste = await createWunschliste(beschreibung, name);
        await addBerechtigung(wunschliste[0].wunschlisteid, userid, "owner");

        return res.status(200).json(wunschliste)
    } catch (err) {
        console.log("error creating wishlist: \n", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
})

router.post("/authorize", authenticateToken, async (req, res) => {
    const userid = req.jwtpayload.userid;
    try {
        let {andererUserBenutzername, berechtigung, wunschlisteid} = req.body;
        wunschlisteid = parseInt(wunschlisteid);
        if (!andererUserBenutzername || !berechtigung || !wunschlisteid) {
            return res.status(400).json({
                error: 'All fields are required: andererUserID, berechtigung, wunschlisteid'
            });
        }

        if (berechtigung !== "read" && berechtigung !== "write") {
            return res.status(400).json({message: "Falsche Berechtigung"});
        }

        const user2 = await getUserByUsername(andererUserBenutzername);
        if (user2.length === 0) {
            return res.status(400).json({message: "Anderen Benutzer nicht gefunden"});
        }

        const wunschlisten = await getEigeneWunschlistenByBenutzerId(userid);
        let found = false;
        for (let i = 0; i < wunschlisten.length; i++) {
            if (wunschlisten[i].wunschlisteid === wunschlisteid) {
                found = true;
                break;
            }
        }

        if (!found) {
            return res.status(403).json({message: "Zugriff auf Wunschliste verweigert"});
        }

        if (user2[0].benutzerid === userid) {
            return res.status(400).json({message: "Eigene Berechtigung nicht änderbar"})
        }

        const berechtigungenWunschliste = await getBerechtigungenByWunschlisteId(wunschlisteid)

        found = false;
        for (let i = 0; i < berechtigungenWunschliste.length; i++) {
            if (berechtigungenWunschliste[i].benutzerid === user2[0].benutzerid) {
                found = true;
                break;
            }

        }
        if (found) {
            await updateBerechtigung(wunschlisteid, user2[0].benutzerid, berechtigung);
            return res.status(200).json({message: "Berechtigung des Nutzers geändert"});
        }

        await addBerechtigung(wunschlisteid, user2[0].benutzerid, berechtigung);

        return res.status(200).json({message: "Berechtigung erfolgreich hinzugefügt"});
    } catch (err) {
        console.log("error creating wishlist: \n", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
});

router.delete("/removeUser", authenticateToken, async (req, res) => {
    const userid = req.jwtpayload.userid;
    try {
        let {andererUserBenutzername, wunschlisteid} = req.body;
        wunschlisteid = parseInt(wunschlisteid);
        if (!andererUserBenutzername || !wunschlisteid) {
            return res.status(400).json({
                error: 'All fields are required: andererUserID, wunschlisteid'
            });
        }

        const user2 = await getUserByUsername(andererUserBenutzername);
        if (user2.length === 0) {
            return res.status(400).json({message: "Benutzer nicht gefunden"});
        }

        const wunschlisten = await getEigeneWunschlistenByBenutzerId(userid);
        let found = false;
        for (let i = 0; i < wunschlisten.length; i++) {
            if (wunschlisten[i].wunschlisteid === wunschlisteid) {
                found = true;
                break;
            }
        }

        if (!found) {
            return res.status(403).json({message: "Zugriff auf Wunschliste verweigert"});
        }

        if (user2[0].benutzerid === userid) {
            return res.status(400).json({message: "Man kann ich selbst nicht entfernen"})
        }

        const berechtigungenWunschliste = await getBerechtigungenByWunschlisteId(wunschlisteid)

        found = false;
        for (let i = 0; i < berechtigungenWunschliste.length; i++) {
            if (berechtigungenWunschliste[i].benutzerid === user2[0].benutzerid) {
                found = true;
                break;
            }

        }
        if (found) {
            await removeBenutzer(wunschlisteid, user2[0].benutzerid);
            return res.status(200).json({message: "Benutzer von der Wunschliste entfernt"});
        }

        return res.status(404).json({message: "Benutzer hat keinen Zugriff auf diese Wunschliste"});
    } catch (err) {
        console.log("error creating wishlist: \n", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
});

router.get("/berechtigungen/:wishlistid", authenticateToken, async (req, res) => {
    const userid = req.jwtpayload.userid;
    try {
        const wunschlisteid = parseInt(req.params.wishlistid)
        if (wunschlisteid === undefined) {
            return res.status(400).json({
                error: 'Ungültige WunschlistenId'
            });
        }

        const eigeneWishlists = await getEigeneWunschlistenByBenutzerId(userid);
        let found = false;
        for (let i = 0; i < eigeneWishlists.length; i++) {
            if (eigeneWishlists[i].wunschlisteid === wunschlisteid) {
                found = true;
                break;
            }
        }
        if (!found) {
            return res.status(403).json({message: "Kein Owner"});
        } else {
            const berechtigungenWunschliste = await getBerechtigungenByWunschlisteId(wunschlisteid)
            const newBerechtigungenWunschliste = []
            for (let i = 0; i < berechtigungenWunschliste.length; i++) {
                const user = await getUserById(berechtigungenWunschliste[i].benutzerid)
                if (userid === user[0].benutzerid) {
                    continue
                }
                newBerechtigungenWunschliste.push({
                    berechtigung: berechtigungenWunschliste[i].berechtigung,
                    benutzername: user[0].benutzername,
                    wunschlisteid: berechtigungenWunschliste[i].wunschlisteid
                });
            }
            return res.send(newBerechtigungenWunschliste);
        }
    } catch (err) {
        console.log("error creating wishlist: \n", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
});

router.get("/products/:wishlistid", authenticateToken, async (req, res) => {
    const userid = req.jwtpayload.userid;
    try {
        const wunschlisteid = parseInt(req.params.wishlistid)
        if (wunschlisteid === undefined) {
            return res.status(400).json({
                error: 'All fields are required: wunschlisteid'
            });
        }

        const wunschlisten = await getAlleWunschlistenByBenutzer(userid);
        let found = false;
        for (let i = 0; i < wunschlisten.length; i++) {
            if (wunschlisten[i].wunschlisteid === wunschlisteid) {
                found = true;
                break;
            }
        }

        if (!found) {
            return res.status(403).json({message: "Zugriff auf Wunschliste verweigert"});
        }

        const products = await getProdukteByWunschliste(wunschlisteid)
        res.send(products)
    } catch (err) {
        console.log("error creating wishlist: \n", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
});

router.get("/my", authenticateToken, async (req, res) => {
    const wunschlisten = await getEigeneWunschlistenByBenutzerId(req.jwtpayload.userid);
    return res.send(wunschlisten);
})

router.get("/others", authenticateToken, async (req, res) => {
    const wunschlisten = await getFremdeWunschlistenByBenutzer(req.jwtpayload.userid);
    for (let i = 0; i < wunschlisten.length; i++) {
        const berechtigungen = await getBerechtigungenByWunschlisteId(wunschlisten[i].wunschlisteid)
        for (let j = 0; j < berechtigungen.length; j++) {
            if (berechtigungen[j].berechtigung === 'owner') {
                const owner = await getUserById(berechtigungen[j].benutzerid);
                wunschlisten[i].ownerUsername = owner[0].benutzername
                break
            }
        }
    }
    return res.send(wunschlisten);
})

router.post("/update", authenticateToken, async (req, res) => {
    try {
        let {inhalt, aktion, wunschlisteid} = req.body;
        if (!inhalt || !aktion || !wunschlisteid) {
            return res.status(400).json({
                error: 'All fields are required: inhalt, aktion, wunschlisteid'
            });
        }
        wunschlisteid = parseInt(wunschlisteid);
        if (isNaN(wunschlisteid)) {
            return res.status(400).json({message: "Ungültige wunschlisteid"});
        }
        if (aktion !== "addProdukt" && aktion !== "removeProdukt" && aktion !== "updateName" && aktion !== "updateBeschreibung") {
            return res.status(400).json({message: "Ungültige Aktion. Gültige Aktionen: addProdukt, removeProdukt, updateName, updateBeschreibung"});
        }

        const userid = req.jwtpayload.userid;
        const berechtigteWunschlisten = await getAlleWunschlistenByBenutzer(userid);
        let wunschliste = undefined;
        for (let i = 0; i < berechtigteWunschlisten.length; i++) {
            if (berechtigteWunschlisten[i].wunschlisteid === wunschlisteid) {
                wunschliste = berechtigteWunschlisten[i];
                break;
            }
        }

        if (wunschliste === undefined) {
            return res.status(404).json({message: "Wunschliste nicht gefunden. Benutzer möglicherweise nicht berechtigt"});
        }
        const berechtigungenWunschliste = await getBerechtigungenByWunschlisteId(wunschlisteid);

        let berechtigung = undefined;
        for (let i = 0; i < berechtigungenWunschliste.length; i++) {
            if (berechtigungenWunschliste[i].benutzerid === userid) {
                berechtigung = berechtigungenWunschliste[i].berechtigung;
                break;
            }
        }
        if (berechtigung === undefined) {
            res.status(400).json({message: "Benutzer nicht berechtigt"});
        }

        if (berechtigung !== "owner" && berechtigung !== "write") {
            res.status(403).json({message: "Falsche Berechtigung"})
        }
        if(aktion === "addProdukt" || aktion === "removeProdukt") {
            const productID = parseInt(inhalt)
            if (isNaN(productID)) {
                return res.status(400).json({message: "Ungültige Produktid"});
            }
            const product = await getProduktById(productID);
            if (product.length === 0) {
                res.status(404).json({message: "Produkt nicht gefunden"});
            }
            const produkteWunschliste = await getProdukteByWunschliste(wunschlisteid);
            if (aktion === "addProdukt") {
                for (let i = 0; i < produkteWunschliste.length; i++) {
                    if (produkteWunschliste[i].produktid === productID) {
                        return res.status(400).json({message: "Produkt bereits in der Wunschliste"})
                    }
                }
                await addProduktToWunschliste(wunschlisteid, productID);
                return res.status(200).json({message: "Produkt erfolgreich hinzugefügt"});
            } else if (aktion === "removeProdukt") {
                let found = false;
                for (let i = 0; i < produkteWunschliste.length; i++) {
                    if (produkteWunschliste[i].produktid === productID) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    await deleteProduktFromWunschliste(wunschlisteid, productID);
                    return res.status(200).json({message: "Produkt erfolgreich entfernt"});
                }
                return res.status(400).json({message: "Produkt nicht in der Wunschliste"});
            }
        } else if(aktion === "updateBeschreibung") {
            await updateBeschreibung(wunschlisteid,inhalt);
            return res.status(200).json({message: "Beschreibung erfolgreich geändert"});
        } else if (aktion === "updateName") {
            await updateName(wunschlisteid,inhalt);
            return res.status(200).json({message: "Name erfolgreich geändert"});
        }
    } catch (error) {
        console.error("err in wishlist add/remove: \n", error);
        res.status(500).json({message: "Internal Server Error"});
    }
})

router.delete("/delete", authenticateToken, async (req, res) => {
    const userid = req.jwtpayload.userid;
    let {wunschlisteid} = req.body;
    if (!wunschlisteid) {
        return res.status(400).json({
            error: 'All fields are required: productID, aktion, wunschlisteid'
        });
    }
    wunschlisteid = parseInt(wunschlisteid);
    if (isNaN(wunschlisteid)) {
        return res.status(400).json({message: "Ungültige WUnschlistenID"})
    }
    try {
        const eigeneWishlists = await getEigeneWunschlistenByBenutzerId(userid)
        if (eigeneWishlists.length === 0) {
            return res.status(403).json({message: "Kein Owner"})
        }
        let found = false;
        for (let i = 0; i < eigeneWishlists.length; i++) {
            if (eigeneWishlists[i].wunschlisteid === wunschlisteid) {
                found = true;
                break;
            }
        }
        if (!found) {
            return res.status(403).json({message: "Kein Owner"})
        }
        await deleteAllProductsFromWunschliste(wunschlisteid);
        await deleteAllPermissionsFromWunschliste(wunschlisteid);
        await deleteWunschliste(wunschlisteid);
        res.status(200).json({message: "Wunschliste erfolgreich entfernt"})

    } catch (err) {
        console.log("Error deleting wunschliste:\n", err);
        return res.status(500).json({message: "Internal Server Error"});
    }
})