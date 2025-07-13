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
let allProductsWithRawStock = [];
let currentCartItems = [];

let scrollPosition = 0;

const IMAGE_BASE_URL = 'http://localhost:3000/';
const API_INV_BASE_URL = 'http://localhost:3000/api/inv';

function updateCartCount() {
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
        const count = currentCartItems.reduce((sum, item) => sum + (item.anzahl || item.quantity || 0), 0);
        cartCountElement.textContent = count;
    }
}

function renderProducts(productList) {
    const container = document.querySelector('.product-card');
    container.innerHTML = '';

    if (!productList || productList.length === 0) {
        container.innerHTML = '<p>Keine Produkte gefunden.</p>';
        return;
    }

    productList.forEach(product => {
        const isOutOfStock = product.menge <= 0;
        let stockMessage = '';

        if (product.menge <= 0) {
            stockMessage = 'Nicht mehr im Vorrat';
        } else if (product.menge < 5) {
            stockMessage = `Nur noch ${product.menge} auf Lager`;
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
            if (!event.target.classList.contains('add-to-cart-initial')) {
                openProductModal(product);
            }
        });

        const AddToCartButton = card.querySelector('.add-to-cart-initial');
        AddToCartButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            if (product.menge > 0) {
                await addToCartAPI(product, 1);
            }
        });
    });
}

filterForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const filters = {};

    const nameFilter = filterForm.elements["name"].value.trim();
    if (nameFilter) filters.name = nameFilter;

    const maxPriceValue = filterForm.elements["maxPreis"].value.trim();
    const maxPriceFilter = parseFloat(maxPriceValue);
    if (!isNaN(maxPriceFilter) && maxPriceValue !== '') filters.maxPreis = maxPriceFilter;

    const selectedCategory = filterForm.elements["kategorie"].value;
    if (selectedCategory && selectedCategory !== "Kategorie" && selectedCategory !== "All") {
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

    fetchProducts(filters);
});

async function fetchProducts(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const url = query ? `${API_INV_BASE_URL}/product/search/?${query}` : `${API_INV_BASE_URL}/product/search/`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const productsFromApi = await response.json();

        allProductsWithRawStock = productsFromApi.map(p => ({
            ...p,
            originalMenge: p.menge
        }));

        await loadAndSyncCart();
        renderProducts(allProductsWithRawStock);
    } catch (error) {
        console.error("Fehler beim Laden der Produkte:", error);
        const container = document.querySelector('.product-card');
        container.innerHTML = '<p>Produkte konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>';
    }
}

