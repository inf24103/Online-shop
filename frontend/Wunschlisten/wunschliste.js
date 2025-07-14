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
                    <p>Von: <strong>${w.ownerUsername}</strong></p>
                    <!-- ALT: onclick="zeigeProdukteDerWunschliste(...)" -->
                    <button onclick="zeigeGeteilteWunschliste(${w.wunschlisteid}, '${w.berechtigung}', '${w.beschreibung.replace(/'/g, "\\'")}','${w.wunschlistename.replace(/'/g, "\\'")}')">
                        Anzeigen
                    </button>
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
                zeigeToast("Wunschliste gelöscht", "success");
            } else {
                zeigeToast("Löschen fehlgeschlagen!", "error");
            }

        } catch (e) {
            console.error(e);
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
        zeigeToast("Bitte alle Felder ausfüllen.", "error");
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
            const data = await res.json();
            closeModal();
            await loadWunschlisten();
            zeigeToast("Wunschliste erstellt", "success");

        } else {
            zeigeToast("Fehler beim Erstellen der Wunschliste.", "error");
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
            zeigeToast("Fehler beim Laden der Freigabe", "error");
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
            zeigeToast("Benutzer nicht gefunden", "error");
        } else {
            zeigeToast("Fehler", "error");
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
            zeigeToast("Berechtigung erfolgreich geändert", "success");
        } else {
            console.warn("Fehlertext: ", text);
            zeigeToast("Fehler", "error");
        }

    } catch (e) {
        console.error(e);
    }
}

async function freigabeEntfernen(wunschlisteid, benutzername) {
    try {
        const res = await fetch("http://localhost:3000/api/wun/removeUser", {
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
            zeigeToast("Freigabe entfernt", "success");
        } else {
            zeigeToast("Fehler beim Entfernen der Freigabe", "error");
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
                const resProdukte = await fetch(`http://localhost:3000/api/wun/products/${w.wunschlisteid}`, {
                    method: "GET",
                    credentials: "include"
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
            zeigeToast("Fehler beim Speichern", "error");
        })
}

function zeigeGeteilteWunschliste(wunschlisteid, berechtigung, beschreibung, titel) {

    console.log("Aufgerufen");

    currentBearbeiteId = wunschlisteid;

    //Modal vorbereiten
    const modal = document.getElementById("edit-modal");
    document.getElementById("edit-title").textContent = titel;
    document.getElementById("edit-beschreibung").textContent = beschreibung;

    //Owner-Sachen ausblenden
    document.getElementById("share-form").style.display = "none";
    document.querySelector(".delete-btn").style.display = "none";

    //Produkte hinzufügen nur bei write Rechten
    const addBtnWrapper = document.getElementById("produkte-hinzufuegen-button-wrapper");
    addBtnWrapper.style.display = (berechtigung === "write") ? "block" : "none";

    //Nicht anzeigen
    const bearbeiteBtn = document.getElementById("wunschliste-bearbeiten-btn");
    bearbeiteBtn.style.display = (berechtigung === "owner") ? "block" : "none";

    //Modal anzeigen
    modal.style.display = "block";

    //Produkte laden
    zeigeProdukteDerWunschliste(wunschlisteid, berechtigung);

}

function oeffneWunschlisteBearbeitenModal() {
    const titel = document.getElementById("edit-title")?.textContent || "";
    const beschreibung = document.getElementById("edit-beschreibung")?.textContent || "";

    document.getElementById("bearbeiten-titel").value = titel;
    document.getElementById("bearbeiten-beschreibung").value = beschreibung;

    document.getElementById("wunschliste-bearbeiten-modal").style.display = "block";
}

function schliesseWunschlisteBearbeitenModal() {
    document.getElementById("wunschliste-bearbeiten-modal").style.display = "none";
}

async function speichereWunschlisteBearbeitung() {
    const titel = document.getElementById("bearbeiten-titel").value.trim();
    const beschreibung = document.getElementById("bearbeiten-beschreibung").value.trim();

    if(!titel || !beschreibung) {
        zeigeToast("Bitte beide Felder ausfüllen", "error");
        return;
    }

    try {

        //Beschreibung aktualisieren
        const res = await fetch("http://localhost:3000/api/wun/update", {
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                inhalt: beschreibung,
                aktion: "updateBeschreibung",
                wunschlisteid: currentBearbeiteId
            })
        });

        //Titel aktualisieren
        const res2 = await fetch("http://localhost:3000/api/wun/update", {
           method: "POST",
           credentials: "include",
           headers: {"Content-Type": "application/json"},
           body: JSON.stringify({
               inhalt: titel,
               aktion: "updateName",
               wunschlisteid: currentBearbeiteId
           })
        });

        if(res.ok && res2.ok) {
            zeigeToast("Wunschliste aktualisiert", "success");
            schliesseWunschlisteBearbeitenModal();
            bearbeiten(currentBearbeiteId);
            loadWunschlisten();
        } else {
            zeigeToast("Speichern fehlgeschlagen", "error");
        }


    } catch (e) {
        console.error(e);
        zeigeToast("Fehler beim Speichern", "error");
    }
}

window.addEventListener("DOMContentLoaded", loadWunschlisten);