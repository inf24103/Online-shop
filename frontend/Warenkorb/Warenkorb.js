const cartContainer = document.querySelector('.cart-items');
const totalPriceElement = document.getElementById('total-price');
const checkoutButton = document.getElementById('checkout-button');
const DeleteNotification = document.getElementById('deleteNotification');
const API_INV_BASE_URL = 'http://localhost:3000/api/inv';
const IMAGE_BASE_URL = 'http://localhost:3000/';

function showDeleteNotification() {
    if (DeleteNotification) {
        DeleteNotification.classList.add('show');
        setTimeout(() => {
            DeleteNotification.classList.remove('show');
        }, 2000);
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || item.anzahl || 0), 0);
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

async function fetchCart() {
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

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn("Sitzung abgelaufen oder nicht autorisiert. Leere lokalen Warenkorb.");
                    localStorage.removeItem('cart');
                    updateCartCount();
                    return [];
                }
                throw new Error(`Fehler beim Laden des Backend-Warenkorbs: ${response.statusText}`);
            }
            const cartData = await response.json();

            const backendCart = cartData.map(item => ({
                produktid: item.produktid,
                produktname: item.produktname,
                preis: item.preis,
                bild: item.bild,
                kategorie: item.kategorie,
                beschreibung: item.beschreibung,
                anzahl: item.anzahl,
                originalMenge: item.menge
            }));

            localStorage.setItem("cart", JSON.stringify(backendCart));
            return backendCart;
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs vom Backend:", error);
            alert("Fehler beim Laden Ihres Warenkorbs. Bitte versuchen Sie es erneut.");
            const localCart = JSON.parse(localStorage.getItem("cart")) || [];
            return localCart.map(item => ({
                ...item,
                anzahl: item.quantity || item.anzahl || 1,
                quantity: item.quantity || item.anzahl || 1,
                originalMenge: item.originalMenge || item.menge || Infinity
            }));
        }
    }

    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    return localCart.map(item => ({
        ...item,
        anzahl: item.quantity || item.anzahl || 1,
        quantity: item.quantity || item.anzahl || 1,
        originalMenge: item.originalMenge || item.menge || Infinity
    }));
}

async function renderCart() {
    const cartItems = await fetchCart();
    const isLoggedIn = document.cookie.includes('token=');

    cartContainer.innerHTML = "";
    let total = 0;

    if (cartItems.length === 0) {
        const emptyMessageDiv = document.createElement("div");
        emptyMessageDiv.className = "empty-cart-message";
        emptyMessageDiv.innerHTML = `
            <p>Ihr Warenkorb ist leer.</p>
            <p>Entdecken Sie unsere Produkte und füllen Sie ihn!</p>
            <a href="../ProductPage/productpage.html">
                <button>Zum Shop</button>
            </a>
            <p>Falls Sie nicht angemeldet sind, machen Sie das bitte bevor Ihr Warenkorb verloren geht!</p>
            <a href="../LoginPage/loginpage.html">
                <button>Zum LogIn</button>
            </a>
        `;
        cartContainer.appendChild(emptyMessageDiv);
        totalPriceElement.textContent = `€0.00`;
        if (checkoutButton) {
            checkoutButton.style.display = 'none';
        }
        updateCartCount();
        return;
    }

    if (checkoutButton) {
        checkoutButton.style.display = 'block';
    }

    const itemsToRender = [];

    for (const product of cartItems) {
        let itemQuantity = product.anzahl;
        let maxAvailableQuantity = product.originalMenge;

        if (itemQuantity > maxAvailableQuantity) {
            console.warn(`Menge für "${product.produktname}" (${itemQuantity}) überschreitet verfügbaren Bestand (${maxAvailableQuantity}). Korrigiere.`);
            itemQuantity = maxAvailableQuantity;

            alert(`Die Menge für "${product.produktname}" wurde auf die maximal verfügbare Menge von ${maxAvailableQuantity} korrigiert.`);

            if (isLoggedIn) {
                await updateQuantityInBackendCart(product.produktid, itemQuantity);
            } else {
                let localCart = JSON.parse(localStorage.getItem("cart")) || [];
                const itemIndex = localCart.findIndex(item => item.produktid === product.produktid);
                if (itemIndex !== -1) {
                    localCart[itemIndex].quantity = itemQuantity;
                    localCart[itemIndex].anzahl = itemQuantity;
                    localStorage.setItem("cart", JSON.stringify(localCart));
                }
            }
            await renderCart();
            return;
        }

        if (itemQuantity <= 0) {
            if (isLoggedIn) {
                await removeItem(product.produktid);
            }
            continue;
        }

        itemsToRender.push({
            ...product,
            anzahl: itemQuantity,
            quantity: itemQuantity
        });
    }

    if (!isLoggedIn) {
        localStorage.setItem("cart", JSON.stringify(itemsToRender));
    }

    for (const product of itemsToRender) {
        const itemQuantity = product.anzahl;
        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/100?text=No+Image';
        const itemPrice = parseFloat(product.preis);
        const itemTotalPrice = itemPrice * itemQuantity;
        total += itemTotalPrice;

        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";

        itemElement.innerHTML = `
            <img src="${imageUrl}" alt="${product.produktname}">
            <div>
                <h3>${product.produktname}</h3>
                <p>€${itemPrice.toFixed(2)} x <span class="item-quantity-display">${itemQuantity}</span></p>
                <div>
                    <button class="update-quantity-btn" data-productid="${product.produktid}" data-change="-1" data-max-qty="${product.originalMenge}">-</button>
                    <button class="update-quantity-btn" data-productid="${product.produktid}" data-change="+1" data-max-qty="${product.originalMenge}">+</button>
                    <button class="remove-item-btn" data-productid="${product.produktid}">Entfernen</button>
                </div>
            </div>
            <strong>€${(itemPrice * itemQuantity).toFixed(2)}</strong>
        `;
        cartContainer.appendChild(itemElement);
    }

    totalPriceElement.textContent = `€${total.toFixed(2)}`;
    updateCartCount();
    addCartItemEventListeners();
}

