import dotenv from 'dotenv';

dotenv.config();

export const authenticateAndRequireRole = (requiredRole) => {
    return (req, res, next) => {
        authenticateToken(req, res, (err) => {
            if (err) {
                return next(err);
            }
            if (req.user && req.user.role === requiredRole) {
                next();
            } else {
                console.warn(`Middleware: Unauthorized call ${req.method} ${req.url}`);
                res.status(403).send(`Access denied.`);
            }
        });
    }
}

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({message: 'Token ist ungültig'});
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({message: 'Token fehlt. Bitte einloggen.'});
    }
}