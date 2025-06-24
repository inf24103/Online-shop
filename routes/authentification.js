import express from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import {getUserById} from "../backend/datenbank/user_verwaltung/userDRL.js";

dotenv.config()
const router = express.Router();

// export our router to be mounted by the parent application
export default router

const createJWTToken = (user) => {
    return jwt.sign({ username: user.username, role: user.role, userid: user.userid }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await getUserByUsername(username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = createJWTToken(user);
        res.cookie('token', token);
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = users[1];
        const token = createJWTToken(user);
        res.cookie('token', token);
        res.json({ message: 'Register successful', user: user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.use((err, req, res) => {
    console.error("Error in authentification routing: " + err.message);
    res.status(500).send("Internal Server Error");
});
