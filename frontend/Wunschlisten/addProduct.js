let aktuelleWunschlisteId = null;

function zeigeProduktHinzufuegenModal(wunschlisteid) {
    aktuelleWunschlisteId = wunschlisteid;

    const modal = document.getElementById("produkt-hinzufuegen-modal");
    modal.style.display = "block";

    const container = document.getElementById("alle-produkte-liste");
    container.innerHTML = "<p>Lade Produkte...</p>";

    fetch ("http://localhost:3000/api/inv/product/all", {
        method: "GET",
        credentials: "include"
    })
        .then(res => {
            if(!res.ok) throw new Error("Fehler beim Laden der Produkte");
            return res.json();
        })
        .then(produkte => {
            if(produkte.length === 0) {
                container.innerHTML = "Es sind keine Produkte vorhande im Webshop";
                return;
            }

            container.innerHTML = "";
            produkte.forEach(p => {
                const card = document.createElement("div");
                card.className = "produkt-card";
                card.innerHTML = `
                    <img src="localhost:3000/${p.bild}" alt="${p.produktname}" class="card-img-top">
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
        })
        .catch(err => {
            console.error("Fehler beim Laden der Produkte");
            container.innerHTML = "Fehler beim Laden der Produkte!";
        })
}

function produktZurWunschlisteHinzufuegen(produktid) {
    if(!aktuelleWunschlisteId) {
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
            if(!res.ok) console.error("Fehler beim Hinzufügen des Produkts!");
            alert("Produkt hinzugefügt!");
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