const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.send('Hello World!')

    // shutdown the server
    process.exit(0)
})

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`)
})