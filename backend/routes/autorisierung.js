import express from "express";
import {getUserById} from "../datenbank/user_verwaltung/userDRL.js";
import {authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";
import {
    getAlleWunschlistenByBenutzer, getBerechtigungenByWunschlisteId,
    getEigeneWunschlistenByBenutzerId
} from "../datenbank/wunschliste_verwaltung/wunschlisteDRL.js";
import {getEinkaeufeByBenutzer} from "../datenbank/einkauf_verwaltung/einkaufDRL.js";

const router = express.Router();
// export our router to be mounted by the parent application

export default router

router.post("/", authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    let {userId, aktion, ressourceId, ressourceArt} = req.body
    userId = parseInt(userId);
    ressourceId = parseInt(ressourceId);
    if(isNaN(ressourceId)) {
        return res.status(400).json({message: "Ungültige RessourceID"})
    }
    if(isNaN(userId)) {
        return res.status(400).json({message: "Ungültige RessourceID"})
    }
    if (!userId || !aktion || !ressourceId || !ressourceArt) {
        return res.status(400).send({message: "All field are required: userId, aktion, ressourceId, ressourceArt"});
    }
    const user = await getUserById(userId);
    if (user.length === 0) {
        return res.status(404).json({message: "User not found"});
    }

    if (ressourceArt === "user") {
        if(aktion !== "read" && aktion === "delete" && aktion === "sperren" && aktion !== "entsperren") {
            res.status(403).json(false)
        }
        if (user[0].rolle === 'admin') return res.status(200).json(true);
        else if (aktion === "sperren" || aktion === "entsperren") {
            return res.status(403).json(false);
        }
        else if (ressourceId === user[0].benutzerid) return res.status(200).json(true);
        else return res.status(403).json(false);

    }
    else if (ressourceArt === "product") {
        if(aktion !== "read" && aktion !== "delete" && aktion !== "create" && aktion !== "update") {}
        if(aktion === "update" || aktion === "delete" || aktion === "create") {
            if (user[0].rolle === 'admin') return res.status(200).json(true);
            else return res.status(403).json(false);
        } else return res.status(200).json(true);
    }
    else if (ressourceArt === "wishlist") {
        if(aktion !== "read" && aktion !== "delete" && aktion !== "update" && aktion !== "authorizeUser" && aktion !== "write") {
            res.status(403).json(false);
        }
        if( aktion === "delete" || aktion === "authorizeUser") {
            const eigeneWunschlisten = await getEigeneWunschlistenByBenutzerId(userId);
            for(let i = 0; i < eigeneWunschlisten.length; i++) {
                if(eigeneWunschlisten[i].wunschlisteid === ressourceId){
                    return res.status(200).json(true);
                }
            }
            return res.status(403).json(false);
        } else if (aktion === "read"){
            const alleWunschlistenVonUser = await getAlleWunschlistenByBenutzer(userId);
            for(let i = 0; i < alleWunschlistenVonUser.length; i++) {
                if(alleWunschlistenVonUser[i].wunschlisteid === ressourceId){
                    return res.status(200).json(true);
                }
            }
            return res.status(403).json(false);
        } else if (aktion === "write" || aktion === "update") {
            const alleWunschlistenVonUser = await getAlleWunschlistenByBenutzer(userId);

            for(let i = 0; i < alleWunschlistenVonUser.length; i++) {
                if(alleWunschlistenVonUser[i].wunschlisteid === ressourceId){
                    const berechtigungen = await getBerechtigungenByWunschlisteId(alleWunschlistenVonUser[i].wunschlisteid);

                    for (let i = 0; i < berechtigungen.length; i++) {
                        if (berechtigungen[i].benutzerid === userId) {
                            const berechtigung = berechtigungen[i].berechtigung;
                            if(berechtigung === 'owner' || berechtigung === 'write') {
                                return res.status(200).json(true);
                            } else {
                                return res.status(403).json(false);
                            }
                        }
                    }
                }
            }
            return res.status(403).json(false);
        } else {
            res.send(false)
        }
    }
    else if (ressourceArt === "kauf"){
        if(aktion === "read"){
            const myEinkaeufe = await getEinkaeufeByBenutzer(userId);
            for (let i = 0; i < myEinkaeufe.length; i++) {
                if(myEinkaeufe[i].einkaufid === ressourceId){
                    return res.status(200).json(true);
                }
            }
            return res.status(403).json(false);
        }
        return res.status(403).json(false);
    }
    else {
        res.status(400).json({message: "Unknown ressourceArt"})
    }
})
