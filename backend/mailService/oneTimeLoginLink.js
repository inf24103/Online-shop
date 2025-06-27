export function generateOneTimeLoginLinkTemplate(username, loginLink) {
    return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Einmaliger Login-Link</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Einmaliger Login-Link</h1>
        </div>
        <div class="content">
            <p>Hallo ${username},</p>
            <p>Um sich bei Ihrem Konto anzumelden, klicken Sie bitte auf den folgenden Link:</p>
            <a href="${loginLink}" class="code">Login</a>
        </div>
        <div class="footer">
            <p>&copy; 2025 Fitura. Alle Rechte vorbehalten.</p>
        </div>
    </div>
    </body>
    </html>
    `;
}