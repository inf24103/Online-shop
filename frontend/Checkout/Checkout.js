const checkoutItemsContainer = document.getElementById('checkout-items');
const checkoutTotalPriceElement = document.getElementById('checkout-total-price');
const placeOrderButton = document.getElementById('place-order-button');
const addressForm = document.getElementById('address-form');
const loadingOverlay = document.getElementById('loading-overlay');
const addressFormTitle = document.getElementById('address-form-title');
const thankYouNotification = document.getElementById('thankYouNotification');

const IMAGE_BASE_URL = 'http://localhost:3000/';
const API_INV_BASE_URL = 'http://localhost:3000/api/inv';
const API_USER_BASE_URL = 'http://localhost:3000/api/user';

function showNotification(message, isSuccess = true) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notificationElement.textContent = message;
    document.body.appendChild(notificationElement);

    setTimeout(() => {
        notificationElement.classList.add('show');
    }, 10);

    setTimeout(() => {
        notificationElement.classList.remove('show');
        notificationElement.addEventListener('transitionend', () => notificationElement.remove());
    }, 3000);
}

function updateCartCount(cartItems = []) {
    const count = cartItems.reduce((sum, item) => sum + (item.anzahl || item.quantity || 0), 0);
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_USER_BASE_URL}/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.ok;
    } catch (error) {
        console.error("Fehler beim Überprüfen des Login-Status:", error);
        return false;
    }
}

async function fetchCart() {
    const isLoggedIn = await checkLoginStatus();

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
                    updateCartCount([]);
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
                quantity: item.anzahl,
                originalMenge: item.menge
            }));
            localStorage.setItem("cart", JSON.stringify(backendCart));
            return backendCart;
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs vom Backend:", error);
            showNotification("Ein Fehler ist beim Laden Ihres Warenkorbs aufgetreten. Bitte versuchen Sie es später erneut.", false);
            const localCart = JSON.parse(localStorage.getItem("cart")) || [];
            return localCart;
        }
    } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        return localCart;
    }
}

async function fetchUserData() {
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) {
        return null;
    }
    try {
        const response = await fetch(`${API_USER_BASE_URL}/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Benutzerdaten-Abruf fehlgeschlagen: Sitzung abgelaufen oder nicht autorisiert.");
                return null;
            }
            throw new Error(`Fehler beim Laden der Benutzerdaten: ${response.statusText}`);
        }
        const userData = await response.json();
        return userData[0];
    } catch (error) {
        console.error("Fehler beim Abrufen der Benutzerdaten:", error);
        showNotification("Fehler beim Laden Ihrer Profildaten.", false);
        return null;
    }
}

function fillAddressForm(userData) {
    const formFields = addressForm.querySelectorAll('input:not([type="hidden"])');
    document.getElementById('country').value = 'Deutschland';

    if (userData) {
        document.getElementById('firstName').value = userData.vorname || '';
        document.getElementById('lastName').value = userData.nachname || '';
        document.getElementById('street').value = userData.strasse || '';
        document.getElementById('zipCode').value = userData.plz || '';
        document.getElementById('city').value = userData.ort || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.telefonnr || '';

        formFields.forEach(field => {
            field.setAttribute('readonly', 'readonly');
            field.style.backgroundColor = '#e9e9e9';
            field.style.cursor = 'not-allowed';
        });
        addressFormTitle.textContent = "Ihre hinterlegte Liefer- und Rechnungsadresse";
        placeOrderButton.textContent = "Kauf abschließen";
    } else {
        formFields.forEach(field => {
            field.removeAttribute('readonly');
            field.style.backgroundColor = '';
            field.style.cursor = '';
            if (field.id !== 'country') {
                field.value = '';
            }
        });
        addressFormTitle.textContent = "Liefer- und Rechnungsadresse (Gast)";
        placeOrderButton.textContent = "Bitte Anmelden zum Kauf";
    }
}

async function renderCheckoutSummary() {
    const cartItems = await fetchCart();
    const isLoggedIn = await checkLoginStatus();

    checkoutItemsContainer.innerHTML = "";
    let total = 0;

    if (cartItems.length === 0) {
        checkoutItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <p>Ihr Warenkorb ist leer.</p>
                <p>Bitte fügen Sie Produkte im Shop hinzu, um fortzufahren.</p>
                <a href="../ProductPage/productpage.html">
                    <button>Zum Shop</button>
                </a>
            </div>
        `;
        checkoutTotalPriceElement.textContent = `€0.00`;
        placeOrderButton.disabled = true;
        updateCartCount([]);
        fillAddressForm(null);
        return;
    }

    cartItems.forEach((product) => {
        const itemQuantity = product.anzahl || product.quantity || 1;
        const itemPrice = parseFloat(product.preis);
        const itemTotalPrice = itemPrice * itemQuantity;
        total += itemTotalPrice;

        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/150';
        const stockInfo = product.originalMenge !== undefined ? `Verfügbar: ${product.originalMenge}` : '';

        const item = document.createElement("div");
        item.className = "product-item checkout-item";
        item.dataset.productId = product.produktid;

        item.innerHTML = `
            <img src="${imageUrl}" alt="${product.produktname}">
            <div class="product-info">
                <h3>${product.produktname}</h3>
                <p class="product-price">€${itemPrice.toFixed(2)}</p>
                <p class="product-quantity">Menge: ${itemQuantity}</p>
                <p class="product-stock-info">${stockInfo}</p>
            </div>
            <strong>€${itemTotalPrice.toFixed(2)}</strong>
        `;
        checkoutItemsContainer.appendChild(item);
    });

    checkoutTotalPriceElement.textContent = `€${total.toFixed(2)}`;
    placeOrderButton.disabled = false;
    updateCartCount(cartItems);

    if (isLoggedIn) {
        const userData = await fetchUserData();
        fillAddressForm(userData);
        placeOrderButton.textContent = "Kauf abschließen";
        placeOrderButton.onclick = null;
    } else {
        fillAddressForm(null);
        placeOrderButton.textContent = "Bitte Anmelden zum Kauf";
        placeOrderButton.disabled = true;
        placeOrderButton.onclick = () => {
            showNotification("Bitte melden Sie sich an, um den Kauf abzuschließen.", false);
            window.location.href = "../LoginPage/loginpage.html";
        };
    }
}

