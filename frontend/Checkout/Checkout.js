const checkoutItemsContainer = document.getElementById('checkout-items');
const checkoutTotalPriceElement = document.getElementById('checkout-total-price');
const placeOrderButton = document.getElementById('place-order-button');
const addressForm = document.getElementById('address-form');
const loadingOverlay = document.getElementById('loading-overlay');
const addressFormTitle = document.getElementById('address-form-title');

const IMAGE_BASE_URL = 'http://localhost:3000/';

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || item.anzahl || 0), 0);
    const cartCountElement = document.getElementById("cart-count");
    if(cartCountElement) {
        cartCountElement.textContent = count;
    }
}

async function fetchCart() {
    const userToken = localStorage.getItem('adminToken');

    if (userToken) {
        try {
            const response = await fetch('http://localhost:3000/api/inv/warenkorb/myproducts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn("Sitzung abgelaufen oder nicht autorisiert. Leere den lokalen Warenkorb.");
                    localStorage.removeItem('adminToken');
                    return [];
                }
                throw new Error(`Fehler beim Laden des Warenkorbs: ${response.statusText}`);
            }
            const cartData = await response.json();
            return cartData.map(item => ({ ...item.product, anzahl: item.anzahl }));
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs vom Backend:", error);
            alert("Fehler beim Laden Ihres Warenkorbs. Bitte versuchen Sie es erneut.");
            return [];
        }
    } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        return localCart.map(item => ({
            produktid: item.produktid,
            produktname: item.produktname,
            preis: item.preis,
            bild: item.bild,
            kategorie: item.kategorie,
            beschreibung: item.beschreibung,
            anzahl: item.quantity || 1
        }));
    }
}

async function fetchUserData(token) {
    try {
        const response = await fetch('http://localhost:3000/api/user/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.warn("Benutzerdaten-Abruf fehlgeschlagen: Token ungültig oder nicht autorisiert.");
                localStorage.removeItem('adminToken');
                return null;
            }
            throw new Error(`Fehler beim Laden der Benutzerdaten: ${response.statusText}`);
        }
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error("Fehler beim Abrufen der Benutzerdaten:", error);
        return null;
    }
}

function fillAddressForm(userData) {
    const formFields = addressForm.querySelectorAll('input:not([type="hidden"])');

    if (userData) {
        document.getElementById('firstName').value = userData.firstName || '';
        document.getElementById('lastName').value = userData.lastName || '';
        document.getElementById('street').value = userData.address?.street || '';
        document.getElementById('zipCode').value = userData.address?.zipCode || '';
        document.getElementById('city').value = userData.address?.city || '';
        document.getElementById('country').value = userData.address?.country || 'Deutschland';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.phone || '';

        formFields.forEach(field => {
            field.setAttribute('readonly', 'readonly');
        });
        addressFormTitle.textContent = "Ihre hinterlegte Liefer- und Rechnungsadresse";
        placeOrderButton.textContent = "Kauf abschließen";
    } else {
        formFields.forEach(field => {
            field.removeAttribute('readonly');
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
    const userToken = localStorage.getItem('adminToken');

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
        const stockInfo = product.anzahl !== undefined ? `Verfügbar: ${product.anzahl}` : '';

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

    if (userToken) {
        const userData = await fetchUserData(userToken);
        fillAddressForm(userData);
    } else {
        fillAddressForm(null);
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

async function sendOrderToBackend(orderData, userToken) {
    if (!userToken) {
        throw new Error("Bitte loggen Sie sich ein, um die Bestellung abzuschließen.");
    }

    try {
        const baseUrl = 'http://localhost:3000/api/inv/kaeufe/kaufen';
        const params = new URLSearchParams({
            firstName: orderData.address.firstName,
            lastName: orderData.address.lastName,
            street: orderData.address.street,
            zipCode: orderData.address.zipCode,
            city: orderData.address.city,
            country: orderData.address.country,
            email: orderData.address.email,
            phone: orderData.address.phone,
            totalPrice: orderData.totalPrice.toString(),
            paymentMethod: orderData.paymentMethod,
            isGuest: orderData.isGuest ? 'true' : 'false',
        });
        params.append('items', JSON.stringify(orderData.items));

        const headers = {
            'Authorization': `Bearer ${userToken}`
        };

        const response = await fetch(`${baseUrl}?${params.toString()}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Fehler beim Senden der Bestellung: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Fehler beim Platzieren der Bestellung:", error);
        throw error;
    }
}


async function clearCartAfterPurchase(userToken) {
    if (userToken) {
        try {
            const response = await fetch('http://localhost:3000/api/inv/warenkorb/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Fehler beim Leeren des Backend-Warenkorbs:", errorData.message);
            }
        } catch (error) {
            console.error("Fehler beim Aufruf zum Leeren des Backend-Warenkorbs:", error);
        }
    }
    localStorage.removeItem("cart");
    window.dispatchEvent(new CustomEvent('cartCleared'));
}

addressForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    showLoadingOverlay();

    const userToken = localStorage.getItem('adminToken');
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
        country: document.getElementById('country').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    if (!addressData.firstName || !addressData.lastName || !addressData.street ||
        !addressData.zipCode || !addressData.city || !addressData.country || !addressData.email) {
        alert("Bitte füllen Sie alle erforderlichen Felder aus (Vorname, Nachname, Straße, PLZ, Ort, Land, E-Mail).");
        hideLoadingOverlay();
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressData.email)) {
        alert("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
        hideLoadingOverlay();
        return;
    }

    const orderData = {
        address: addressData,
        items: currentCartItems.map(item => ({
            productId: item.produktid,
            quantity: item.anzahl,
            price: parseFloat(item.preis)
        })),
        totalPrice: parseFloat(checkoutTotalPriceElement.textContent.replace('€', '').replace(',', '.')),
        paymentMethod: document.querySelector('input[name="paymentMethod"]').value,
        isGuest: !userToken
    };

    try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const orderResponse = await sendOrderToBackend(orderData, userToken);
        console.log("Bestellung erfolgreich platziert:", orderResponse);

        alert("Vielen Dank für Ihre Bestellung! Ihre Bestellung wurde erfolgreich aufgegeben.");

        await clearCartAfterPurchase(userToken);

        window.location.href = "../ProductPage/productpage.html";

    } catch (error) {
        console.error("Fehler beim Abschließen der Bestellung:", error);
        alert("Es gab ein Problem beim Abschließen Ihrer Bestellung: " + error.message + ". Bitte versuchen Sie es erneut.");
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