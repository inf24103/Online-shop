import express from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import {createBenutzer, updateBenutzer} from "../backend/datenbank/user_verwaltung/userDML.js";
import bcrypt from 'bcrypt';
import {getUserByEmail, getUserById, getUserByUsername} from "../backend/datenbank/user_verwaltung/userDRL.js";
import {createWarenkorb} from "../backend/datenbank/produkt_verwaltung/produktDML.js";
import {mail} from "../backend/mailService/mailservice.js";
import {generateRegistrationConfirmationTemplate} from "../backend/mailService/regestrierungsBestaetigung.js";
import {generateOneTimeLoginCodeTemplate} from "../backend/mailService/oneTimeLoginCode.js";
import crypto from "crypto";
import {generateOneTimeLoginLinkTemplate} from "../backend/mailService/oneTimeLoginLink.js";
import {
    deleteLoginCode, deleteLoginToken,
    getLoginCode,
    getLoginToken,
    saveLoginCode,
    saveLoginToken
} from "../backend/datenbank/auth/authAllMethods.js";
import {authenticateTokenAndAuthorizeRole} from "../middleware/middleware.js";

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

router.post('/login/code/:code/:username', async (req, res) => {
    try {
        const code = req.params.code;
        const username = req.params.username;
        const dbCode = await getLoginCode(username, code);
        if(dbCode.length === 0){
            return res.status(401).json({ message: 'No login code found' });
        }
        if(dbCode[0].login_code !== code){
            return res.status(401).json({ message: 'Invalid login code' });
        }
        await deleteLoginCode(username, code);
        const jwtToken = createJWTToken(await getUserByUsername(username));
        res.cookie('token', jwtToken);
        return res.json({message: 'Login with code successful'});
    } catch (error) {
        console.log("Login with code failed:\n"+error);
        return res.status(500).json({ message: 'Login with code failed' });
    }
})

router.post('/login/link/:token/:username', async (req, res) => {
    try {
        const token = req.params.token;
        const username = req.params.username;
        const dbCode = await getLoginToken(username, token);
        if(dbCode.length === 0){
            return res.status(401).json({ message: 'Invalid login link.' });
        }
        if(dbCode[0].login_token !== token){
            return res.status(401).json({ message: 'Invalid login link' });
        }
        await deleteLoginToken(username, token);
        const jwtToken = createJWTToken(await getUserByUsername(username));
        res.cookie('token', jwtToken);
        return res.json({message: 'Login with link successful'});
    } catch (error) {
        console.log("Login with link failed:\n"+error);
        return res.status(500).json({ message: 'Login with link failed' });
    }
})

router.post('/login/:method/:username', async (req, res) => {
    try {
        const method = req.params.method;
        const username = req.params.username;
        const user = await getUserByUsername(username);
        if (user.length === 0) {
            return res.status(404).json({message: 'User not found'});
        }
        console.log(username, user[0].benutzerid, user[0].email, method);
        if (method === 'withcode') {
            const code = generateOneTimeLoginCode();
            await saveLoginCode(user[0].benutzername, code)
            mail(user[0].email, "Fitura: Einmaliger Anmeldecode", generateOneTimeLoginCodeTemplate(username, code))
            return res.status(200).json({message: 'Login code sent'});
        } else if (method === 'withlink') {
            const token = generateConfirmationToken(username);
            await saveLoginToken(user[0].benutzername, token)
            mail(user[0].email, "Fitura: Einmaliger Anmeldelink", generateOneTimeLoginLinkTemplate(username, "http://localhost:3000/api/auth/login/link/" + token + "/"+username))
            return res.status(200).json({message: 'Login mail sent'});
        } else {
            return res.status(401).json({message: 'Unavailable login method'});
        }
    } catch (error) {
        console.log("error at login/:method/:userid:\n" + error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
})

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

        await createBenutzer(username, lastname, firstname, email, passwordHashed, zipcode, village, street, housenumber, telephone, 'user');
        const user = await getUserByUsername(username);
        const token = createJWTToken(user);
        await createWarenkorb(user[0].benutzerid);

        mail(email, "Regestrierungsbestätigung", generateRegistrationConfirmationTemplate(username, "http://localhost:3000/api/auth/register/confirm/"+user[0].benutzerid));

        res.cookie('token', token);
        return res.json({ message: 'Register successful', user: user });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: 'Fehler beim Erstellen des Benutzers' });
    }
});

router.post('/registeradmin', authenticateTokenAndAuthorizeRole(['admin']) ,async (req, res) => {
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

        mail(email, "Regestrierungsbestätigung", generateRegistrationConfirmationTemplate(username, "http://localhost:3000/api/auth/register/confirm/"+user[0].benutzerid));

        res.cookie('token', token);
        return res.json({ message: 'Register successful', user: user });
    } catch (error) {
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
    const salt = crypto.randomBytes(16).toString('hex'); // Erzeugt einen zufälligen Salt
    return crypto.createHash('sha256').update(username + salt).digest('hex');
}

function generateOneTimeLoginCode() {
     // Erzeugt einen zufälligen 8-stelligen Hex-Code
    return crypto.randomBytes(4).toString('hex');
}