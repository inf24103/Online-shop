const checkoutItemsContainer = document.getElementById('checkout-items');
const checkoutTotalPriceElement = document.getElementById('checkout-total-price');
const placeOrderButton = document.getElementById('place-order-button');
const addressForm = document.getElementById('address-form');
const loadingOverlay = document.getElementById('loading-overlay');

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || item.anzahl || 0), 0);
    const cartCountElement = document.getElementById("cart-count");
    if(cartCountElement) {
        cartCountElement.textContent = count;
    }
}

async function fetchCartForCheckout() {
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
                    console.warn("Sitzung abgelaufen oder nicht autorisiert. Lade leeren Warenkorb als Gast.");
                    localStorage.removeItem('adminToken');
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

async function renderCheckoutSummary() {
    const cartItems = await fetchCartForCheckout();

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
        return;
    }

    cartItems.forEach((product) => {
        const itemQuantity = product.anzahl || 1;
        const itemPrice = parseFloat(product.preis);
        const itemTotalPrice = itemPrice * itemQuantity;
        total += itemTotalPrice;

        const item = document.createElement("div");
        item.className = "cart-item";

        item.innerHTML = `
            <img src="${product.bild || 'https://via.placeholder.com/60'}" alt="${product.produktname}">
            <div>
                <h3>${product.produktname}</h3>
                <p>€${itemPrice.toFixed(2)} x ${itemQuantity}</p>
            </div>
            <strong>€${itemTotalPrice.toFixed(2)}</strong>
        `;
        checkoutItemsContainer.appendChild(item);
    });

    checkoutTotalPriceElement.textContent = `€${total.toFixed(2)}`;
    placeOrderButton.disabled = false;
    updateCartCount();
}

function showLoadingOverlay() {
    loadingOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function hideLoadingOverlay() {
    loadingOverlay.classList.remove('visible');
    document.body.style.overflow = '';
}

async function clearCartAfterPurchase() {
    const userToken = localStorage.getItem('adminToken');
    const currentCartItems = await fetchCartForCheckout();

    if (userToken) {
        try {
            for (const item of currentCartItems) {
                await fetch(`http://localhost:3000/api/inv/warenkorb/${item.produktid}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    }
                });
            }
            console.log("Backend-Warenkorb erfolgreich geleert (Einzel-Löschungen).");
        } catch (error) {
            console.error("Fehler beim Leeren des Backend-Warenkorbs:", error);
        }
    }
    localStorage.removeItem("cart");
}

addressForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    showLoadingOverlay();

    const userToken = localStorage.getItem('adminToken');
    const currentCartItems = await fetchCartForCheckout();

    if (!userToken) {
        alert("Bitte melden Sie sich an, um Ihre Bestellung abzuschließen.");
        hideLoadingOverlay();
        window.location.href = "../LoginPage/loginpage.html";
        return;
    }

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

    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        alert("Vielen Dank für Ihre Bestellung! Ihre Bestellung wurde erfolgreich aufgegeben.");

        await clearCartAfterPurchase();

        renderCheckoutSummary();
        updateCartCount();

        window.location.href = "../ProductPage/productpage.html";

    } catch (error) {
        console.error("Fehler beim Abschließen der Bestellung (Frontend-Simulation):", error);
        alert("Es gab ein Problem beim Abschließen Ihrer Bestellung. Bitte versuchen Sie es erneut.");
    } finally {
        hideLoadingOverlay();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    renderCheckoutSummary();
});