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

function updateCartCount(cartItemsFromBackend = null) {
    let count = 0;
    const cartCountElement = document.getElementById("cart-count");
    const isLoggedIn = document.cookie.includes('token=');

    if (isLoggedIn && cartItemsFromBackend !== null) {
        count = cartItemsFromBackend.reduce((sum, item) => sum + (item.anzahl || 0), 0);
    }

    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

async function fetchCart() {
    const isLoggedIn = document.cookie.includes('token=');

    if (!isLoggedIn) {
        console.log("Benutzer ist nicht eingeloggt. Warenkorb ist leer.");
        updateCartCount([]);
        return [];
    }

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
                showDeleteNotification("Ihre Sitzung ist abgelaufen oder Sie sind nicht autorisiert. Bitte melden Sie sich erneut an.");
                updateCartCount([]);
                window.location.href = "../LoginPage/loginpage.html";
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

        return backendCart;

    } catch (error) {
        console.error("Fehler beim Abrufen des Warenkorbs vom Backend:", error);
        alert("Ein Fehler ist beim Laden Ihres Warenkorbs aufgetreten. Bitte versuchen Sie es später erneut.");
        return [];
    }
}

async function renderCart() {
    const cartItems = await fetchCart();

    cartContainer.innerHTML = "";
    let total = 0;
    const isLoggedIn = document.cookie.includes('token=');

    if (!isLoggedIn) {
        const loginPromptDiv = document.createElement("div");
        loginPromptDiv.className = "empty-cart-message";
        loginPromptDiv.innerHTML = `
            <p>Um Produkte in Ihrem Warenkorb zu sehen, melden Sie sich bitte an.</p>
            <a href="../LoginPage/loginpage.html">
                <button>Zum Login</button>
            </a>
            <p>Neue Kundin oder neuer Kunde? Registrieren Sie sich hier:</p>
            <a href="../RegisterPage/registerpage.html">
                <button>Jetzt registrieren</button>
            </a>
        `;
        cartContainer.appendChild(loginPromptDiv);
        totalPriceElement.textContent = `€0.00`;
        if (checkoutButton) checkoutButton.style.display = 'none';
        updateCartCount([]);
        return;
    }

    if (cartItems.length === 0) {
        const emptyMessageDiv = document.createElement("div");
        emptyMessageDiv.className = "empty-cart-message";
        emptyMessageDiv.innerHTML = `
            <p>Ihr Warenkorb ist leer.</p>
            <p>Entdecken Sie unsere Produkte und füllen Sie ihn!</p>
            <a href="../ProductPage/productpage.html">
                <button>Zum Shop</button>
            </a>
        `;
        cartContainer.appendChild(emptyMessageDiv);
        totalPriceElement.textContent = `€0.00`;
        if (checkoutButton) checkoutButton.style.display = 'none';
        updateCartCount(cartItems);
        return;
    }

    if (checkoutButton) checkoutButton.style.display = 'block';

    for (const product of cartItems) {
        const itemQuantity = product.anzahl;
        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/100?text=No+Image';
        const itemPrice = parseFloat(product.preis);
        const itemTotalPrice = itemPrice * itemQuantity;
        total += itemTotalPrice;

        const itemElement = document.createElement("div");
        itemElement.className = "cart-item";

        const canIncrease = itemQuantity < product.originalMenge;
        const canDecrease = itemQuantity > 0;

        itemElement.innerHTML = `
            <img src="${imageUrl}" alt="${product.produktname}">
            <div>
                <h3>${product.produktname}</h3>
                <p>€${itemPrice.toFixed(2)} x <span class="item-quantity-display">${itemQuantity}</span></p>
                <div>
                    <button class="decrease-quantity-btn" data-productid="${product.produktid}" ${!canDecrease ? 'disabled' : ''}>-</button>
                    <button class="increase-quantity-btn" data-productid="${product.produktid}" ${!canIncrease ? 'disabled' : ''}>+</button>
                    <button class="remove-item-btn" data-productid="${product.produktid}">Entfernen</button>
                </div>
            </div>
            <strong>€${itemTotalPrice.toFixed(2)}</strong>
        `;
        cartContainer.appendChild(itemElement);
    }

    totalPriceElement.textContent = `€${total.toFixed(2)}`;
    updateCartCount(cartItems);
}

