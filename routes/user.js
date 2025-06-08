import express from 'express';
import {getAllUsers, getUserById} from "../backend/datenbank/user_verwaltung/userDRL.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/all', async (req, res) => {
    const rows = await getAllUsers()
    res.send(rows)
})

router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    const rows = await getUserById(id)
    res.send(rows)
})