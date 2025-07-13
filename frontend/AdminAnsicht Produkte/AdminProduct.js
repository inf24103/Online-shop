const form = document.getElementById("product-form");
const list = document.getElementById("product-list");
const formContainer = document.getElementById("product-form-container");
const addBtn = document.getElementById("add-product-btn");
let editingProductId = null;
let currentProductImage = null;
let downloadedImageFile = null;

const saveProductButton = form.querySelector('button[type="submit"]');
const adminNotification = document.getElementById('adminNotification');
const currentImageDisplay = document.getElementById("current-image-display");
const imageInput = document.getElementById("image");
const IMAGE_BASE_URL = 'http://localhost:3000/';

const filterForm = document.querySelector(".filter form");

function showAdminNotification(message, type = 'success') {
    if (adminNotification) {
        adminNotification.textContent = message;
        adminNotification.classList.remove('success', 'error');
        adminNotification.classList.add(type, 'show');

        setTimeout(() => {
            adminNotification.classList.remove('show');
            setTimeout(() => { adminNotification.textContent = ''; }, 500);
        }, 2000);
    }
}

function displaySelectedImage(file, imageUrl = null) {
    if (currentImageDisplay) {
        currentImageDisplay.innerHTML = '';

        const imgElement = document.createElement('img');
        imgElement.style.maxWidth = '150px';
        imgElement.style.height = 'auto';
        imgElement.style.marginTop = '10px';

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgElement.src = e.target.result;
            };
            reader.readAsDataURL(file);
            const notice = document.createElement('p');
            notice.style.color = 'green';
            notice.style.fontWeight = 'bold';
            notice.textContent = 'Neues Bild wird hochgeladen.';
            currentImageDisplay.appendChild(notice);
        } else if (imageUrl) {
            imgElement.src = imageUrl;
            const notice = document.createElement('p');
            notice.style.color = 'gray';
            notice.style.fontWeight = 'normal';
            notice.textContent = 'Altes Bild wird beibehalten, falls kein neues ausgewählt wird.';
            currentImageDisplay.appendChild(notice);
        } else {
            currentImageDisplay.innerHTML = '<p>Kein Bild ausgewählt.</p>';
            return;
        }
        currentImageDisplay.appendChild(imgElement);
    }
}

imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        downloadedImageFile = null;
        displaySelectedImage(file);
    } else {
        if (editingProductId && currentProductImage) {
            displaySelectedImage(null, currentProductImage);
        } else {
            currentImageDisplay.innerHTML = '<p>Kein Bild ausgewählt.</p>';
        }
    }
});

