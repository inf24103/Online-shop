import express from 'express';
import {getAllUsers, getUserById} from "../backend/datenbank/user_verwaltung/userDRL.js";
import {authenticateToken, requireRole} from "../middleware/middleware.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/all', async (req, res) => {
    const rows = await getAllUsers()
    res.send(rows)
})

router.get('/:id', authenticateToken, requireRole( 'admin'),async (req, res) => {
    const id = parseInt(req.params.id)
    const rows = await getUserById(id)
    res.send(rows)
})

router.use((err, req, res, next) => {
    console.error("Error in user routing: " + err.message);
    res.status(403).send(err.message);
});