let aktuelleBerechtigung = "owner";
let gefilterteProdukte = [];
let originalProdukte = [];

function zeigeProdukteDerWunschliste(wunschlisteId, berechtigung = "owner") {
    aktuelleBerechtigung = berechtigung;

    fetch(`http://localhost:3000/api/wun/products/${wunschlisteId}`, {
        method: "GET",
        credentials: "include"
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Fehler beim Abrufen der Produkte");
            }
            return res.json();
        })
        .then(produkte => {
            originalProdukte = produkte; // speichern zum Filtern
            renderProduktliste(produkte);
        })
        .catch(err => {
            console.error("Fehler beim Laden der Produkte", err);
        });
}

function renderProduktliste(produkte) {
    const container = document.getElementById("produkte-liste");
    container.innerHTML = ""; // Vorherige Einträge löschen

    if (produkte.length === 0) {
        container.innerHTML = "<p>Keine Produkte in dieser Wunschliste</p>";
        return;
    }

    produkte.forEach(p => {
        const card = document.createElement("div");
        const imageURL = `http://localhost:3000/${p.bild}`;
        card.className = "produkt-card";
        card.innerHTML = `
            ${p.bild ? `<img src="${imageURL}" alt="${p.produktname}">` : ''}
            <h4>${p.produktname}</h4>
            <p>${p.beschreibung}</p>
            <p>${p.kategorie}</p>
            <p><strong>${parseFloat(p.preis).toFixed(2)} €</strong></p>
            ${(aktuelleBerechtigung === "write" || aktuelleBerechtigung === "owner") ? `
                <button class="icon-btn" onclick="produktAusWunschlisteEntfernen(${currentBearbeiteId}, ${p.produktid})" title="Löschen">
                    <img src="/pictures/muelleimer.png" alt="Löschen" class="icon-img">
                </button>` : ""}
        `;
        container.appendChild(card);
    });
}

function produktAusWunschlisteEntfernen(wunschlisteId, produktId) {
    fetch("http://localhost:3000/api/wun/update", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inhalt: String(produktId),
            aktion: "removeProdukt",
            wunschlisteid: wunschlisteId
        })
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Fehler beim Entfernen des Produkts");
            } else {
                zeigeProdukteDerWunschliste(wunschlisteId, aktuelleBerechtigung);
            }
        })
        .catch(err => {
            console.error("Entfernen fehlgeschlagen!");
        });
}

// Filterfunktion
function filterProdukteInWunschliste() {
    const nameFilter = document.getElementById("filter-name").value.trim().toLowerCase();
    const katFilter = document.getElementById("kat_filter").value;

    const gefiltert = originalProdukte.filter(p => {
        const nameMatch = p.produktname.toLowerCase().includes(nameFilter);
        const katMatch = (katFilter === "All") || (p.kategorie === katFilter);
        return nameMatch && katMatch;
    });

    renderProduktliste(gefiltert);
}
