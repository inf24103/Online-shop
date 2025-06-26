import express from 'express';

import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";
import {getAllUsers, getUserById} from "../backend/datenbank/user_verwaltung/userDRL.js";
import {deleteBenutzer} from "../backend/datenbank/user_verwaltung/userDML.js";
import {
    createWarenkorb,
    deleteProdukteWarenkorb,
    deleteWarenkorb
} from "../backend/datenbank/produkt_verwaltung/produktDML.js";
import {
    getProdukteByWarenkorbid,
    getWarenkorbByBenutzerId
} from "../backend/datenbank/produkt_verwaltung/produktDRL.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/all', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const users = await getAllUsers();
    res.send(users);
})

router.get('/me', authenticateToken, async (req, res) => {
    const id = req.jwtpayload.userid;
    console.log(req.jwtpayload);
    const user = await getUserById(id);

    if(user.length === 0){
        return res.status(401).json({message: 'No user found.'})
    } else if(user.length > 1){
        return res.status(401).json({message: 'Multiple users found.'})
    }
    res.send(user);
})

router.delete('/:id', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const userid = parseInt(req.params.id);
    if(isNaN(userid)){
        res.status(403).json({message: 'Invalid id'})
    }
    if(userid === req.jwtpayload.userid){
        return res.status(401).json({message: 'Can not delete your self.'})
    }
    try {
        const warenkorb = await getWarenkorbByBenutzerId(userid);
        const warenkorbid = warenkorb[0].warenkorbid;
        await deleteProdukteWarenkorb(warenkorbid);
        await deleteWarenkorb(userid);
        await deleteBenutzer(userid);
        const benuterNachLoeschung = await getUserById(userid);
        if(benuterNachLoeschung.length > 0) {
            const warenkorb = await createWarenkorb(benuterNachLoeschung.benutzerid);
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