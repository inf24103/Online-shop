function zeigeProdukteDerWunschliste(wunschlisteId) {
    fetch(`http://localhost:3000/api/wun/products?wunschlisteid=${wunschlisteId}`, {
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
            const container = document.getElementById("produkte-liste");
            container.innerHTML = ""; // Vorherige Einträge löschen

            if (produkte.length === 0) {
                container.innerHTML = "<p>Keine Produkte in dieser Wunschliste</p>";
                return;
            }

            produkte.forEach(p => {
                const card = document.createElement("div");
                card.className = "produkt-card";
                card.innerHTML = `
                <h4>${p.produktname}</h4>
                <p>${p.beschreibung}</p>
                <p><strong>${parseFloat(p.preis).toFixed(2)} €</strong></p>
            `;
                container.appendChild(card);
            });
        })
        .catch(err => {
            console.error("Fehler beim Laden der Produkte", err);
        });
}
