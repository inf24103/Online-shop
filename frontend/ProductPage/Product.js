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

        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200';

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
                await addToCartAPI(product);
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
    filters.name = nameFilter;

    const maxPriceValue = filterForm.elements["maxPreis"].value.trim();
    const maxPriceFilter = parseFloat(maxPriceValue);
    filters.maxPreis = !isNaN(maxPriceFilter) && maxPriceValue !== '' ? maxPriceFilter : 0;

    const minMengeValue = filterForm.elements["minMenge"].value.trim();
    const minMengeFilter = parseInt(minMengeValue);
    filters.minMenge = !isNaN(minMengeFilter) && minMengeValue !== '' ? minMengeFilter : 0;

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

    fetchProducts(filters, 'http://localhost:3000/api/inv/product/search/');
});

async function fetchProducts(filters = {}, baseUrl = 'http://localhost:3000/api/inv/product/all') {
    const query = new URLSearchParams(filters).toString();
    const url = query ? `${baseUrl}?${query}` : baseUrl;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const productsFromApi = await response.json();

        allProductsCache = productsFromApi.map(p => ({ ...p,
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
    fetchProducts({}, 'http://localhost:3000/api/inv/product/search/');
});

async function addToCartAPI(productToAdd, anzahl = 1) {
    const userToken = localStorage.getItem('adminToken');

    if (productToAdd.menge < anzahl) {
        alert("Nicht genügend Produkte auf Lager!");
        return;
    }

    if (userToken) {
        try {
            const response = await fetch('http://localhost:3000/api/inv/warenkorb/add', {
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
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                const errorData = await response.json();
                throw new Error(`Fehler beim Hinzufügen zum Warenkorb: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            const updatedProductIndex = allProductsCache.findIndex(p => p.produktid === productToAdd.produktid);
            if (updatedProductIndex !== -1) {
                allProductsCache[updatedProductIndex].menge -= anzahl;
                renderProducts(allProductsCache);
            }
            updateCartCount();
            return result;
        } catch (error) {
            console.error("Fehler beim Hinzufügen zum Warenkorb:", error);
            alert("Fehler beim Hinzufügen zum Warenkorb: " + error.message);
        }
    } else {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingItemIndex = cart.findIndex(item => item.produktid === productToAdd.produktid);

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += anzahl;
        } else {
            cart.push({ ...productToAdd, quantity: anzahl });
        }
        localStorage.setItem("cart", JSON.stringify(cart));

        const updatedProductIndex = allProductsCache.findIndex(p => p.produktid === productToAdd.produktid);
        if (updatedProductIndex !== -1) {
            allProductsCache[updatedProductIndex].menge -= anzahl;
            renderProducts(allProductsCache);
        }
        updateCartCount();
        return { message: "Produkt lokal zum Warenkorb hinzugefügt." };
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || item.anzahl || 0), 0);
    const cartCountElement = document.getElementById("cart-count");
    if(cartCountElement) {
        cartCountElement.textContent = count;
    }
}

async function loadAndSyncCart() {
    const userToken = localStorage.getItem('adminToken');
    let tempProducts = [...allProductsCache];

    if (userToken) {
        try {
            const response = await fetch('http://localhost:3000/api/inv/warenkorb/myproducts', {
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
                    if (cartItem) {
                        return { ...product,
                            menge: product.originalMenge - cartItem.anzahl
                        };
                    }
                    return product;
                });
            } else {
                currentCart = [];
            }
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs für Synchronisation:", error);
            currentCart = [];
        }
    } else {
        currentCart = JSON.parse(localStorage.getItem("cart")) || [];
        tempProducts = tempProducts.map(product => {
            const cartItem = currentCart.find(item => item.produktid === product.produktid);
            if (cartItem) {
                return { ...product,
                    menge: product.originalMenge - cartItem.quantity
                };
            }
            return product;
        });
    }
    allProductsCache = tempProducts;
    updateCartCount();
}

function openProductModal(product){
    currentProductInModal = product;
    const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200';
    modalImage.src = imageUrl;
    modalImage.alt = product.produktname;
    modalName.textContent = product.produktname;
    modalDescription.textContent = product.beschreibung || 'Keine detaillierte Beschreibung verfügbar.';
    modalCategory.textContent = `Kategorie: ${product.kategorie}`;
    modalPrice.textContent = `Preis: €${parseFloat(product.preis).toFixed(2)}`;
    if (modalQuantity) {
        modalQuantity.textContent = `Verfügbare Menge: ${product.menge}`;
        if (addToCartModalButton) {
            if (product.menge <= 0) {
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
        if (currentProductInModal && currentProductInModal.menge > 0){
            await addToCartAPI(currentProductInModal);
            if (modalQuantity) {
                modalQuantity.textContent = `Verfügbare Menge: ${currentProductInModal.menge}`;
                if (currentProductInModal.menge <= 0) {
                    addToCartModalButton.disabled = true;
                    addToCartModalButton.textContent = 'Nicht vorrätig';
                    addToCartModalButton.style.backgroundColor = '#ccc';
                }
            }
        } else {
            alert("Dieses Produkt ist leider nicht mehr vorrätig.");
        }
    });
}

window.addEventListener("DOMContentLoaded", () =>{
    fetchProducts({}, 'http://localhost:3000/api/inv/product/search/');
});

window.addEventListener('cartItemRemoved', async (event) => {
    const { produktid, anzahl } = event.detail;

    const updatedProductIndex = allProductsCache.findIndex(p => p.produktid === produktid);
    if (updatedProductIndex !== -1) {
        allProductsCache[updatedProductIndex].menge = Math.min(
            allProductsCache[updatedProductIndex].originalMenge,
            allProductsCache[updatedProductIndex].menge + anzahl
        );
        renderProducts(allProductsCache);
    }
    await loadAndSyncCart();
});