addBtn.addEventListener("click", () => {
    formContainer.classList.toggle("open");
    if (formContainer.classList.contains("open")) {
        form.reset();
        editingProductId = null;
        currentProductImage = null;
        downloadedImageFile = null;
        saveProductButton.textContent = "Produkt speichern";
        if (currentImageDisplay) {
            currentImageDisplay.innerHTML = '';
        }
        document.getElementById("image-input-group").style.display = 'block';
        imageInput.value = '';
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const produktname = document.getElementById("name").value.trim();
    const preis = parseFloat(document.getElementById("price").value);
    const menge = parseInt(document.getElementById("menge").value);
    const kategorie = document.getElementById("category").value.trim();
    const beschreibung = document.getElementById("description").value.trim();
    const imageFile = imageInput.files[0];

    if (!produktname || isNaN(preis) || isNaN(menge) || !kategorie || !beschreibung) {
        alert("Bitte fülle alle Text- und Zahlenfelder aus.");
        return;
    }
    if (preis <= 0 || menge < 0) {
        alert("Preis muss positiv, Menge nicht negativ sein.");
        return;
    }

    try {
        let res;
        let successMessage = "";

        if (editingProductId) {
            const patchFormData = new FormData();
            patchFormData.append("produktname", produktname);
            patchFormData.append("preis", preis);
            patchFormData.append("menge", menge);
            patchFormData.append("kategorie", kategorie);
            patchFormData.append("beschreibung", beschreibung);

            if (imageFile) {
                patchFormData.append("bild", imageFile);
            } else if (downloadedImageFile) {
                patchFormData.append("bild", downloadedImageFile);
            } else {
                showAdminNotification("Fehler: Es muss ein Bild ausgewählt oder ein vorhandenes beibehalten werden.", 'error');
                return;
            }

            res = await fetch(`http://localhost:3000/api/inv/product/${editingProductId}`, {
                method: "PATCH",
                credentials: "include",
                body: patchFormData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Fehler beim Aktualisieren des Produkts: ${errorData.message || res.statusText}`);
            }
            successMessage = "Produkt erfolgreich aktualisiert!";

        } else {
            if (!imageFile) {
                alert("Bitte wähle ein Bild für das neue Produkt aus.");
                return;
            }

            const createFormData = new FormData();
            createFormData.append("produktname", produktname);
            createFormData.append("preis", preis);
            createFormData.append("verfuegbareMenge", menge);
            createFormData.append("kategorie", kategorie);
            createFormData.append("beschreibung", beschreibung);
            createFormData.append("bild", imageFile);

            res = await fetch("http://localhost:3000/api/inv/product/new", {
                method: "POST",
                credentials: "include",
                body: createFormData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Fehler beim Erstellen des Produkts: ${errorData.message || res.statusText}`);
            }

            const result = await res.json();
            console.log("Erstelltes Produkt:", result);
            successMessage = "Produkt erfolgreich erstellt!";
        }
        showAdminNotification(successMessage, 'success');
        const currentFilters = getCurrentFilterValues();
        await loadProducts(currentFilters);
        form.reset();
        formContainer.classList.remove("open");
        editingProductId = null;
        currentProductImage = null;
        downloadedImageFile = null;
        saveProductButton.textContent = "Produkt speichern";
        if (currentImageDisplay) {
            currentImageDisplay.innerHTML = '';
        }
        document.getElementById("image-input-group").style.display = 'block';
        imageInput.value = '';
    } catch (err) {
        showAdminNotification("Fehler: " + err.message, 'error');
        console.error("Fehler im Submit-Handler:", err);
    }
});

async function loadProducts(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const url = `${IMAGE_BASE_URL}api/inv/product/search${query ? `?${query}` : ''}`;

    try {
        const res = await fetch(url, { credentials: "include" });

        if (res.status === 401 || res.status === 403) {
            showAdminNotification("Keine Berechtigung. Bitte melden Sie sich als Admin an.", 'error');
            return;
        }

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Fehler beim Laden der Produkte: ${errorData.message || res.statusText}`);
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

            const imageUrl = product.bild ? (product.bild.startsWith('http') ? product.bild : `${IMAGE_BASE_URL}${product.bild}`) : 'https://via.placeholder.com/200';

            card.innerHTML = `
                <img src="${imageUrl}" alt="${product.produktname}" style="max-width: 200px;">
                <div class="product-info">
                    <h3>${product.produktname}</h3>
                    <p class="product-category">${product.kategorie}</p>
                    <p class="product-price">€${parseFloat(product.preis).toFixed(2)}</p>
                    <p class="product-stock-info">Im Vorrat: ${product.menge}</p>
                    <div class="button-group">
                        <button class="delete-btn" onclick="deleteProduct(${product.produktid})">Löschen</button>
                        <button class="edit-btn" onclick="editProduct(${product.produktid})">Bearbeiten</button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    } catch (err) {
        list.innerHTML = `<p>Fehler beim Laden: ${err.message}</p>`;
        console.error("Fehler in loadProducts:", err);
        showAdminNotification("Fehler beim Laden der Produkte: " + err.message, 'error');
    }
}

async function editProduct(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/inv/product/${id}`, { credentials: "include" });
        if (res.status === 401 || res.status === 403) {
            showAdminNotification("Nicht autorisiert. Bitte melden Sie sich als Admin an.", 'error');
            return;
        }
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Fehler beim Laden des Produkts: ${errorData.message || res.statusText}`);
        }

        const product = await res.json();
        const productData = product[0];

        document.getElementById("name").value = productData.produktname || '';
        document.getElementById("price").value = productData.preis || '';
        document.getElementById("menge").value = productData.menge || '';
        document.getElementById("category").value = productData.kategorie || '';
        document.getElementById("description").value = productData.beschreibung || '';

        imageInput.value = '';

        currentProductImage = productData.bild
            ? (productData.bild.startsWith("http") ? productData.bild : `${IMAGE_BASE_URL}${productData.bild}`)
            : null;

        if (currentProductImage) {
            displaySelectedImage(null, currentProductImage);
            try {
                const imageRes = await fetch(currentProductImage);
                if (imageRes.ok) {
                    const blob = await imageRes.blob();
                    const filename = currentProductImage.substring(currentProductImage.lastIndexOf('/') + 1);
                    downloadedImageFile = new File([blob], filename, { type: blob.type });
                    console.log("Altes Bild erfolgreich heruntergeladen:", downloadedImageFile);
                } else {
                    console.warn("Konnte altes Bild nicht herunterladen:", imageRes.statusText);
                    downloadedImageFile = null;
                }
            } catch (imageErr) {
                console.error("Fehler beim Herunterladen des alten Bildes:", imageErr);
                downloadedImageFile = null;
            }
        } else {
            currentImageDisplay.innerHTML = '<p>Kein Bild vorhanden.</p>';
            downloadedImageFile = null;
        }

        document.getElementById("image-input-group").style.display = 'block';

        formContainer.classList.add("open");
        editingProductId = id;
        saveProductButton.textContent = "Änderungen speichern";
    } catch (err) {
        showAdminNotification("Fehler beim Bearbeiten: " + err.message, 'error');
        console.error("Fehler in editProduct:", err);
    }
}

