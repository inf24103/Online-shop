export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.user && req.user.role === requiredRole) {
            next();
        } else {
            console.warn(`Middleware: Unauthorized call ${req.method} ${req.url}`);
            res.status(403).send(`Access denied.`);
            next();
        }
    }
}

export const authenticateToken = (req, res, next) => {

    /* sieht vllt. so aus
    const token = req.header('Authorization')?.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token ist ungültig' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Token fehlt' });
    }
    */

    // Wenn alles erfolgreich
    next();
}