function showLoadingOverlay() {
    loadingOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function hideLoadingOverlay() {
    loadingOverlay.classList.remove('visible');
    document.body.style.overflow = '';
}

async function sendOrderToBackend() {
    try {
        const response = await fetch(`${API_INV_BASE_URL}/kaeufe/kaufen`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                throw new Error(`Fehler beim Senden der Bestellung: ${response.status} ${response.statusText}`);
            }
            throw new Error(errorData.message || `Fehler beim Senden der Bestellung: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Fehler beim Platzieren der Bestellung:", error);
        throw error;
    }
}

async function clearLocalCartAfterPurchase() {
    localStorage.removeItem("cart");
    window.dispatchEvent(new CustomEvent('cartCleared'));
}

addressForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    showLoadingOverlay();

    const isLoggedIn = await checkLoginStatus();

    if (!isLoggedIn) {
        showNotification("Bitte melden Sie sich an, um den Kauf abzuschließen.", false);
        hideLoadingOverlay();
        window.location.href = "../LoginPage/loginpage.html";
        return;
    }

    const currentCartItems = await fetchCart();
    if (currentCartItems.length === 0) {
        showNotification("Ihr Warenkorb ist leer. Bitte fügen Sie Produkte hinzu, um fortzufahren.", false);
        hideLoadingOverlay();
        return;
    }

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const street = document.getElementById('street').value.trim();
    const zipCode = document.getElementById('zipCode').value.trim();
    const city = document.getElementById('city').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!firstName || !lastName || !street || !zipCode || !city || !email) {
        showNotification("Bitte füllen Sie alle erforderlichen Felder aus (Vorname, Nachname, Straße, PLZ, Ort, E-Mail).", false);
        hideLoadingOverlay();
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification("Bitte geben Sie eine gültige E-Mail-Adresse ein.", false);
        hideLoadingOverlay();
        return;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const orderResponse = await sendOrderToBackend();
        console.log("Bestellung erfolgreich platziert:", orderResponse);

        await clearLocalCartAfterPurchase();

        showNotification("Vielen Dank für Ihre Bestellung! Eine Bestätigung wurde per E-Mail versandt.", true);
        if (thankYouNotification) {
            thankYouNotification.classList.add('show');
        }

        setTimeout(() => {
            if (thankYouNotification) {
                thankYouNotification.classList.remove('show');
            }
            window.location.href = "../user/index.html";
        }, 2000);

    } catch (error) {
        console.error("Fehler beim Abschließen der Bestellung:", error);
        let userErrorMessage = "Es gab ein Problem beim Abschließen Ihrer Bestellung. Bitte versuchen Sie es erneut.";

        if (error.message.includes("401") || error.message.includes("403") || error.message.includes("Session")) {
            userErrorMessage = "Ihre Sitzung ist abgelaufen oder Sie sind nicht angemeldet. Bitte loggen Sie sich erneut ein.";
            setTimeout(() => window.location.href = "../LoginPage/loginpage.html", 1500);
        } else if (error.message.includes("Bestand") || error.message.includes("400")) {
            userErrorMessage = "Einige Produkte im Warenkorb sind nicht mehr in ausreichender Menge verfügbar. Bitte überprüfen Sie Ihren Warenkorb.";
            renderCheckoutSummary();
        } else if (error.message.includes("404")) {
            userErrorMessage = "Die Bestellfunktion ist derzeit nicht erreichbar. Bitte kontaktieren Sie den Support.";
        }
        showNotification(userErrorMessage, false);
    } finally {
        hideLoadingOverlay();
    }
});

window.addEventListener("DOMContentLoaded", async () => {
    await renderCheckoutSummary();
});

window.addEventListener('cartCleared', () => {
    renderCheckoutSummary();
});