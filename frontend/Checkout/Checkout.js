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
                quantity: item.anzahl,
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

async function fetchUserData() {
    const isLoggedIn = document.cookie.includes('token=');
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
        return null;
    }
}

function fillAddressForm(userData) {
    const formFields = addressForm.querySelectorAll('input:not([type="hidden"])');

    if (userData) {
        document.getElementById('firstName').value = userData.vorname || '';
        document.getElementById('lastName').value = userData.nachname || '';
        document.getElementById('street').value = userData.strasse || '';
        document.getElementById('zipCode').value = userData.plz || '';
        document.getElementById('city').value = userData.ort || '';
        document.getElementById('country').value = userData.land || 'Deutschland';
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
            } else {
                field.value = 'Deutschland';
            }
        });
        addressFormTitle.textContent = "Liefer- und Rechnungsadresse (Gast)";
        placeOrderButton.textContent = "Als Gast Kauf abschließen";
    }
}

async function renderCheckoutSummary() {
    const cartItems = await fetchCart();
    const isLoggedIn = document.cookie.includes('token=');

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
        updateCartCount();
        fillAddressForm(null);
        return;
    }

    cartItems.forEach((product) => {
        const itemQuantity = product.anzahl || 1;
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
    updateCartCount();

    if (isLoggedIn) {
        const userData = await fetchUserData();
        fillAddressForm(userData);
    } else {
        fillAddressForm(null);
        placeOrderButton.textContent = "Bitte Anmelden zum Kauf";
        placeOrderButton.onclick = () => {
            alert("Bitte melden Sie sich an, um den Kauf abzuschließen.");
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
        const isLoggedIn = document.cookie.includes('token=');
        if (!isLoggedIn) {
            throw new Error("Für diese Art des Checkouts ist eine Anmeldung erforderlich.");
        }

        const baseUrl = `${API_INV_BASE_URL}/kaeufe/kaufen`;

        const response = await fetch(baseUrl, {
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

    const isLoggedIn = document.cookie.includes('token=');

    if (!isLoggedIn) {
        alert("Bitte melden Sie sich an, um den Kauf abzuschließen.");
        hideLoadingOverlay();
        window.location.href = "../LoginPage/loginpage.html";
        return;
    }

    const currentCartItems = await fetchCart();
    if (currentCartItems.length === 0) {
        alert("Ihr Warenkorb ist leer. Bitte fügen Sie Produkte hinzu, um fortzufahren.");
        hideLoadingOverlay();
        return;
    }

    const addressData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        street: document.getElementById('street').value.trim(),
        zipCode: document.getElementById('zipCode').value.trim(),
        city: document.getElementById('city').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    if (!addressData.firstName || !addressData.lastName || !addressData.street ||
        !addressData.zipCode || !addressData.city || !addressData.email) {
        alert("Bitte füllen Sie alle erforderlichen Felder aus (Vorname, Nachname, Straße, PLZ, Ort, E-Mail).");
        hideLoadingOverlay();
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressData.email)) {
        alert("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
        hideLoadingOverlay();
        return;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const orderResponse = await sendOrderToBackend();
        console.log("Bestellung erfolgreich platziert:", orderResponse);

        await clearLocalCartAfterPurchase();

        thankYouNotification.classList.add('show');

        setTimeout(() => {
            thankYouNotification.classList.remove('show');
            window.location.href = "../SignUpPage/signup.html";
        }, 2000);

    } catch (error) {
        console.error("Fehler beim Abschließen der Bestellung:", error);
        let userErrorMessage = "Es gab ein Problem beim Abschließen Ihrer Bestellung. Bitte versuchen Sie es erneut.";
        if (error.message.includes("401") || error.message.includes("403")) {
            userErrorMessage = "Ihre Sitzung ist abgelaufen oder Sie sind nicht angemeldet. Bitte loggen Sie sich erneut ein.";
        } else if (error.message.includes("400") || error.message.includes("Bestand")) {
            userErrorMessage = "Einige Produkte im Warenkorb sind nicht mehr in ausreichender Menge verfügbar. Bitte überprüfen Sie Ihren Warenkorb.";
        } else if (error.message.includes("404")) {
            userErrorMessage = "Der Server konnte die Bestellfunktion nicht finden. Bitte kontaktieren Sie den Support.";
        }
        alert(userErrorMessage + ` (Details: ${error.message})`);
    } finally {
        hideLoadingOverlay();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    renderCheckoutSummary();
});

window.addEventListener('cartCleared', () => {
    renderCheckoutSummary();
    updateCartCount();
});