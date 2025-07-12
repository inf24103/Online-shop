const form = document.getElementById("product-form");
const list = document.getElementById("product-list");
const formContainer = document.getElementById("product-form-container");
const addBtn = document.getElementById("add-product-btn");
let editingProductId = null;
const saveProductButton = form.querySelector('button[type="submit"]');
const IMAGE_BASE_URL = 'http://localhost:3000/';

addBtn.addEventListener("click", () => {
    formContainer.classList.toggle("open");
    if (formContainer.classList.contains("open")) {
        form.reset();
        editingProductId = null;
        saveProductButton.textContent = "Produkt speichern";
    }
});

async function uploadImage(file) {
    const formData = new FormData();
    formData.append("bild", file);

    const res = await fetch("http://localhost:3000/api/upload/image", {
        method: "POST",
        body: formData,
        credentials: "include"
    });

    if (!res.ok) throw new Error("Bild-Upload fehlgeschlagen");

    const data = await res.json();
    return data.bildId;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const imageFile = document.getElementById("image").files[0];
    if (!imageFile) {
        alert("Bitte wähle ein Bild aus.");
        return;
    }

    try {

        const formData = new FormData();
        formData.append("produktname", document.getElementById("name").value.trim());
        formData.append("preis", parseFloat(document.getElementById("price").value));
        formData.append("verfuegbareMenge", parseInt(document.getElementById("menge").value));
        formData.append("kategorie", document.getElementById("category").value.trim());
        formData.append("beschreibung", document.getElementById("description").value.trim());

        const imageInput = document.getElementById("image");
        if (imageInput.files.length > 0) {
            formData.append("bild", imageInput.files[0]);
        } else {
            alert("Bitte wähle ein Bild aus.");
            return;
        }


        let res;
        if (editingProductId) {
            res = await fetch(`http://localhost:3000/api/inv/product/${editingProductId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(produktData)
            });
            if (!res.ok) throw new Error("Fehler beim Aktualisieren des Produkts");
            alert("Produkt erfolgreich aktualisiert!");
        } else {
            res = await fetch("http://localhost:3000/api/inv/product/new", {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            if (!res.ok) throw new Error("Fehler beim Erstellen des Produkts");
            alert("Produkt erfolgreich erstellt!");
        }

        await loadProducts();
        form.reset();
        formContainer.classList.remove("open");
        editingProductId = null;
        saveProductButton.textContent = "Produkt speichern";
    } catch (err) {
        alert("Fehler: " + err.message);
        console.error(err);
    }
});




async function loadProducts(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const url = query
        ? `http://localhost:3000/api/inv/product/search/?${query}`
        : `http://localhost:3000/api/inv/product/all`;

    try {
        const res = await fetch(url, {credentials: "include",});
        if (!res.ok) throw new Error("Fehler beim Laden der Produkte");
        const products = await res.json();

        list.innerHTML = "";
        if (products.length === 0) {
            list.innerHTML = "<p>Keine Produkte gefunden.</p>";
            return;
        }

        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "product-card";
            const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200';
            card.innerHTML = `
                ${product.bild ? `<img src="${imageUrl}" alt="${product.produktname}">` : ''}
                <h3>${product.produktname}</h3>
                <p><strong>Preis:</strong> €${parseFloat(product.preis).toFixed(2)}</p>
                <p><strong>Kategorie:</strong> ${product.kategorie}</p>
                <div class="button-group"> 
                    <button class="delete-btn" onclick="deleteProduct(${product.produktid})">Löschen</button>
                    <button class="edit-btn" onclick="editProduct(${product.produktid})">Bearbeiten</button>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (err) {
        list.innerHTML = `<p>${err.message}</p>`;
        console.error(err);
    }
}

async function editProduct(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/inv/product/${id}`);
        if (!res.ok) throw new Error("Fehler beim Laden des Produkts");

        const product = await res.json();

        document.getElementById("name").value = product.produktname;
        document.getElementById("price").value = product.preis;
        document.getElementById("menge").value = product.verfuegbareMenge;
        document.getElementById("category").value = product.kategorie;
        document.getElementById("image").value = product.bild || '';
        document.getElementById("description").value = product.beschreibung;

        formContainer.classList.add("open");

        editingProductId = id;
        saveProductButton.textContent = "Änderungen speichern";
    } catch (err) {
        alert("Fehler beim Bearbeiten: " + err.message);
        console.error(err);
    }
}

async function deleteProduct(id) {
    if (!confirm("Möchtest du dieses Produkt wirklich löschen?")) return;

    try {
        const res = await fetch(`http://localhost:3000/api/inv/product/${id}`, {
            method: "DELETE",
            credentials: "include"
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
    const maxPreis = document.getElementById("filter-maxpreis")?.value;
    const minMenge = document.getElementById("filter-minmenge")?.value;

    const filters = {};
    if (name) filters.name = name;
    if (category) filters.kategorie = category;
    if (sort) filters.sortierung = sort;
    if (maxPreis) filters.maxPreis = maxPreis;
    if (minMenge) filters.minMenge = minMenge;

    loadProducts(filters);
});

loadProducts();
