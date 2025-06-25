import express from 'express';

import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";
import {getAllUsers, getUserById} from "../backend/datenbank/user_verwaltung/userDRL.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/all', authenticateTokenAndAuthorizeRole(['admin']), async (req, res) => {
    const users = await getAllUsers();
    return res.send(users);
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
    return res.send(user);
})

router.use((err, req, res) => {
    console.error("Error in user routing: " + err.message);
    res.status(500).send("Internal Server Error");
});