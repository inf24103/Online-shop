export function generateRegistrationConfirmationTemplate(username, confirmationLink) {
    return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registrierungsbestätigung</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Registrierungsbestätigung</h1>
        </div>
        <div class="content">
            <p>Hallo ${username},</p>
            <p>Vielen Dank für Ihre Registrierung bei Fitura. Um Ihre Registrierung abzuschließen, klicken Sie bitte auf den folgenden Bestätigungslink:</p>
            <a href="${confirmationLink}" class="code">Registrierung bestätigen</a>
            <p>Wenn Sie diese Registrierung nicht durchgeführt haben, ignorieren Sie bitte diese E-Mail.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Fitura. Alle Rechte vorbehalten.</p>
        </div>
    </div>
    </body>
    </html>
    `;
}