function addCartItemEventListeners() {
    cartContainer.onclick = async (event) => {
        const target = event.target;
        const isLoggedIn = document.cookie.includes('token=');

        if (!isLoggedIn) {
            showDeleteNotification("Bitte melden Sie sich an, um Ihren Warenkorb zu verwalten.");
            window.location.href = "../LoginPage/loginpage.html";
            return;
        }

        if (target.classList.contains('increase-quantity-btn')) {
            const produktid = parseInt(target.dataset.productid);
            await updateItemQuantity(produktid, 1, 'add');
        }

        if (target.classList.contains('decrease-quantity-btn')) {
            const produktid = parseInt(target.dataset.productid);
            await removeItem(produktid);
        }

        if (target.classList.contains('remove-item-btn')) {
            const produktid = parseInt(target.dataset.productid);
            await removeItemCompletely(produktid);
        }
    };

    if (checkoutButton) {
        checkoutButton.onclick = () => {
            const isLoggedIn = document.cookie.includes('token=');
            if (!isLoggedIn) {
                showDeleteNotification("Bitte melden Sie sich an, um zur Kasse zu gehen.");
                window.location.href = "../LoginPage/loginpage.html";
                return;
            }

            window.location.href = "../Checkout/Checkout.html";
        };
    }
}

window.addEventListener("DOMContentLoaded", () => {
    renderCart();
    addCartItemEventListeners();
});

async function updateItemQuantity(produktid, anzahlToAdd, action) {
    const isLoggedIn = document.cookie.includes('token=');
    if (!isLoggedIn) {
        window.location.href = "../LoginPage/loginpage.html";
        return;
    }

    try {
        let response;
        if (action === 'add') {
            response = await fetch(`${API_INV_BASE_URL}/warenkorb/add`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ produktid: produktid, anzahl: anzahlToAdd })
            });
        } else {
            return;
        }

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showDeleteNotification("Ihre Sitzung ist abgelaufen oder Sie sind nicht autorisiert. Bitte melden Sie sich erneut an.");
                updateCartCount([]);
                window.location.href = "../LoginPage/loginpage.html";
                return;
            }
            const errData = await response.json();
            alert("Fehler beim Aktualisieren der Menge: " + (errData.message || response.statusText));
        }

        await renderCart();

    } catch (error) {
        console.error("Fehler beim Aktualisieren der Menge (Backend):", error);
        alert("Ein Fehler ist aufgetreten: " + error.message);
        await renderCart();
    }
}

async function removeItem(produktid) {
    const isLoggedIn = document.cookie.includes('token=');
    if (!isLoggedIn) {
        window.location.href = "../LoginPage/loginpage.html";
        return;
    }

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
                showDeleteNotification("Ihre Sitzung ist abgelaufen oder Sie sind nicht autorisiert. Bitte melden Sie sich erneut an.");
                updateCartCount([]);
                window.location.href = "../LoginPage/loginpage.html";
                return;
            }
            throw new Error(`Fehler beim Entfernen aus dem Warenkorb: ${response.statusText}`);
        }
        await renderCart();

    } catch (error) {
        console.error("Fehler beim Entfernen des Produkts (API):", error);
        alert("Ein Fehler ist beim Entfernen des Produkts aufgetreten: " + error.message);
        await renderCart();
    }
}

async function removeItemCompletely(produktid) {
    const isLoggedIn = document.cookie.includes('token=');
    if (!isLoggedIn) {
        window.location.href = "../LoginPage/loginpage.html";
        return;
    }

    try {
        const cartItems = await fetchCart();
        const productInCart = cartItems.find(item => item.produktid === produktid);

        if (!productInCart) {
            alert("Produkt nicht im Warenkorb gefunden.");
            await renderCart();
            return;
        }

        let removedCompletely = false;
        while (!removedCompletely) {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/${produktid}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    showDeleteNotification("Ihre Sitzung ist abgelaufen oder Sie sind nicht autorisiert. Bitte melden Sie sich erneut an.");
                    updateCartCount([]);
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                throw new Error(`Fehler beim vollständigen Entfernen aus dem Warenkorb: ${response.statusText}`);
            }

            const updatedCartItems = await fetchCart();
            if (!updatedCartItems.some(item => item.produktid === produktid)) {
                removedCompletely = true;
            }
        }

        await renderCart();
        showDeleteNotification();

    } catch (error) {
        console.error("Fehler beim vollständigen Entfernen des Produkts (API):", error);
        alert("Ein Fehler ist beim vollständigen Entfernen des Produkts aufgetreten: " + error.message);
        await renderCart();
    }
}