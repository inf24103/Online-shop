let currentBearbeiteId = null;

async function loadWunschlisten() {
    const eigene = document.getElementById("eigene-wunschlisten");
    const geteilte = document.getElementById("geteilte-wunschlisten");

    try {
        const [eigeneRes, geteilteRes] = await Promise.all([
            fetch("http://localhost:3000/api/wun/my", {credentials: "include"}),
            fetch("http://localhost:3000/api/wun/others", {credentials: "include"})
        ]);

        const eigeneListen = await eigeneRes.json();
        const geteilteListen = await geteilteRes.json();

        eigene.innerHTML = "<h2>Meine Wunschlisten</h2>";
        if (eigeneListen.length === 0) {
            eigene.innerHTML += "Keine Wunschlisten gefunden";
        } else {
            eigeneListen.forEach(w => {
                eigene.innerHTML += `
                    <div class="wunschliste-card" data-id="${w.wunschlisteid}" data-beschreibung="${encodeURIComponent(w.beschreibung)}">
                        <h3>${w.wunschlistename}</h3>
                        <div class="actions">
                            <button onclick="bearbeiten(${w.wunschlisteid})"><img src="/pictures/settings.png" alt="Bearbeiten"></button>
                            <button onclick="loeschen(${w.wunschlisteid})"><img src="/pictures/muelleimer.png" alt="Löschen"></button>
                        </div>
                    </div>`;
            });
        }

        geteilte.innerHTML = "<h2>Geteilte Wunschlisten</h2>";
        if (geteilteListen.length === 0) {
            geteilte.innerHTML += "Keine Wunschlisten gefunden";
        } else {
            geteilteListen.forEach(w => {
                geteilte.innerHTML += `
        <div class="wunschliste-card">
            <h3>${w.wunschlistename}</h3>
            <p>${w.beschreibung}</p>
            <p>Von: <strong>${w.ownerUsername}</strong></p>
            <p>Berechtigung: ${w.berechtigung}</p>
            <button onclick="zeigeProdukteDerWunschliste(${w.wunschlisteid})">Anzeigen</button>
        </div>`;
            });
        }
    } catch (e) {
        console.error(e);
        eigene.innerHTML = "Fehler beim Laden!";
        geteilte.innerHTML = "Fehler beim Laden!";
        return;
    }
}

async function loeschen(id) {
    if (confirm("Wirklich Löschen?")) {
        try {
            const res = await fetch("http://localhost:3000/api/wun/delete", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({wunschlisteid: id})
            });
            if (res.ok) {
                await loadWunschlisten();
            } else {
                alert("Löschen fehlgeschlagen!");
            }

        } catch (e) {
            console.error(e);
        }
    }
}

function openModal() {
    document.getElementById("modal").style.display = "block";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("wunschname").value = "";
    document.getElementById("beschreibung").value = "";
}

async function submitWunschliste() {
    const name = document.getElementById("wunschname").value.trim();
    const beschreibung = document.getElementById("beschreibung").value.trim();

    if (!name || !beschreibung) {
        alert("Bitte alle Felder ausfüllen.");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/wun/new", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                beschreibung: beschreibung
            }),
            credentials: "include"
        });

        if (res.ok) {
            closeModal();
            loadWunschlisten();
        } else {
            alert("Fehler beim Erstellen der Wunschliste.");
        }

    } catch (e) {
        console.error(e);
        return;
    }

}

function bearbeiten(id) {
    const wunschliste = document.querySelector(`[data-id='${id}']`);
    const name = wunschliste?.querySelector("h3")?.innerText || "Unbekannt";
    const beschreibung = decodeURIComponent(wunschliste?.getAttribute("data-beschreibung") || "");

    currentBearbeiteId = id;

    document.getElementById("edit-title").innerHTML = name;
    document.getElementById("edit-beschreibung").innerHTML = beschreibung;
    document.getElementById("edit-modal").style.display = "block";

    //Lade geteilte Benutzer für diese Liste
    fetch(`http://localhost:3000/api/wun/berechtigungen/${id}`, {
        credentials: "include"
    })
        .then(async res => {
            console.log("Status:", res.status);
            const text = await res.text();
            console.log("Antworttext:", text);

            if (!res.ok) {
                throw new Error(`Fehler: ${text}`);
            }

            return JSON.parse(text);
        })
        .then(data => zeigeFreigabe(data))
        .catch(err => {
            console.error(err);
            alert("Fehler beim Laden der Freigabe");
        });
    zeigeProdukteDerWunschliste(id);
}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
    currentBearbeiteId = null;
}

