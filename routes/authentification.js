import express from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import {createBenutzer} from "../backend/datenbank/user_verwaltung/userDML.js";
import bcrypt from 'bcrypt';
import {getUserByEmail, getUserByUsername} from "../backend/datenbank/user_verwaltung/userDRL.js";
import {createWarenkorb} from "../backend/datenbank/produkt_verwaltung/produktDML.js";

dotenv.config()
const router = express.Router();

// export our router to be mounted by the parent application
export default router

const createJWTToken = (user) => {
    return jwt.sign({ username: user[0].benutzername, role: user[0].rolle, userid: user[0].benutzerid }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

router.post('/login', async (req, res) => {
    try {
        const { username, password} = req.body;
        const user = await getUserByUsername(username);

        if (user[0] === undefined || !(await bcrypt.compare(password, user[0].passwordhash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = createJWTToken(user);
        res.cookie('token', token);
        return res.json({ message: 'Login successful' });
    } catch (error) {
        return res.status(500).json({ message: 'Login failed' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, firstname, lastname, email, telephone, village, zipcode, street, housenumber } = req.body;
        if (!username || !lastname || !firstname || !email || !password || !zipcode || !village || !street || !housenumber || !telephone) {
            return res.status(400).json({ error: 'All fields are required: username, lastname, firstname, email, password, zipcode, village, street, housenumber, telephone' });
        }

        const passwordHashed = await bcrypt.hash(password, 12);
        const usernameCheck = await getUserByUsername(username);
        const emailCheck = await getUserByEmail(email);
        if (emailCheck.length > 0 && usernameCheck.length > 0) {
            return res.status(401).json({ error: 'Email and username already exist' });
        } else if (usernameCheck.length > 0) {
            return res.status(401).json({ error: 'Username already exists' });
        } else if (emailCheck.length > 0) {
            return res.status(401).json({ error: 'Email already exists' });
        }

        await createBenutzer(username, lastname, firstname, email, passwordHashed, zipcode, village, street, housenumber, telephone, 'admin');
        const user = await getUserByUsername(username);
        const token = createJWTToken(user);

        await createWarenkorb(user[0].benutzerid);

        res.cookie('token', token);
        return res.json({ message: 'Register successful', user: user });
    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique violation error code
            return res.status(401).json({ error: 'Benutzername oder E-Mail-Adresse bereits vorhanden' });
        }
        console.log(error);
        return res.status(400).json({ error: 'Fehler beim Erstellen des Benutzers' });
    }
});
