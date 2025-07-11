import express from 'express';

import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";
import {getAllUsers, getUserById} from "../datenbank/user_verwaltung/userDRL.js";
import {deleteBenutzer, updateBenutzer} from "../datenbank/user_verwaltung/userDML.js";
import {
    createWarenkorb,
    deleteAllProductsInWarenkorb,
    deleteWarenkorb
} from "../datenbank/produkt_verwaltung/produktDML.js";
import {
    getWarenkorbByBenutzerId
} from "../datenbank/produkt_verwaltung/produktDRL.js";
import {deleteEinkaeufeByBenutzer} from "../datenbank/einkauf_verwaltung/einkaufDML.js";
import {
    getEigeneWunschlistenByBenutzerId,
    getFremdeWunschlistenByBenutzer
} from "../datenbank/wunschliste_verwaltung/wunschlisteDRL.js";
import {
    deleteAllPermissionsFromWunschliste,
    deleteAllProductsFromWunschliste, deleteWunschliste, removeBenutzer
} from "../datenbank/wunschliste_verwaltung/wunschlisteDML.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/all', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const users = await getAllUsers();
    res.send(users);
})

router.get('/me', authenticateToken, async (req, res) => {
    const id = req.jwtpayload.userid;
    const user = await getUserById(id);

    if(user.length === 0){
        return res.status(401).json({message: 'No user found.'})
    } else if(user.length > 1){
        return res.status(401).json({message: 'Multiple users found.'})
    }
    res.send(user);
})

router.get('/:id', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    if(isNaN(req.params.id)){
        return res.status(403).json({message: 'Ungültige userid'})
    }
    const userid= req.params.id;
    const user = await getUserById(userid);
    res.status(200).json({user});
})

router.delete('/:id', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const userid = parseInt(req.params.id);
    if(isNaN(userid)){
        return res.status(403).json({message: 'Invalid id'})
    }
    if(userid === req.jwtpayload.userid){
        return res.status(401).json({message: 'Can not delete your self.'})
    }
    try {
        const user = await getUserById(userid);
        if(user.length === 0){
            return res.status(403).json({message: 'No user found.'})
        }
        const warenkorb = await getWarenkorbByBenutzerId(userid);
        const warenkorbid = warenkorb[0].warenkorbid;
        const wishlists = await getEigeneWunschlistenByBenutzerId(userid);
        for (let i = 0; i < wishlists.length; i++) {
            const wischlistid = wishlists[i].wunschlisteid;
            await deleteAllProductsFromWunschliste(wischlistid);
            await deleteAllPermissionsFromWunschliste(wischlistid);
            await deleteWunschliste(wischlistid);
        }
        const fremdeWishlist = await getFremdeWunschlistenByBenutzer(userid);
        for (let i = 0; i < fremdeWishlist.length; i++) {
            const wischlistid = fremdeWishlist[i].wunschlisteid;
            await removeBenutzer(wischlistid, userid);
        }
        await deleteAllProductsInWarenkorb(warenkorbid);
        await deleteWarenkorb(userid);
        await deleteEinkaeufeByBenutzer(userid);
        await deleteBenutzer(userid);
        const benuterNachLoeschung = await getUserById(userid);
        if(benuterNachLoeschung.length > 0) {
            const warenkorb = await createWarenkorb(benuterNachLoeschung[0].benutzerid);
            return res.status(400).json({message: 'Benutzer konnte nicht gelöscht werden', warenkorb: warenkorb});
        }
        if (benuterNachLoeschung.length === 0) {
            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.put('/block/:id', authenticateTokenAndAuthorizeRole(['admin']),async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if(isNaN(userId)){
            return res.status(403).json({message: 'Invalid id'})
        }
        const user = await getUserById(userId);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if(userId === req.jwtpayload.userid){
            return res.status(403).json({message: 'Can\'t block your self.'})
        }

        user[0].kontostatus = 'gesperrt';
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

        return res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        return res.status(500).json({ message: 'Failed to block user' });
    }
});

router.put('/unblock/:id', authenticateTokenAndAuthorizeRole(['admin']),async (req, res) => {
    try {
        const userId = req.params.id;
        if(isNaN(userId)){
            return res.status(403).json({message: 'Invalid id'})
        }
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user[0].kontostatus = 'entsperrt';
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

        return res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        return res.status(500).json({ message: 'Failed to unblock user' });
    }
});