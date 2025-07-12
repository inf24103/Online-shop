async function loadProfile() {
    const profileArea = document.getElementById("profile-content");
    const extraArea = document.getElementById("profile-extra");

    profileArea.innerHTML = "Lade Profil...";
    extraArea.innerHTML = "Lade Informationen...";

    try {
        const res = await fetch("http://localhost:3000/api/user/me", {
            credentials: "include",
            cache: "no-cache",
        });

        if(res.status === 401) {
            profileArea.innerHTML = "<p>Logge dich ein, damit du deine Benutzerdaten anzeigen kannst!</p>";
            extraArea.innerHTML = "";
            return;
        }
        if(!res.ok) {
            profileArea.innerHTML = "<p>Dein Profil konnte nicht geladen werden! </p>";
            extraArea.innerHTML = "";
            return;
        }

        const [user] = await res.json();

        let rolle;
        if(user.rolle === "admin") {
            rolle = "<span style='color:red'>Admin</span>"
        } else {
            rolle = "<span style='color:dodgerblue'>User</span>"
        }

        let gesperrt;
        if(user.kontostatus === "gesperrt") {
            gesperrt = "<span style='color:red'>Ja</span>"
        } else {
            gesperrt = "<span style='color:dodgerblue'>Nein</span>"
        }

        profileArea.innerHTML = `
        <h2>Profil von ${user.vorname} ${user.nachname}</h2>
        <p><strong>Benutzername:</strong> ${user.benutzername}</p>
        <p><strong>E-Mail:</strong> ${user.email}</p>
        <p><strong>Telefon:</strong> ${user.telefonnr}</p>
        <p><strong>Adresse:</strong> ${user.strasse} ${user.hausnummer}, ${user.plz} ${user.ort}</p>
        <p><strong>Rolle:</strong> ${rolle}</p>
        <p><strong>Geperrt:</strong> ${gesperrt}</p>
        <div class="btn-row">
            <button id="logout-btn" class="btn">Logout</button>
            <button id="back" class="btn" onclick="history.back()">← Zurück</button>
        </div>
        `;

        const [ordersRes, cartRes] = await Promise.all([
            fetch("http://localhost:3000/api/inv/kaeufe/my", { credentials: "include" }),
            fetch("http://localhost:3000/api/inv/warenkorb/myproducts", { credentials: "include" }),
        ]);

        let orderHTML = "<p>Bestellungen konnten nicht geladen werden</p>";
        let cardHTML = "<p>Warenkorb konnte nicht geladen werden.</p>";

        if(ordersRes.ok) {
            const orders = await ordersRes.json();
            if(orders.length === 0) {
                orderHTML = "Es sind noch keine Bestellungen vorhanden.";
            } else {
                orderHTML = `<ul>${orders.map(o => `<li>Bestellung #${o.id} vom ${new Date(orders.datum).toLocaleDateString()}</li>`).join("")}</ul>`;
            }
        }

        if (cartRes.ok) {
            const cart = await cartRes.json();  // <--- DAS muss korrekt sein
            if (Array.isArray(cart) && cart.length === 0) {
                cardHTML = "<p>Dein Warenkorb ist leer</p>";
            } else {
                cardHTML = `<ul>${cart.map(p =>
                    `<li>${p.produktname} (x${p.anzahl}) – ${parseFloat(p.preis).toFixed(2)}€</li>`
                ).join("")}</ul>`;
            }
        }


        extraArea.innerHTML = `
            <h2>Bestellungen</h2>
            ${orderHTML}
            <h2>Warenkorb</h2>
            ${cardHTML}
            `;

        document.getElementById("logout-btn").addEventListener("click", async () => {
            try {
                await fetch("http://localhost:3000/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                });
                window.location.href = "../user/index.html";
            } catch (error) {
                console.error("Logout fehlgeschlagen", error);
            }
        })

    } catch (e) {
        console.error(e);
        profileArea.innerHTML = "<p> Es ist ein Fehler aufgetreten!</p>";
    }
}

window.addEventListener("DOMContentLoaded", loadProfile);