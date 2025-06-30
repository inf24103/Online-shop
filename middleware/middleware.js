import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {getUserById} from "../backend/datenbank/user_verwaltung/userDRL.js";

dotenv.config();

export const authenticateTokenAndAuthorizeRole = (accessRoles) => {
    return (req, res, next) => {
        authenticateToken(req, res, () => {
            if (req.jwtpayload && accessRoles.includes(req.jwtpayload.role)) {
                next();
            } else {
                console.warn(`Middleware: Unauthorized call ${req.method} ${req.url}, user: ${req.jwtpayload.username}`);
                res.status(403).json({message: `Access denied.`});
            }
        }).then(r => next);
    }
}

export const authenticateToken = async (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        try {
            req.jwtpayload = jwt.verify(token, process.env.JWT_SECRET);
            const user = await getUserById(req.jwtpayload.userid);

            if(user.length === 0){
                return res.status(403).json({message: `Old token. User does not exist.`});
            }
            if(user[0].kontostatus === 'gesperrt'){
                return res.status(403).json({message: `Konto von Admin gesperrt.`});
            }
            if(user[0].authentifizierung === false){
                return res.status(403).json({message: `Konto nicht bestätigt. Bitte auf bestätigungslink klicken`});
            }
            next();
        } catch (error) {
            console.error('Fehler bei der Verifizierung des JWT:', error);
            return res.status(401).json({message: 'Token konnte nicht verifiziert werden. Bitte einloggen.'});
        }
    } else {
        return res.status(401).json({message: 'Token fehlt. Bitte einloggen.'});
    }
}