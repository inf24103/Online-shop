export function generateOneTimeLoginCodeTemplate(username, loginCode) {
    return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Einmaliger Login-Code</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Einmaliger Login-Code</h1>
        </div>
        <div class="content">
            <p>Hallo ${username},</p>
            <p>Ihr einmaliger Login-Code lautet:</p>
            <span class="code">${loginCode}</span>
            <p>Bitte verwenden Sie diesen Code, um sich bei Ihrem Konto anzumelden.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Fitura. Alle Rechte vorbehalten.</p>
        </div>
    </div>
    </body>
    </html>
    `;
}