async function addToCartAPI(productToAdd, anzahl = 1) {
    const isLoggedIn = document.cookie.includes('token=');

    const productInRawStock = allProductsWithRawStock.find(p => p.produktid === productToAdd.produktid);
    if (!productInRawStock) {
        alert("Fehler: Produktinformationen nicht gefunden. Bitte Seite neu laden.");
        return;
    }

    const currentQuantityInCart = currentCartItems.find(item => item.produktid === productToAdd.produktid)?.anzahl || 0;
    const remainingStockForUser = productInRawStock.originalMenge - currentQuantityInCart;

    if (anzahl > remainingStockForUser) {
        alert(`Nicht genügend Produkte auf Lager! Sie können maximal ${remainingStockForUser} weitere von diesem Produkt hinzufügen. (Insgesamt ${productInRawStock.originalMenge} verfügbar)`);
        return;
    }

    if (isLoggedIn) {
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/add`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ produktid: productToAdd.produktid, anzahl: currentQuantityInCart + anzahl })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                    localStorage.removeItem('cart');
                    currentCartItems = [];
                    updateCartCount();
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                const errorData = await response.json();
                throw new Error(`Fehler beim Hinzufügen zum Warenkorb: ${errorData.message || response.statusText}`);
            }
            await loadAndSyncCart();
            renderProducts(allProductsWithRawStock);
        } catch (error) {
            console.error("Fehler beim Hinzufügen zum Warenkorb (API):", error);
            alert("Fehler beim Hinzufügen zum Warenkorb: " + error.message);
        }
    } else {
        let localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = localCart.findIndex(item => item.produktid === productToAdd.produktid);

        if (existingItemIndex !== -1) {
            const newLocalQuantity = localCart[existingItemIndex].quantity + anzahl;
            if (newLocalQuantity > productInRawStock.originalMenge) {
                alert(`Sie können nicht mehr als ${productInRawStock.originalMenge} dieses Produkts insgesamt hinzufügen.`);
                return;
            }
            localCart[existingItemIndex].quantity = newLocalQuantity;
            localCart[existingItemIndex].anzahl = newLocalQuantity;
        } else {
            if (anzahl > productInRawStock.originalMenge) {
                alert(`Nicht genügend Produkte auf Lager! Maximal verfügbar: ${productInRawStock.originalMenge}`);
                return;
            }
            localCart.push({ ...productToAdd, quantity: anzahl, anzahl: anzahl, availableStock: productInRawStock.originalMenge });
        }
        localStorage.setItem("cart", JSON.stringify(localCart));

        await loadAndSyncCart();
        renderProducts(allProductsWithRawStock);
    }
}

async function loadAndSyncCart() {
    const isLoggedIn = document.cookie.includes('token=');

    if (isLoggedIn) {
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/myproducts`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                const backendCartResponse = await response.json();
                currentCartItems = backendCartResponse.map(item => ({
                    produktid: item.produktid,
                    produktname: item.produktname,
                    preis: item.preis,
                    menge: item.menge,
                    bild: item.bild,
                    kategorie: item.kategorie,
                    beschreibung: item.beschreibung,
                    anzahl: item.anzahl,
                    quantity: item.anzahl
                }));

                allProductsWithRawStock = allProductsWithRawStock.map(product => {
                    const cartItem = currentCartItems.find(item => item.produktid === product.produktid);
                    const quantityInCart = cartItem ? (cartItem.anzahl || 0) : 0;
                    const newDisplayMenge = product.originalMenge - quantityInCart;
                    return { ...product, menge: Math.max(0, newDisplayMenge) };
                });

                localStorage.setItem("cart", JSON.stringify(currentCartItems));

            } else if (response.status === 401 || response.status === 403) {
                console.warn("Sitzung abgelaufen oder nicht autorisiert während Warenkorb-Synchronisation. Lokaler Warenkorb wird geleert.");
                localStorage.removeItem('cart');
                currentCartItems = [];
                allProductsWithRawStock = allProductsWithRawStock.map(product => ({ ...product, menge: product.originalMenge }));
            } else {
                console.error("Fehler beim Abrufen des Warenkorbs für Synchronisation:", response.statusText);
                currentCartItems = [];
                allProductsWithRawStock = allProductsWithRawStock.map(product => ({ ...product, menge: product.originalMenge }));
            }
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs für Synchronisation (API):", error);
            currentCartItems = [];
            allProductsWithRawStock = allProductsWithRawStock.map(product => ({ ...product, menge: product.originalMenge }));
        }
    } else {
        currentCartItems = JSON.parse(localStorage.getItem("cart")) || [];
        allProductsWithRawStock = allProductsWithRawStock.map(product => {
            const cartItem = currentCartItems.find(item => item.produktid === product.produktid);
            const quantityInCart = cartItem ? (cartItem.quantity || 0) : 0;
            const newDisplayMenge = product.originalMenge - quantityInCart;
            return { ...product, menge: Math.max(0, newDisplayMenge) };
        });
    }
    updateCartCount();
}

function openProductModal(product) {
    currentProductInModal = product;

    const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200?text=No+Image';
    modalImage.src = imageUrl;
    modalImage.alt = product.produktname;
    modalName.textContent = product.produktname;
    modalDescription.textContent = product.beschreibung || 'Keine detaillierte Beschreibung verfügbar.';
    modalCategory.textContent = `Kategorie: ${product.kategorie}`;
    modalPrice.textContent = `Preis: €${parseFloat(product.preis).toFixed(2)}`;

    const availableQuantityForUser = product.menge;

    if (modalQuantity) {
        modalQuantity.textContent = `Verfügbare Menge: ${availableQuantityForUser}`;
        if (addToCartModalButton) {
            if (availableQuantityForUser <= 0) {
                addToCartModalButton.disabled = true;
                addToCartModalButton.textContent = 'Nicht vorrätig';
                addToCartModalButton.style.backgroundColor = '#ccc';
            } else {
                addToCartModalButton.disabled = false;
                addToCartModalButton.textContent = 'In den Warenkorb';
                addToCartModalButton.style.backgroundColor = '#333';
            }
        }
    }

    scrollPosition = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;

    productDetailModal.classList.add('is-expanded');
}

function closeProductModal() {
    productDetailModal.classList.remove('is-expanded');

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';

    window.scrollTo(0, scrollPosition);
}

closeButton.addEventListener('click', closeProductModal);

productDetailModal.addEventListener('click', (event) => {
    if (event.target === productDetailModal) {
        closeProductModal();
    }
});

if (addToCartModalButton) {
    addToCartModalButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (currentProductInModal) {
            if (currentProductInModal.menge > 0) {
                await addToCartAPI(currentProductInModal, 1);
                openProductModal(allProductsWithRawStock.find(p => p.produktid === currentProductInModal.produktid));
            } else {
                alert("Dieses Produkt ist leider nicht mehr vorrätig oder die gewünschte Menge ist nicht verfügbar.");
            }
        }
    });
}

window.addEventListener('cartItemRemoved', async (event) => {
    await loadAndSyncCart();
    renderProducts(allProductsWithRawStock);
});

window.addEventListener('cartCleared', async () => {
    await loadAndSyncCart();
    renderProducts(allProductsWithRawStock);
});

window.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
});