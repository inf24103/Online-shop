import express from 'express';

import {authenticateToken, authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.get('/all', authenticateTokenAndAuthorizeRole(['admin']), (req, res) => {
    //const rows = await getAllUsers()
    res.send("rows")
})

router.get('/me', authenticateToken, async (req, res) => {
    const id = parseInt(req.params.id)
    //const user = await getUserById(id)
    res.send("user")
})

router.use((err, req, res) => {
    console.error("Error in user routing: " + err.message);
    res.status(500).send("Internal Server Error");
});