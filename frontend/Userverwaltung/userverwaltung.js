let listEl;

document.addEventListener("DOMContentLoaded", () => {
    listEl = document.querySelector(".userlist");
    const form = document.querySelector(".filter form");
    const input = form.elements.search;

    loadUserData();
})


async function loadUserData() {
    listEl.innerHTML = "Lade Benutzerdaten...";

    try {
        const res = await fetch("http://localhost:3000/api/user/all", {
            credentials: "include",
            cache: "no-store"
        });

        //Keine Berechtigung
        if(res.status === 403) {
            window.location.href = "../unauthorized/unauthorized.html";
        }
        if(!res.ok) alert("Es ist ein Fehler aufgetreten!");

        let users = await res.json();

        render(users);
    } catch (error) {
        console.log(error);
    }
}

function render (users) {
    if(users.length === 0) {
        listEl.innerHTML = "Kein User gefunden!";
        return
    }
    listEl.innerHTML = "";

    users.forEach(user => {
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
        <h3>ID ${user.benutzerid}</h3>
        <p><strong>Benutzername:</strong> ${user.benutzername}</p>
        <p><strong>Name:</strong> ${user.vorname} ${user.nachname}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>PLZ/Ort:</strong> ${user.plz} ${user.ort}</p>
        <p><strong>Straße:</strong> ${user.strasse} ${user.hausnummer}</p>
        <p><strong>Telefon:</strong> ${user.telefonnr}</p>
        <p><strong>Rolle:</strong> ${user.rolle}</p>
        <p><strong>Status:</strong> ${user.kontostatus}</p> 
        `

        const deleteBtn = document.createElement("button");

        deleteBtn.className = "delete";
        deleteBtn.title = "Delete";

        const icon_delete = document.createElement("img");

        icon_delete.src = "../pictures/muelleimer.png";
        icon_delete.alt = "löschen";
        deleteBtn.appendChild(icon_delete);
        card.appendChild(deleteBtn);

        deleteBtn.addEventListener("click", async () => {
            const ok = confirm(`Benutzer: ${user.benutzername} wirklich löschen?`);
            if(!ok) return;
            try {
                const res = await fetch(`http://localhost:3000/api/user/${user.benutzerid}`, {
                    credentials: "include",
                    method: "DELETE"
                });
                if(res.ok) {
                    card.remove();
                } else {
                    alert("Löschen fehlgeschlagen");
                }
            } catch (e) {
                console.error(e);
            }
        })

        listEl.append(card);
    });
}