function addCartItemEventListeners() {
    document.querySelectorAll('.update-quantity-btn').forEach(button => {
        button.onclick = async (event) => {
            const produktid = parseInt(event.target.dataset.productid);
            const change = parseInt(event.target.dataset.change);
            await updateItemQuantity(produktid, change);
        };
    });

    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.onclick = async (event) => {
            const produktid = parseInt(event.target.dataset.productid);
            await removeItem(produktid);
        };
    });

    if (checkoutButton) {
        checkoutButton.onclick = () => {
            window.location.href = "../CheckoutPage/checkout.html";
        };
    }
}

async function updateItemQuantity(produktid, change) {
    const isLoggedIn = document.cookie.includes('token=');
    let currentCartItems = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = currentCartItems.find(item => item.produktid === produktid);

    if (!existingItem) {
        console.warn(`Produkt mit ID ${produktid} nicht im Warenkorb gefunden.`);
        await renderCart();
        return;
    }

    const newAnzahl = existingItem.anzahl + change;

    let actualMaxAvailable = existingItem.originalMenge;
    if (isLoggedIn) {
        try {
            const productInfoResponse = await fetch(`${API_INV_BASE_URL}/product/${produktid}`);
            if (productInfoResponse.ok) {
                const productDetails = await productInfoResponse.json();
                actualMaxAvailable = productDetails[0].menge;
            } else {
                console.warn(`Konnte aktuelle Produktmenge für ID ${produktid} nicht abrufen. Verwende vorhandenen Wert.`);
            }
        } catch (error) {
            console.error(`Fehler beim Abrufen der Produktmenge für ID ${produktid}:`, error);
        }
    }

    if (newAnzahl > actualMaxAvailable) {
        alert(`Es sind nur noch ${actualMaxAvailable} Stück von diesem Produkt verfügbar.`);
        if (existingItem.anzahl !== actualMaxAvailable) {
            if (isLoggedIn) {
                await updateQuantityInBackendCart(produktid, actualMaxAvailable);
            } else {
                const itemIndex = currentCartItems.findIndex(item => item.produktid === produktid);
                if (itemIndex !== -1) {
                    currentCartItems[itemIndex].quantity = actualMaxAvailable;
                    currentCartItems[itemIndex].anzahl = actualMaxAvailable;
                    localStorage.setItem("cart", JSON.stringify(currentCartItems));
                }
                renderCart();
            }
        }
        return;
    }

    if (newAnzahl <= 0) {
        await removeItem(produktid);
        return;
    }

    if (isLoggedIn) {
        await updateQuantityInBackendCart(produktid, newAnzahl);
    } else {
        const itemIndex = currentCartItems.findIndex(item => item.produktid === produktid);
        if (itemIndex !== -1) {
            currentCartItems[itemIndex].quantity = newAnzahl;
            currentCartItems[itemIndex].anzahl = newAnzahl;
            localStorage.setItem("cart", JSON.stringify(currentCartItems));
            renderCart();
        }
    }
}

async function updateQuantityInBackendCart(produktid, anzahl) {
    try {
        const response = await fetch(`${API_INV_BASE_URL}/warenkorb/add`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ produktid, anzahl })
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                localStorage.removeItem('cart');
                updateCartCount();
                window.location.href = "../LoginPage/loginpage.html";
                return;
            }
            const errorData = await response.json();
            throw new Error(`Fehler beim Aktualisieren der Menge: ${errorData.message || response.statusText}`);
        }
        await renderCart();
    } catch (error) {
        console.error("Fehler beim Aktualisieren der Menge (Backend):", error);
        alert("Fehler beim Aktualisieren der Menge: " + error.message);
    }
}

async function removeItem(produktid) {
    const isLoggedIn = document.cookie.includes('token=');

    if (isLoggedIn) {
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/${produktid}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                    localStorage.removeItem('cart');
                    updateCartCount();
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                throw new Error(`Fehler beim Entfernen aus dem Warenkorb: ${response.statusText}`);
            }
            await renderCart();
            showDeleteNotification();

        } catch (error) {
            console.error("Fehler beim Entfernen des Produkts (API):", error);
            alert("Fehler beim Entfernen des Produkts: " + error.message);
        }
    } else {
        let localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const initialLength = localCart.length;
        localCart = localCart.filter(item => item.produktid !== produktid);

        if (localCart.length < initialLength) {
            localStorage.setItem("cart", JSON.stringify(localCart));
            renderCart();
            showDeleteNotification();
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    renderCart();
});