async function freigabeHinzufuegen(event) {
    event.preventDefault();

    const benutzer = document.getElementById("benutzernameFreigabe").value.trim();
    const rechte = document.getElementById("berechtigungsFreigabe").value;

    if (!benutzer) return;

    try {
        const res = await fetch("http://localhost:3000/api/wun/authorize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                andererUserBenutzername: benutzer,
                berechtigung: rechte,
                wunschlisteid: currentBearbeiteId
            })
        });
        const text = await res.text();
        console.log("Status: ", res.status);
        console.log("Text: ", text)

        if (res.ok) {
            bearbeiten(currentBearbeiteId);
        } else if (res.status === 400) {
            alert("Benutzer nicht gefunden");
        } else {
            alert("Feher!");
        }

    } catch (e) {
        console.error(e);
    }
}

async function berechtigungAendern(wunschlisteid, benutzername, neueBerechtigung) {
    try {
        const res = await fetch("http://localhost:3000/api/wun/authorize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                andererUserBenutzername: benutzername,
                berechtigung: neueBerechtigung,
                wunschlisteid: wunschlisteid
            })
        });

        const text = await res.text();

        if (res.status === 200) {
            alert("Berechtigung erfolgreich geändert")
        } else {
            console.warn("Fehlertext: ", text);
            alert("Fehler");
        }

    } catch (e) {
        console.error(e);
    }
}

async function freigabeEntfernen(wunschlisteid, benutzername) {
    try {
        const res = await fetch("http://localhost:3000/api/wun/authorize", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                andererUserBenutzername: benutzername,
                wunschlisteid: wunschlisteid
            })
        });

        if (res.ok) {
            bearbeiten(wunschlisteid);
        } else {
            alert("Fehler beim Entfernen der Freigabe");
        }
    } catch (e) {
        console.error(e);
    }
}

function zeigeFreigabe(freigaben) {
    const container = document.getElementById("freigabe-liste");
    container.innerHTML = "";

    freigaben.forEach(f => {
        const item = document.createElement("div");
        const berechtigung = f.berechtigung;

        //Drop Down Menü
        let options = `
            <option value="read" ${berechtigung === 'read' ? 'selected' : ''}>Lesen</option>
            <option value="write" ${berechtigung === 'write' ? 'selected' : ''}>Schreiben</option>
            <option value="owner" ${berechtigung === 'owner' ? 'selected' : ''} disabled>Owner</option>
        `;

        item.innerHTML = `
            <span>${f.benutzername}</span>
            <select onchange="berechtigungAendern(${currentBearbeiteId}, '${f.benutzername}', this.value)">
                <option value="read" ${berechtigung === 'read' ? 'selected' : ''}>Lesen</option>
                <option value="write" ${berechtigung === 'write' ? 'selected' : ''}>Schreiben</option>

            </select>
            <button onclick="freigabeEntfernen(${currentBearbeiteId}, '${f.benutzername}')" class="icon-btn" title="Entfernen">
                <img src="/pictures/muelleimer.png" alt="Löschen" class="icon-img">
            </button>
        `;
        container.appendChild(item);
    });
}

function zeigeProduktZuWunschlistenModal(produktId) {
    const modal = document.getElementById("produkt-wunschlisten-modal");
    const listeContainer = document.getElementById("wunschlisten-checkbox-liste");
    listeContainer.innerHTML = "Lade Wunschlisten...";

    fetch("http://localhost:3000/api/wun/my", {credentials: "include"})
        .then(res => res.json())
        .then(async listen => {
            for (const w of listen) {
                const resProdukte = await fetch("http://localhost:3000/api/wun/products", {
                    method: "GET",
                    credentials: "include",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({wunschlisteid: w.wunschlisteid})
                });
                const produkte = await resProdukte.json();
                const istDrin = produkte.some(p => p.produktid === produktId);

                const div = document.createElement("div");
                div.innerHTML = `
                <label>
                    <input type="checkbox" onchange="toggleProduktInWunschliste(${w.wunschlisteid}, ${produktId}, this.checked)" ${istDrin ? "checked" : ""}>
                    ${w.wunschlistename}
                </label>
                `;
                listeContainer.appendChild(div);
            }
        })
        .catch(err => {
            console.error(err);
            listeContainer.innerHTML = "Fehler beim Laden.";
        });
    modal.style.display = "block";
}

function schliesseProduktModal() {
    document.getElementById("produkt-wunschlisten-modal").style.display = "none";
}

function toggleProduktInWunschliste(wunschlisteid, produktId, hinzufuegen) {
    const url = hinzufuegen ? "updateProdukt" : "removeProdukt";
    fetch("http://localhost:3000/api/wun/update", {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            productID: produktId,
            aktion: hinzufuegen ? "add" : "remove",
            wunschlisteid: wunschlisteid
        })
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Fehler beim Speichern der Änderungen");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Fehler beim Speichern");
        })
}

window.addEventListener("DOMContentLoaded", loadWunschlisten);