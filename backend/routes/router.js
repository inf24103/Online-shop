import user from './user.js'
import authentification from './authentification.js'
import inventory from "./inventory.js";
import wishlist from "./wishlist.js";
import autorisierung from "./autorisierung.js";

export const mountRoutes = (app) => {
    app.use('/api/user', user);
    app.use('/api/auth', authentification);
    app.use('/api/inv', inventory);
    app.use('/api/wun', wishlist);
    app.use('/api/auto', autorisierung);
}