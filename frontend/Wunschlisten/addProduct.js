let aktuelleWunschlisteId = null;
let alleProdukteOriginal = []; // NEU: für Filterfunktion

function zeigeProduktHinzufuegenModal(wunschlisteid) {
    aktuelleWunschlisteId = wunschlisteid;

    const modal = document.getElementById("produkt-hinzufuegen-modal");
    modal.style.display = "block";

    const container = document.getElementById("alle-produkte-liste");
    container.innerHTML = "<p>Lade Produkte...</p>";

    fetch("http://localhost:3000/api/inv/product/all", {
        method: "GET",
        credentials: "include"
    })
        .then(res => {
            if (!res.ok) throw new Error("Fehler beim Laden der Produkte");
            return res.json();
        })
        .then(produkte => {
            if (produkte.length === 0) {
                container.innerHTML = "Es sind keine Produkte vorhanden im Webshop";
                return;
            }

            alleProdukteOriginal = produkte; // NEU: global speichern
            renderAlleProdukte(produkte);    // NEU: Rendering über neue Funktion
        })
        .catch(err => {
            console.error("Fehler beim Laden der Produkte");
            container.innerHTML = "Fehler beim Laden der Produkte!";
        });
}

function renderAlleProdukte(produkte) { // NEU: separate Renderfunktion
    const container = document.getElementById("alle-produkte-liste");
    container.innerHTML = "";

    if (produkte.length === 0) {
        container.innerHTML = "<p>Keine Produkte gefunden.</p>";
        return;
    }

    produkte.forEach(p => {
        const imageURL = `http://localhost:3000/${p.bild}`;
        const card = document.createElement("div");
        card.className = "produkt-card";
        card.innerHTML = `
            ${p.bild ? `<img src="${imageURL}" alt="${p.produktname}">` : ''}
            <h4>${p.produktname}</h4>
            <p>${p.beschreibung}</p>
            <p>${p.kategorie}</p>
            <p><strong>${parseFloat(p.preis).toFixed(2)} €</strong></p>
            <button class="icon-btn" onclick="produktZurWunschlisteHinzufuegen(${p.produktid})" title="Hinzufügen">
                <img src="/pictures/add_to_card.png" alt="Hinzufügen" class="icon-img">
            </button>
        `;
        container.append(card);
    });
}

function filterProdukteInWunschliste() { // NEU: Filterfunktion
    const nameFilter = document.getElementById("filter-name").value.trim().toLowerCase();
    const katFilter = document.getElementById("kat_filter").value;

    const gefiltert = alleProdukteOriginal.filter(p => {
        const nameMatch = p.produktname.toLowerCase().includes(nameFilter);
        const katMatch = katFilter === "All" || p.kategorie === katFilter;
        return nameMatch && katMatch;
    });

    renderAlleProdukte(gefiltert); // NEU: nur gefilterte Produkte anzeigen
}

function produktZurWunschlisteHinzufuegen(produktid) {
    if (!aktuelleWunschlisteId) {
        console.error("Keine Wunschliste ausgewählt");
        return;
    }

    fetch("http://localhost:3000/api/wun/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            inhalt: String(produktid),
            aktion: "addProdukt",
            wunschlisteid: String(aktuelleWunschlisteId)
        })
    })
        .then(res => {
            if (!res.ok) console.error("Fehler beim Hinzufügen des Produkts!");
            zeigeToast("Produkt hinzugefügt", "success");
        })
        .catch(err => {
            console.error("Fehler beim Hinzufügen des Produkts!");
        });
}

function schliesseProduktHinzufuegenModal() {
    const modal = document.getElementById("produkt-hinzufuegen-modal");
    modal.style.display = "none";
    aktuelleWunschlisteId = null;
}

function zurueckZuModal() {
    const modal = document.getElementById("produkt-hinzufuegen-modal");
    modal.style.display = "none";
    document.getElementById("edit-modal").style.display = "block";
    zeigeProdukteDerWunschliste(aktuelleWunschlisteId);
}
