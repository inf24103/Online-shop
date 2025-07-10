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

        extraArea.innerHTML = `
            <h2>Bestellungen und Warenkorb</h2>
            <p>Du hast aktuell keine Bestellungen.</p>
            <p>Dein Warenkorb ist leer</p>
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