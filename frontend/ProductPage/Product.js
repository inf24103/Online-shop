const productDetailModal = document.getElementById('product-detail-modal');
const modalImage = document.getElementById('modal-product-image');
const modalName = document.getElementById('modal-product-name');
const modalDescription = document.getElementById('modal-product-description');
const modalPrice = document.getElementById('modal-product-price');
const modalCategory = document.getElementById('modal-product-category');
const modalQuantity = document.getElementById('modal-product-quantity');
const closeButton = productDetailModal.querySelector('.close-button');
const addToCartModalButton = productDetailModal ? productDetailModal.querySelector('.add-to-cart-modal') : null;
let currentProductInModal = null;
const filterForm = document.querySelector(".filter form");
let allProductsCache = []; // Cache für alle Produkte, mit originaler Menge
let currentCart = []; // Aktueller Warenkorb-Zustand (vom Backend oder LocalStorage)

let scrollPosition = 0;

const IMAGE_BASE_URL = 'http://localhost:3000/';
const API_INV_BASE_URL = 'http://localhost:3000/api/inv'; // Neue Konstante
const API_USER_BASE_URL = 'http://localhost:3000/api/user'; // Neue Konstante

// Hilfsfunktion zur Bestimmung des aktuellen Tokens (userToken oder adminToken)
function getCurrentUserToken() {
    return localStorage.getItem('userToken'); // Oder 'adminToken', je nachdem, was du nutzt
}


function renderProducts(productList) {
    const container = document.querySelector('.product-card');
    container.innerHTML = '';

    if (!productList || productList.length === 0) {
        container.innerHTML = '<p>Keine Produkte gefunden.</p>';
        return;
    }

    productList.forEach(product => {
        // 'menge' ist die verbleibende Menge nach Warenkorb-Synchronisation
        const isOutOfStock = product.menge <= 0;
        let stockMessage ='';

        if (product.menge <= 0) {
            stockMessage = 'Nicht mehr im Vorrat';
        } else if (product.menge < 5) {
            stockMessage = 'Nur noch wenige auf Lager';
        } else {
            stockMessage = 'Im Vorrat';
        }

        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200?text=No+Image';

        const card = document.createElement('div');
        card.classList.add('product');
        if (isOutOfStock) {
            card.classList.add('out-of-stock');
        }
        card.innerHTML = `
            ${product.bild ? `<img src="${imageUrl}" alt="${product.produktname}">` : ''}
            <h3>${product.produktname}</h3>
            <p>${product.kategorie}</p>
            <p><strong>€${parseFloat(product.preis).toFixed(2)}</strong></p>
            <p class="product-stock-info">${stockMessage}</p>
            <button class="add-to-cart-initial" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Nicht vorrätig' : 'In den Warenkorb'}
            </button>
            `;
        container.appendChild(card);

        card.addEventListener('click', (event) => {
            // Nur das Modal öffnen, wenn nicht der "In den Warenkorb"-Button geklickt wurde
            if (!event.target.classList.contains('add-to-cart-initial')) {
                openProductModal(product);
            }
        });

        const AddToCartButton = card.querySelector('.add-to-cart-initial');
        AddToCartButton.addEventListener('click', async (event) => {
            event.stopPropagation(); // Verhindert, dass das Modal geöffnet wird
            if (product.menge > 0) {
                // Hier wird versucht, 1 Stück hinzuzufügen
                await addToCartAPI(product, 1);
            } else {
                alert("Dieses Produkt ist leider nicht mehr vorrätig.");
            }
        });
    });
}

filterForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const filters = {};

    const nameFilter = filterForm.elements["name"].value.trim();
    if (nameFilter) filters.name = nameFilter; // Nur hinzufügen, wenn Wert vorhanden

    const maxPriceValue = filterForm.elements["maxPreis"].value.trim();
    const maxPriceFilter = parseFloat(maxPriceValue);
    if (!isNaN(maxPriceFilter) && maxPriceValue !== '') filters.maxPreis = maxPriceFilter;

    const minMengeValue = filterForm.elements["minMenge"].value.trim();
    const minMengeFilter = parseInt(minMengeValue);
    if (!isNaN(minMengeFilter) && minMengeValue !== '') filters.minMenge = minMengeFilter;

    const selectedCategory = filterForm.elements["kategorie"].value;
    if (selectedCategory && selectedCategory !== "Kategorie" && selectedCategory !== "All") {
        filters.kategorie = selectedCategory;
    } else {
        filters.kategorie = "";
    }

    const selectedSort = filterForm.elements["sortierung"].value;
    if (selectedSort && selectedSort !== "") {
        filters.sortierung = selectedSort;
    } else {
        filters.sortierung = "";
    }

    fetchProducts(filters, `${API_INV_BASE_URL}/product/search/`);
});