async function deleteProduct(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/inv/product/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (res.status === 401 || res.status === 403) {
            showAdminNotification("Nicht autorisiert. Bitte melden Sie sich als Admin an, um Produkte zu löschen.", 'error');
            return;
        }

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Fehler beim Löschen: ${errorData.message || res.statusText}`);
        }
        showAdminNotification("Produkt erfolgreich gelöscht!", 'error');
        const currentFilters = getCurrentFilterValues();
        await loadProducts(currentFilters);
    } catch (err) {
        showAdminNotification("Produkt konnte nicht gelöscht werden: " + err.message, 'error');
        console.error("Fehler in deleteProduct:", err);
    }
}

function getCurrentFilterValues() {
    const filters = {};

    const nameFilter = filterForm.elements["name"].value.trim();
    if (nameFilter) filters.name = nameFilter;

    const maxPriceValue = filterForm.elements["maxPreis"].value.trim();
    const maxPriceFilter = parseFloat(maxPriceValue);
    if (!isNaN(maxPriceFilter) && maxPriceValue !== '') filters.maxPreis = maxPriceFilter;

    const minMengeValue = filterForm.elements["minMenge"].value.trim();
    const minMengeFilter = parseInt(minMengeValue);
    if (!isNaN(minMengeFilter) && minMengeValue !== '') filters.minMenge = minMengeFilter;

    const selectedCategory = filterForm.elements["kategorie"].value;
    if (selectedCategory && selectedCategory !== "All") {
        filters.kategorie = selectedCategory;
    } else {
        delete filters.kategorie;
    }

    const selectedSort = filterForm.elements["sortierung"].value;
    if (selectedSort && selectedSort !== "") {
        filters.sortierung = selectedSort;
    } else {
        delete filters.sortierung;
    }
    return filters;
}

filterForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const filters = getCurrentFilterValues();
    loadProducts(filters);
});

loadProducts();