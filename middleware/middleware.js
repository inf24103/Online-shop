import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const authenticateTokenAndAuthorizeRole = (accessRoles) => {
    return (req, res, next) => {
        authenticateToken(req, res, () => {
            if (req.jwtpayload && accessRoles.includes(req.jwtpayload.role)) {
                next();
            } else {
                console.warn(`Middleware: Unauthorized call ${req.method} ${req.url} ${req.jwtpayload.username}`);
                res.status(403).json({message: `Access denied.`});
            }
        });
    }
}

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        try {
            req.jwtpayload = jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch (error) {
            console.error('Fehler bei der Verifizierung des JWT:', error);
            res.status(401).json({message: 'Token konnte nicht verifiziert werden'});
        }
    } else {
        res.status(401).json({message: 'Token fehlt. Bitte einloggen.'});
    }
}