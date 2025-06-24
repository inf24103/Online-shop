import express from "express";
import morgan from "morgan";
import {mountRoutes} from "./routes/router.js";
import cookieParser from "cookie-parser";

const app = express()
const port = process.env.PORT || 3000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// configure logging before each api call
morgan.token('source', function () {
    return 'Morgan:';
});
const customFormat = ':source :method :url :status :res[content-length] - :response-time ms';
app.use(morgan(customFormat));

mountRoutes(app);

// Globales abfangen unbehandelter Fehler
app.use((err, req, res, next) => {
    console.error("Server: Es ist ein unbehandelter Fehler aufgetreten: " + err.stack);
    res.status(500).json({
        error: 'Ein Fehler ist aufgetreten!'
    });
    next();
});

app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`)
})