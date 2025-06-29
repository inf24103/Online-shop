export function generateOrderConfirmationTemplate(username, products, totalPrice) {
    const productListHTML = products.map(product => `
        <li>
            <h2>${product.produktname}</h2>
            <p><strong>Preis:</strong> ${product.preis} €</p>
            <p><strong>Anzahl:</strong> ${product.anzahl}</p>
            <p><strong>Kategorie:</strong> ${product.kategorie}</p>
        </li>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bestellbestätigung</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Bestellbestätigung</h1>
        </div>
        <div class="content">
            <p>Hallo ${username},</p>
            <p>Vielen Dank für Ihre Bestellung bei Fitura. Hier sind die Details Ihrer Bestellung:</p>
            <ul class="product-list">
                ${productListHTML}
            </ul>
            <p class="total-price"><strong>Gesamtpreis:</strong> ${totalPrice} €</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Fitura. Alle Rechte vorbehalten.</p>
        </div>
    </div>
    </body>
    </html>
    `;
}