const form = document.getElementById("product-form");
const list = document.getElementById("product-list");
const formContainer = document.getElementById("product-form-container");
const addBtn = document.getElementById("add-product-btn");
let editingProductId = null;
const saveProductButton = form.querySelector('button[type="submit"]');

addBtn.addEventListener("click", () => {
    formContainer.classList.toggle("open");

    if (formContainer.classList.contains("open")) {
        form.reset();
        editingProductId = null;
        saveProductButton.textContent = "Produkt speichern";
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const produktData = {
        produktname: document.getElementById("name").value.trim(),
        preis: parseFloat(document.getElementById("price").value),
        menge: parseInt(document.getElementById("menge").value),
        kategorie: document.getElementById("category").value.trim(),
        bild: document.getElementById("image").value.trim(),
        beschreibung: document.getElementById("description").value.trim(),
    };

    try {
        let res;
        if (editingProductId) {
            res = await fetch(`http://localhost:3000/api/inv/product/${editingProductId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(produktData)
            });
            if (!res.ok) throw new Error("Fehler beim Aktualisieren des Produkts");
            alert("Produkt erfolgreich aktualisiert!");
        } else {
            res = await fetch("http://localhost:3000/api/inv/product/new", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(produktData)
            });
            if (!res.ok) throw new Error("Fehler beim Erstellen des Produkts");
            alert("Produkt erfolgreich erstellt!");
        }

        await loadProducts();
        form.reset();
        formContainer.classList.remove("open");
        editingProductId = null; // Bearbeitungsmodus beenden
        saveProductButton.textContent = "Produkt speichern"; // Button-Text zurücksetzen
    } catch (err) {
        alert("Operation fehlgeschlagen: " + err.message);
        console.error(err);
    }
});


async function loadProducts(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const url = query ? `http://localhost:3000/api/inv/product/all?${query}` : `http://localhost:3000/api/inv/product/all`;

    const res = await fetch(url);
    if (!res.ok) {
        list.innerHTML = "<p>Fehler beim Laden der Produkte </p>";
        return;
    }
    const products = await res.json();

    list.innerHTML = "";
    if (products.length === 0) {
        list.innerHTML = "<p>Keine Produkte gefunden.</p>";
        return;
    }

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            ${product.bild ? `<img src="${product.bild}" alt="${product.produktname}">` : ''}
            <h3>${product.produktname}</h3>
            <p><strong>Preis:</strong> €${parseFloat(product.preis).toFixed(2)}</p>
            <p><strong>Kategorie:</strong> ${product.kategorie}</p>
            <p>${product.kurzbeschreibung || ''}</p>
            <div class="button-group"> 
                <button class="delete-btn" onclick="deleteProduct(${product.produktid})">Löschen</button>
                <button class="edit-btn" onclick="editProduct(${product.produktid})">Bearbeiten</button>
            </div>
        `;
        list.appendChild(card);
    });
}

async function editProduct(id) {
    try {
        // Produkt-Details abrufen (angenommen, es gibt einen GET-Endpunkt für einzelne Produkte)
        // Wenn es keinen spezifischen GET-Endpunkt für IDs gibt, müsstest du die Daten aus der bereits geladenen Liste suchen.
        // Für bessere Skalierbarkeit ist ein GET /product/:id Endpunkt ideal.
        // Für diesen Beispiel gehe ich davon aus, dass wir alle Produkte laden und das passende finden.
        // Besser wäre: const res = await fetch(`http://localhost:3000/api/inv/product/${id}`);
        // Wenn es keinen Einzelabruf gibt, suchen wir im bereits geladenen Array.
        const allProductsRes = await fetch('http://localhost:3000/api/inv/product/all');
        if (!allProductsRes.ok) throw new Error("Fehler beim Laden der Produktdetails zum Bearbeiten.");
        const allProducts = await allProductsRes.json();
        const productToEdit = allProducts.find(p => p.produktid === id);


        if (!productToEdit) {
            alert("Produkt nicht gefunden.");
            return;
        }

        // Formularfelder mit Produktdaten füllen
        document.getElementById("name").value = productToEdit.produktname;
        document.getElementById("price").value = productToEdit.preis;
        document.getElementById("menge").value = productToEdit.menge;
        document.getElementById("category").value = productToEdit.kategorie;
        document.getElementById("image").value = productToEdit.bild || ''; // Optionales Feld
        document.getElementById("short-desc").value = productToEdit.kurzbeschreibung || ''; // Optionales Feld
        document.getElementById("description").value = productToEdit.beschreibung;

        // Formular-Container öffnen
        formContainer.classList.add("open");

        // Den Bearbeitungsmodus aktivieren
        editingProductId = id;
        saveProductButton.textContent = "Änderungen speichern"; // Button-Text anpassen
    } catch (err) {
        alert("Produkt zum Bearbeiten konnte nicht geladen werden: " + err.message);
        console.error(err);
    }
}

async function deleteProduct(id) {
    if (!confirm("Möchtest du dieses Produkt wirklich löschen?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/inv/product/${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Fehler beim Löschen");
        alert("Produkt erfolgreich gelöscht!");
        await loadProducts();
    } catch (err) {
        alert("Produkt konnte nicht gelöscht werden: " + err.message);
        console.error(err);
    }
}

document.getElementById("filter-btn").addEventListener("click", () => {
    const name = document.getElementById("filter-name").value.trim();
    const category = document.getElementById("filter-category").value.trim();
    const sort = document.getElementById("filter-sort").value;

    loadProducts({
        produktname: name,
        kategorie: category,
        sortierung: sort
    });
});

// Beim Start alle Produkte laden
loadProducts();