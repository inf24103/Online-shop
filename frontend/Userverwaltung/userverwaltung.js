let listEl;
let form;
let inputId;
let inputName;
let inputStatus;
let resetBtn;

document.addEventListener("DOMContentLoaded", () => {
    listEl = document.querySelector(".userlist");
    form = document.querySelector(".filter form");
    inputId = form.elements.searchId;
    inputName = form.elements.searchName;
    inputStatus = form.elements.searchStatus;
    resetBtn = document.getElementById("reset-filter");

    loadUserData();

    form.addEventListener("submit", handleSearch);
    resetBtn.addEventListener("click", () => {
        form.reset();
        loadUserData();
    })

})

async function loadUserData(filtered = false) {
    listEl.innerHTML = "Lade Benutzerdaten...";

    try {
        const res = await fetch("http://localhost:3000/api/user/all", {
            credentials: "include",
            cache: "no-store"
        });

        if(!res.ok) zeigeToast("Es ist ein Fehler aufgetreten!", "error");

        const users = await res.json();

        if (filtered) {
            const id = inputId.value.trim();
            const name = inputName.value.trim().toLowerCase();
            const status = inputStatus.value;

            const gefiltert = users.filter(user => {
                const matchId = id === "" || user.benutzerid.toString() === id;
                const matchName = name === "" || (
                    user.benutzername.toLowerCase().includes(name) ||
                    user.vorname.toLowerCase().includes(name) ||
                    user.nachname.toLowerCase().includes(name)
                );
                const matchStatus = status === "" || user.kontostatus.toLowerCase() === status;

                return matchId && matchName && matchStatus;
            });

            render(gefiltert);
        } else {
            render(users);
        }

    } catch (error) {
        console.log(error);
        listEl.textContent = "Fehler beim Laden!";
    }
}

function render (users) {
    if(users.length === 0) {
        listEl.innerHTML = "Kein User gefunden!";
        return;
    }
    listEl.innerHTML = "";

    users.forEach(user => {
        const card = document.createElement("div");
        card.className = "user-card";


        if(user.kontostatus?.toLowerCase() === "gesperrt") {
            card.classList.add("gesperrt");
        }


        card.innerHTML = `
        <h3>ID ${user.benutzerid}</h3>
        <p><strong>Benutzername:</strong> ${user.benutzername}</p>
        <p><strong>Name:</strong> ${user.vorname} ${user.nachname}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>PLZ/Ort:</strong> ${user.plz} ${user.ort}</p>
        <p><strong>Straße:</strong> ${user.strasse} ${user.hausnummer}</p>
        <p><strong>Telefon:</strong> ${user.telefonnr}</p>
        <p><strong>Rolle:</strong> ${user.rolle}</p>
        <p class="status"><strong>Status:</strong> ${user.kontostatus}</p>
        `

        //Löschen Button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete";
        deleteBtn.title = "Delete";
        const icon_delete = document.createElement("img");
        icon_delete.src = "../pictures/muelleimer.png";
        icon_delete.alt = "löschen";

        const btnRow = document.createElement("div");
        btnRow.className = "btn-row";
        card.appendChild(btnRow);

        deleteBtn.appendChild(icon_delete);
        card.appendChild(deleteBtn);

        //Sperren/Entsperren Button
        const lockBtn = document.createElement("button");
        lockBtn.className = "sperren";

        //Überprüfen, ob User gesperrt ist
        const istGesperrt = user.kontostatus?.toLowerCase() === "gesperrt";

        //Icon und Titel setzen
        lockBtn.title = istGesperrt ? "Benutzer entsperren" : "Benutzer sperren";
        lockBtn.innerHTML = `<img src="../pictures/sperr_icon.png" alt="${istGesperrt ? "Entsperren" : "Sperren"}">`;

        lockBtn.addEventListener("click", async () => {
            const aktion = istGesperrt ? "entsperren" : "sperren";

            const endpoint = istGesperrt
                ? `http://localhost:3000/api/user/unblock/${user.benutzerid}`
                : `http://localhost:3000/api/user/block/${user.benutzerid}`;

            try {
                const res = await fetch(endpoint, {
                    method: "PUT",
                    credentials: "include"
                });

                if (res.ok) {
                    //Status aktualisieren
                    const statusEl = card.querySelector(".status");
                    if (statusEl) {
                        statusEl.innerHTML = `<strong>Status:</strong> ${istGesperrt ? "entsperrt" : "gesperrt"}`;
                    }

                    if (istGesperrt) {
                        card.classList.remove("gesperrt");
                        lockBtn.title = "Benutzer sperren";
                    } else {
                        card.classList.add("gesperrt");
                        lockBtn.title = "Benutzer entsperren";
                    }

                    const iconImg = lockBtn.querySelector("img");
                    if (iconImg) {
                        iconImg.alt = istGesperrt ? "Sperren" : "Entsperren";
                    }

                    // Seite neu laden, um aktuellen Status korrekt darzustellen
                    loadUserData();
                } else {
                    zeigeToast(`${aktion.charAt(0).toUpperCase() + aktion.slice(1)} fehlgeschlagen`, "error");
                }
            } catch (e) {
                console.error(e);
            }
        });

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
                    zeigeToast("Löschen fehlgeschlagen", "error");
                }
            } catch (e) {
                console.error(e);
            }
        })

        btnRow.append(lockBtn, deleteBtn);
        card.appendChild(btnRow);
        listEl.append(card);
    });
}

async function handleSearch(e) {

    e.preventDefault();
    loadUserData(true);

}

//Modal öffnen / schließen
document.getElementById("open-admin-modal").addEventListener("click", () => {
    document.getElementById("admin-modal").classList.remove("hidden");
});

document.getElementById("close-admin-modal").addEventListener("click", () => {
    document.getElementById("admin-modal").classList.add("hidden");
});

//Admin erstellen
async function createAdmin() {
    const form = document.getElementById("admin-form");
    const data = {
        username: form.username.value.trim(),
        firstname: form.firstname.value.trim(),
        lastname: form.lastname.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value.trim(),
        street: form.street.value.trim(),
        housenumber: form.housenumber.value.trim(),
        zipcode: form.zipcode.value.trim(),
        village: form.village.value.trim(),
        telephone: form.telephone.value.trim()
    };

    try {

        const res = await fetch("http://localhost:3000/api/auth/registeradmin", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if(res.ok) {
            zeigeToast("Admin erfolgreich erstellt", "success");

            document.getElementById("admin-modal").classList.add("hidden");
            form.reset();
            loadUserData();
        } else {

            zeigeToast("Fehler beim Erstellen des Admins", "error");

        }

    } catch (e) {
        console.error(e);
        zeigeToast("Fehler beim Erstellen des Admins", "error");
    }
}

document.getElementById("admin-form").addEventListener("submit", async e => {
    e.preventDefault();
    await createAdmin();
})