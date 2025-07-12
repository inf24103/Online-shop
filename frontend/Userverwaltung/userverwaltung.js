let listEl;
let form;
let input;
let resetBtn;

document.addEventListener("DOMContentLoaded", () => {
    listEl = document.querySelector(".userlist");
    form = document.querySelector(".filter form");
    input = form.elements.search;
    resetBtn = document.getElementById("reset-filter");

    loadUserData();

    form.addEventListener("submit", handleSearch);
    resetBtn.addEventListener("click", () => {
        form.reset();
        loadUserData();
    })

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
            return;
        }
        if(!res.ok) alert("Es ist ein Fehler aufgetreten!");

        const users = await res.json();

        render(users);

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
        lockBtn.title = "Benutzer sperren";
        lockBtn.innerHTML = `<img src="../pictures/sperr_icon.png" alt="Sperren">`;
        lockBtn.addEventListener("click", async () => {
            const ok = confirm("Benutzer sperren?");
            if(!ok) return;
            try {
                const res = await fetch(`http://localhost:3000/api/user/block/${user.benutzerid}`, {
                    method: "PUT",
                    credentials: "include"
                });
                if(res.ok) {
                    card.querySelector("p:last-of-type").textContent = "Status: gesperrt";
                } else {
                    alert("Sperren fehlgeschlagen");
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
                    alert("Löschen fehlgeschlagen");
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
    const id = input.value.trim();

    if(id === "") {
        loadUserData();
        return;
    }

    listEl.textContent = "Suche...";

    try {
        const res = await fetch(`http://localhost:3000/api/user/${id}`, {
            credentials: "include"
        });

        if(res.status === 404) {
            listEl.textContent = "Es wurde kein Benutzer gefunden";
            return;
        }
        if(!res.ok) {
            listEl.textContent = "Es ist ein Fehler aufgetreten";
            return;
        }

        const data = await res.json();
        const users = data.user;
        render(users)


    } catch (e) {
        console.error(e);
        listEl.textContent = "Fehler bei der Suche";
    }

}