async function fetchProducts(filters = {}, baseUrl = `${API_INV_BASE_URL}/product/all`) {
    const query = new URLSearchParams(filters).toString();
    const url = query ? `${baseUrl}?${query}` : baseUrl;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const productsFromApi = await response.json();

        // Speichere die originalen Mengen, bevor der Warenkorb synchronisiert wird
        allProductsCache = productsFromApi.map(p => ({
            ...p,
            originalMenge: p.menge // Originalmenge aus der Datenbank
        }));

        await loadAndSyncCart(); // Synchronisiere den Warenkorb und aktualisiere Mengen
        renderProducts(allProductsCache); // Render die Produkte mit den aktualisierten Mengen

    } catch (error) {
        console.error("Fehler beim Laden der Produkte:", error);
        const container = document.querySelector('.product-card');
        container.innerHTML = '<p>Produkte konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>';
    }
}

// Wird beim DOMContentLoaded aufgerufen
window.addEventListener("DOMContentLoaded", () => {
    fetchProducts({}, `${API_INV_BASE_URL}/product/search/`);
});

async function addToCartAPI(productToAdd, anzahl = 1) {
    const userToken = getCurrentUserToken(); // Holt den aktuellen Token

    // Produkt im Cache finden, um die aktuelle Menge zu überprüfen
    const productInCache = allProductsCache.find(p => p.produktid === productToAdd.produktid);
    if (!productInCache) {
        alert("Fehler: Produktinformationen nicht gefunden. Bitte Seite neu laden.");
        return;
    }

    // Menge im Warenkorb für dieses Produkt finden
    const currentQuantityInCart = currentCart.find(item => item.produktid === productToAdd.produktid)?.anzahl || 0;

    // Überprüfen, ob genügend Bestand für die zusätzlich gewünschte Menge vorhanden ist
    if (productInCache.originalMenge < (currentQuantityInCart + anzahl)) {
        alert(`Nicht genügend Produkte auf Lager! Maximal verfügbar: ${productInCache.originalMenge - currentQuantityInCart}`);
        return;
    }

    if (userToken) {
        // Benutzer ist angemeldet, verwende Backend-Warenkorb
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ produktid: productToAdd.produktid, anzahl }) // Füge die gewünschte Anzahl hinzu
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                    // Hier sollte der userToken entfernt und der lokale Warenkorb gelöscht werden,
                    // da der Backend-Warenkorb nicht zugänglich ist.
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('cart'); // Auch lokalen Warenkorb leeren
                    updateCartCount(); // Warenkorb-Anzeige aktualisieren
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                const errorData = await response.json();
                throw new Error(`Fehler beim Hinzufügen zum Warenkorb: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            // Nach erfolgreichem Hinzufügen zum Backend-Warenkorb, den Cache und die Anzeige aktualisieren
            await loadAndSyncCart(); // Ruft den aktualisierten Warenkorb vom Backend ab und aktualisiert Mengen
            renderProducts(allProductsCache); // Rendert Produkte neu mit korrigierter Menge
            alert("Produkt erfolgreich zum Warenkorb hinzugefügt!"); // Bestätigungsnachricht
            return result;
        } catch (error) {
            console.error("Fehler beim Hinzufügen zum Warenkorb (API):", error);
            alert("Fehler beim Hinzufügen zum Warenkorb: " + error.message);
        }
    } else {
        // Benutzer ist nicht angemeldet, verwende LocalStorage-Warenkorb
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex(item => item.produktid === productToAdd.produktid);

        if (existingItemIndex !== -1) {
            // Prüfen, ob die Gesamtmenge die Originalmenge nicht übersteigt
            if (cart[existingItemIndex].quantity + anzahl > productInCache.originalMenge) {
                alert(`Sie können nicht mehr als ${productInCache.originalMenge} dieses Produkts hinzufügen.`);
                return;
            }
            cart[existingItemIndex].quantity += anzahl;
        } else {
            // Prüfen, ob die gewünschte Menge die Originalmenge nicht übersteigt
            if (anzahl > productInCache.originalMenge) {
                alert(`Nicht genügend Produkte auf Lager! Maximal verfügbar: ${productInCache.originalMenge}`);
                return;
            }
            cart.push({ ...productToAdd, quantity: anzahl });
        }
        localStorage.setItem("cart", JSON.stringify(cart));

        // Aktualisiere den Cache und die Anzeige für den lokalen Warenkorb
        await loadAndSyncCart(); // Aktualisiert die Menge im Cache basierend auf dem lokalen Warenkorb
        renderProducts(allProductsCache);
        updateCartCount();
        alert("Produkt lokal zum Warenkorb hinzugefügt."); // Bestätigungsnachricht
        return { message: "Produkt lokal zum Warenkorb hinzugefügt." };
    }
}

function updateCartCount() {
    const userToken = getCurrentUserToken();
    if (userToken) {
        // Wenn angemeldet, Warenkorb-Anzeige von Backend-Daten ableiten (da loadAndSyncCart das aktualisiert hat)
        const count = currentCart.reduce((sum, item) => sum + (item.anzahl || 0), 0);
        const cartCountElement = document.getElementById("cart-count");
        if(cartCountElement) {
            cartCountElement.textContent = count;
        }
    } else {
        // Wenn nicht angemeldet, Warenkorb-Anzeige vom lokalen Warenkorb ableiten
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const cartCountElement = document.getElementById("cart-count");
        if(cartCountElement) {
            cartCountElement.textContent = count;
        }
    }
}

// Passt die Mengen der Produkte im Cache basierend auf dem aktuellen Warenkorb an
async function loadAndSyncCart() {
    const userToken = getCurrentUserToken();
    let tempProducts = [...allProductsCache]; // Eine Kopie des Caches

    if (userToken) {
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/myproducts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            if (response.ok) {
                const backendCartItems = await response.json();
                currentCart = backendCartItems.map(item => ({ ...item.product, anzahl: item.anzahl }));

                // Aktualisiere die Mengen im tempProducts basierend auf dem Backend-Warenkorb
                tempProducts = tempProducts.map(product => {
                    const cartItem = currentCart.find(item => item.produktid === product.produktid);
                    // Die verfügbare Menge ist die Originalmenge minus der Menge im Warenkorb
                    const newMenge = product.originalMenge - (cartItem ? cartItem.anzahl : 0);
                    return { ...product, menge: Math.max(0, newMenge) }; // Menge nicht unter 0 fallen lassen
                });

                // Optional: Lokalen Warenkorb mit Backend-Daten synchronisieren, wenn angemeldet
                // Dies kann hilfreich sein, falls der Backend-Warenkorb beim Logout nicht sofort verfügbar ist
                localStorage.setItem("cart", JSON.stringify(currentCart.map(item => ({...item, quantity: item.anzahl}))));

            } else if (response.status === 401 || response.status === 403) {
                // Token abgelaufen oder ungültig, den lokalen Zustand leeren
                console.warn("Sitzung abgelaufen oder nicht autorisiert während Warenkorb-Synchronisation. Lokaler Warenkorb wird geleert.");
                localStorage.removeItem('userToken');
                localStorage.removeItem('cart');
                currentCart = [];
                // Mengen in tempProducts auf original zurücksetzen, da kein eingeloggter Warenkorb existiert
                tempProducts = tempProducts.map(product => ({ ...product, menge: product.originalMenge }));
            } else {
                console.error("Fehler beim Abrufen des Warenkorbs für Synchronisation:", response.statusText);
                currentCart = [];
                // Im Fehlerfall den Cache auf Originalmengen setzen, da wir den Warenkorb nicht kennen
                tempProducts = tempProducts.map(product => ({ ...product, menge: product.originalMenge }));
            }
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs für Synchronisation (API):", error);
            currentCart = [];
            // Im Fehlerfall den Cache auf Originalmengen setzen
            tempProducts = tempProducts.map(product => ({ ...product, menge: product.originalMenge }));
        }
    } else {
        // Benutzer ist nicht angemeldet, Warenkorb kommt nur aus LocalStorage
        currentCart = JSON.parse(localStorage.getItem("cart")) || [];
        tempProducts = tempProducts.map(product => {
            const cartItem = currentCart.find(item => item.produktid === product.produktid);
            // Die verfügbare Menge ist die Originalmenge minus der Menge im lokalen Warenkorb
            const newMenge = product.originalMenge - (cartItem ? cartItem.quantity : 0);
            return { ...product, menge: Math.max(0, newMenge) }; // Menge nicht unter 0 fallen lassen
        });
    }
    allProductsCache = tempProducts; // Aktualisiere den globalen Cache
    updateCartCount(); // Aktualisiere die Warenkorb-Anzeige
}

function openProductModal(product){
    currentProductInModal = product;
    const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200?text=No+Image';
    modalImage.src = imageUrl;
    modalImage.alt = product.produktname;
    modalName.textContent = product.produktname;
    modalDescription.textContent = product.beschreibung || 'Keine detaillierte Beschreibung verfügbar.';
    modalCategory.textContent = `Kategorie: ${product.kategorie}`;
    modalPrice.textContent = `Preis: €${parseFloat(product.preis).toFixed(2)}`;

    // Menge im Modal und Button-Status basierend auf der aktuellen 'menge' im Cache
    const productInCache = allProductsCache.find(p => p.produktid === product.produktid);
    const availableQuantity = productInCache ? productInCache.menge : 0;

    if (modalQuantity) {
        modalQuantity.textContent = `Verfügbare Menge: ${availableQuantity}`;
        if (addToCartModalButton) {
            if (availableQuantity <= 0) {
                addToCartModalButton.disabled = true;
                addToCartModalButton.textContent = 'Nicht vorrätig';
                addToCartModalButton.style.backgroundColor = '#ccc';
            } else {
                addToCartModalButton.disabled = false;
                addToCartModalButton.textContent = 'In den Warenkorb';
                addToCartModalButton.style.backgroundColor = '#333'; // Oder deine Standardfarbe
            }
        }
    }

    scrollPosition = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;

    productDetailModal.classList.add('is-expanded');
}

function closeProductModal(){
    productDetailModal.classList.remove('is-expanded');

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';

    window.scrollTo(0, scrollPosition);
}

closeButton.addEventListener('click', closeProductModal);

productDetailModal.addEventListener('click', (event) =>{
    if (event.target === productDetailModal){
        closeProductModal();
    }
});

if(addToCartModalButton){
    addToCartModalButton.addEventListener("click", async (event) =>{
        event.stopPropagation();
        if (currentProductInModal) {
            // Menge im Modal basierend auf Cache überprüfen, nicht currentProductInModal.menge,
            // da currentProductInModal nicht sofort aktualisiert wird.
            const productInCache = allProductsCache.find(p => p.produktid === currentProductInModal.produktid);
            if (productInCache && productInCache.menge > 0){
                await addToCartAPI(currentProductInModal, 1); // Füge 1 zum Warenkorb hinzu
                // Aktualisiere das Modal nach dem Hinzufügen zum Warenkorb
                if (modalQuantity) {
                    const updatedProductInCache = allProductsCache.find(p => p.produktid === currentProductInModal.produktid);
                    if (updatedProductInCache) {
                        modalQuantity.textContent = `Verfügbare Menge: ${updatedProductInCache.menge}`;
                        if (updatedProductInCache.menge <= 0) {
                            addToCartModalButton.disabled = true;
                            addToCartModalButton.textContent = 'Nicht vorrätig';
                            addToCartModalButton.style.backgroundColor = '#ccc';
                        }
                    }
                }
            } else {
                alert("Dieses Produkt ist leider nicht mehr vorrätig.");
            }
        }
    });
}

// Listener für 'cartItemRemoved' (wenn etwas aus dem Warenkorb entfernt wird)
window.addEventListener('cartItemRemoved', async (event) => {
    // Menge im Cache aktualisieren und Produkte neu rendern
    await loadAndSyncCart(); // Ruft den aktuellen Warenkorb-Status ab und aktualisiert Cache
    renderProducts(allProductsCache); // Rendert die Produkte neu mit den korrigierten Mengen
});

// Listener für 'cartCleared' (wenn der gesamte Warenkorb geleert wird)
window.addEventListener('cartCleared', async () => {
    await loadAndSyncCart(); // Ruft den aktuellen Warenkorb-Status ab und aktualisiert Cache
    renderProducts(allProductsCache); // Rendert die Produkte neu mit den korrigierten Mengen
});