import express from "express";
import {mountRoutes} from "./routes/index.js";
const app = express()
const port = process.env.PORT || 3000

mountRoutes(app)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`)
})