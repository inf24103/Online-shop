import express from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import {createBenutzer, updateBenutzer} from "../backend/datenbank/user_verwaltung/userDML.js";
import bcrypt from 'bcrypt';
import {getUserByEmail, getUserById, getUserByUsername} from "../backend/datenbank/user_verwaltung/userDRL.js";
import {createWarenkorb} from "../backend/datenbank/produkt_verwaltung/produktDML.js";
import {mail} from "../backend/mailService/mailservice.js";
import {generateRegistrationConfirmationTemplate} from "../backend/mailService/regestrierungsBestaetigung.js";

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
        console.log(user);
        console.log("." + user[0].benutzerid + ".");
        console.log("."+user.benutzerid+".");

        await createWarenkorb(user[0].benutzerid);

        mail(user[0].email, "Regestrierungsbestätigung", generateRegistrationConfirmationTemplate(user[0].benutzername, "http://localhost:3000/api/auth/register/confirm/"+user[0].benutzerid));

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

router.get('/register/confirm/:userid', async (req, res) => {
    const userid = req.params.userid;
    if(isNaN(userid)){
        res.status(403).json("Invalid userid")
    }
    const user = await getUserById(userid);
    if(user.length === 0){
        return res.status(404).json("User not found");
    }
    if(user[0].authentifizierung === false){
        user[0].authentifizierung = true;
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
        res.status(200).json({message: "user successfully authentifizieren"});
    } else {
        return res.status(403).json("User already authentifiziert")
    }
})

function generateConfirmationToken(username) {
    return crypto.createHash('sha256').update(username).digest('hex');
}