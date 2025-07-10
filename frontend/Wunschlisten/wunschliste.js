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
        if(eigeneListen.length === 0) {
            eigene.innerHTML += "Keine Wunschlisten gefunden";
        } else {
            eigeneListen.forEach(w => {
                eigene.innerHTML += `
                    <div class="wunschliste-card" data-id="${w.wunschlisteid}">
                        <h3>${w.wunschlistename}</h3>
                        <p>Produkte: Kommt noch</p>
                        <div class="actions">
                            <button onclick="bearbeiten(${w.wunschlisteid})"><img src="/icons/edit.png" alt="Bearbeiten"></button>
                            <button onclick="loeschen(${w.wunschlisteid})"><img src="/icons/delete.png" alt="Löschen"></button>
                        </div>
                    </div>`;
            });

            geteilte.innerHTML = "<h2>Geteilte Wunschlisten</h2>";
            if(geteilteListen.length === 0) {
                geteilte.innerHTML += "Keine Wunschlisten gefunden";
            } else {
                geteilteListen.forEach(w => {
                    geteilte.innerHTML += `
                    <div class="wunschliste-card">
                        <h3>${w.wunschlistename}</h3>
                        <p>Von: ${w.benutzername}</p>
                    </div>`;
                });
            }

        }
    } catch (e) {
        console.error(e);
        eigene.innerHTML = "Fehler beim Laden!";
        geteilte.innerHTML = "Fehler beim Laden!";
        return;
    }
}

async function loeschen(id) {
    if(confirm("Wirklich Löschen?")) {
        try {
            const res = await fetch("http://localhost:3000/api/wun/delete", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({wunschlisteid: id})
            });
            if(res.ok) {
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

    if(!name || !beschreibung) {
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

        if(res.ok) {
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
    const beschreibung = wunschliste?.querySelector("p")?.innerText || "";

    currentBearbeiteId = id;

    document.getElementById("edit-title").innerHTML = name;
    document.getElementById("edit-beschreibung").innerHTML = beschreibung;

    document.getElementById("edit-modal").style.display = "block";

}

function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
    currentBearbeiteId = null;
}

window.addEventListener("DOMContentLoaded", loadWunschlisten);