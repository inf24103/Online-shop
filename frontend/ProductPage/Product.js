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
let allProductsCache = [];
let currentCart = [];

let scrollPosition = 0;

const IMAGE_BASE_URL = 'http://localhost:3000/';
const API_INV_BASE_URL = 'http://localhost:3000/api/inv';
const API_USER_BASE_URL = 'http://localhost:3000/api/user';

function getCurrentUserToken() {
    return localStorage.getItem('userToken');
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
            if (!event.target.classList.contains('add-to-cart-initial')) {
                openProductModal(product);
            }
        });

        const AddToCartButton = card.querySelector('.add-to-cart-initial');
        AddToCartButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            if (product.menge > 0) {
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
    if (nameFilter) filters.name = nameFilter;

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

        allProductsCache = productsFromApi.map(p => ({
            ...p,
            originalMenge: p.menge
        }));

        await loadAndSyncCart();
        renderProducts(allProductsCache);

    } catch (error) {
        console.error("Fehler beim Laden der Produkte:", error);
        const container = document.querySelector('.product-card');
        container.innerHTML = '<p>Produkte konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>';
    }
}

window.addEventListener("DOMContentLoaded", () => {
    fetchProducts({}, `${API_INV_BASE_URL}/product/search/`);
});

async function addToCartAPI(productToAdd, anzahl = 1) {
    const userToken = getCurrentUserToken();

    const productInCache = allProductsCache.find(p => p.produktid === productToAdd.produktid);
    if (!productInCache) {
        alert("Fehler: Produktinformationen nicht gefunden. Bitte Seite neu laden.");
        return;
    }

    const currentQuantityInCart = currentCart.find(item => item.produktid === productToAdd.produktid)?.anzahl || 0;

    if (productInCache.originalMenge < (currentQuantityInCart + anzahl)) {
        alert(`Nicht genügend Produkte auf Lager! Maximal verfügbar: ${productInCache.originalMenge - currentQuantityInCart}`);
        return;
    }

    if (userToken) {
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ produktid: productToAdd.produktid, anzahl })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('cart');
                    updateCartCount();
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                const errorData = await response.json();
                throw new Error(`Fehler beim Hinzufügen zum Warenkorb: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            await loadAndSyncCart();
            renderProducts(allProductsCache);
            alert("Produkt erfolgreich zum Warenkorb hinzugefügt!");
            return result;
        } catch (error) {
            console.error("Fehler beim Hinzufügen zum Warenkorb (API):", error);
            alert("Fehler beim Hinzufügen zum Warenkorb: " + error.message);
        }
    } else {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex(item => item.produktid === productToAdd.produktid);

        if (existingItemIndex !== -1) {
            if (cart[existingItemIndex].quantity + anzahl > productInCache.originalMenge) {
                alert(`Sie können nicht mehr als ${productInCache.originalMenge} dieses Produkts hinzufügen.`);
                return;
            }
            cart[existingItemIndex].quantity += anzahl;
        } else {
            if (anzahl > productInCache.originalMenge) {
                alert(`Nicht genügend Produkte auf Lager! Maximal verfügbar: ${productInCache.originalMenge}`);
                return;
            }
            cart.push({ ...productToAdd, quantity: anzahl });
        }
        localStorage.setItem("cart", JSON.stringify(cart));

        await loadAndSyncCart();
        renderProducts(allProductsCache);
        updateCartCount();
        alert("Produkt lokal zum Warenkorb hinzugefügt.");
        return { message: "Produkt lokal zum Warenkorb hinzugefügt." };
    }
}

function updateCartCount() {
    const userToken = getCurrentUserToken();
    if (userToken) {
        const count = currentCart.reduce((sum, item) => sum + (item.anzahl || 0), 0);
        const cartCountElement = document.getElementById("cart-count");
        if(cartCountElement) {
            cartCountElement.textContent = count;
        }
    } else {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const cartCountElement = document.getElementById("cart-count");
        if(cartCountElement) {
            cartCountElement.textContent = count;
        }
    }
}

async function loadAndSyncCart() {
    const userToken = getCurrentUserToken();
    let tempProducts = [...allProductsCache];

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

                tempProducts = tempProducts.map(product => {
                    const cartItem = currentCart.find(item => item.produktid === product.produktid);
                    const newMenge = product.originalMenge - (cartItem ? cartItem.anzahl : 0);
                    return { ...product, menge: Math.max(0, newMenge) };
                });

                localStorage.setItem("cart", JSON.stringify(currentCart.map(item => ({...item, quantity: item.anzahl}))));

            } else if (response.status === 401 || response.status === 403) {
                console.warn("Sitzung abgelaufen oder nicht autorisiert während Warenkorb-Synchronisation. Lokaler Warenkorb wird geleert.");
                localStorage.removeItem('userToken');
                localStorage.removeItem('cart');
                currentCart = [];
                tempProducts = tempProducts.map(product => ({ ...product, menge: product.originalMenge }));
            } else {
                console.error("Fehler beim Abrufen des Warenkorbs für Synchronisation:", response.statusText);
                currentCart = [];
                tempProducts = tempProducts.map(product => ({ ...product, menge: product.originalMenge }));
            }
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs für Synchronisation (API):", error);
            currentCart = [];
            tempProducts = tempProducts.map(product => ({ ...product, menge: product.originalMenge }));
        }
    } else {
        currentCart = JSON.parse(localStorage.getItem("cart")) || [];
        tempProducts = tempProducts.map(product => {
            const cartItem = currentCart.find(item => item.produktid === product.produktid);
            const newMenge = product.originalMenge - (cartItem ? cartItem.quantity : 0);
            return { ...product, menge: Math.max(0, newMenge) };
        });
    }
    allProductsCache = tempProducts;
    updateCartCount();
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
            const productInCache = allProductsCache.find(p => p.produktid === currentProductInModal.produktid);
            if (productInCache && productInCache.menge > 0){
                await addToCartAPI(currentProductInModal, 1);
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

window.addEventListener('cartItemRemoved', async (event) => {
    await loadAndSyncCart();
    renderProducts(allProductsCache);
});

window.addEventListener('cartCleared', async () => {
    await loadAndSyncCart();
    renderProducts(allProductsCache);
});