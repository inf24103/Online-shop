import user from './user.js'

export const mountRoutes = (app) => {
    app.use('/api/user', user);
}