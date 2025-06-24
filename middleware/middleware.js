import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const authenticateTokenAndAuthorizeRole = (accessRoles) => {
    return (req, res, next) => {
        authenticateToken(req, res, () => {
            if (req.jwtpayload && accessRoles.includes(req.jwtpayload.role)) {
                next();
            } else {
                console.warn(`Middleware: Unauthorized call ${req.method} ${req.url}`);
                res.status(403).send(`Access denied.`);
            }
        });
    }
}

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
            if (err) {
                return res.status(403).json({error: 'Token ist ungültig'});
            }
            req.jwtpayload = payload;
            next();
        });
    } else {
        res.status(401).json({error: 'Token fehlt. Bitte einloggen.'});
    }
}