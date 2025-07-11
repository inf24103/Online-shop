const cartContainer = document.querySelector('.cart-items');
const totalPriceElement = document.getElementById('total-price');
const checkoutButton = document.getElementById('checkout-button');

async function fetchCart() {
    const userToken = localStorage.getItem('adminToken'); // Oder 'userToken'

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
                    console.warn("Sitzung abgelaufen oder nicht autorisiert. Lade leeren Warenkorb.");
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

async function renderCart() {
    const cartItems = await fetchCart();

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
        `;
        cartContainer.appendChild(emptyMessageDiv);
        totalPriceElement.textContent = `€0.00`;
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
            <img src="${product.bild || 'https://via.placeholder.com/100'}" alt="${product.produktname}">
            <div>
                <h3>${product.produktname}</h3>
                <p>€${itemPrice.toFixed(2)} x <span class="item-quantity-display">${itemQuantity}</span></p>
                <div>
                    <button class="update-quantity-btn" data-productid="${product.produktid}" data-change="-1">-</button>
                    <button class="update-quantity-btn" data-productid="${product.produktid}" data-change="+1">+</button>
                    <button class="remove-item-btn" data-productid="${product.produktid}">Entfernen</button>
                </div>
            </div>
            <strong>€${itemTotalPrice.toFixed(2)}</strong>
        `;
        cartContainer.appendChild(item);
    });

    totalPriceElement.textContent = `€${total.toFixed(2)}`;
    updateCartCount();
    addCartItemEventListeners();
}

function addCartItemEventListeners() {
    document.querySelectorAll('.update-quantity-btn').forEach(button => {
        button.onclick = async (event) => {
            const produktid = event.target.dataset.productid;
            const change = parseInt(event.target.dataset.change);
            await updateQuantity(produktid, change);
        };
    });

    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.onclick = async (event) => {
            const produktid = event.target.dataset.productid;
            await removeItemFromCart(produktid);
        };
    });
}

async function updateQuantity(produktid, change) {
    const userToken = localStorage.getItem('adminToken');
    let currentAnzahl = 0;

    const currentCartItems = await fetchCart();
    const existingItem = currentCartItems.find(item => item.produktid === produktid);
    if (existingItem) {
        currentAnzahl = existingItem.anzahl;
    }

    const newAnzahl = currentAnzahl + change;

    if (newAnzahl <= 0) {
        if (confirm("Möchten Sie dieses Produkt wirklich aus dem Warenkorb entfernen?")) {
            await removeItemFromCart(produktid);
        }
        return;
    }

    if (userToken) {
        try {
            const response = await fetch('http://localhost:3000/api/inv/warenkorb/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ produktid, anzahl: newAnzahl })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                const errorData = await response.json();
                throw new Error(`Fehler beim Aktualisieren der Menge: ${errorData.message || response.statusText}`);
            }
            renderCart();
        } catch (error) {
            console.error("Fehler beim Aktualisieren der Menge:", error);
            alert("Fehler beim Aktualisieren der Menge: " + error.message);
        }
    } else {
        let localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const itemIndex = localCart.findIndex(item => item.produktid === produktid);

        if (itemIndex !== -1) {
            localCart[itemIndex].quantity = newAnzahl;
            localStorage.setItem("cart", JSON.stringify(localCart));
            renderCart();
        }
    }
}

async function removeItemFromCart(produktid) {
    const userToken = localStorage.getItem('adminToken');
    const currentCartItems = await fetchCart();
    const removedItem = currentCartItems.find(item => item.produktid === produktid);
    const removedQuantity = removedItem ? removedItem.anzahl : 1;

    if (userToken) {
        if (!confirm("Möchten Sie dieses Produkt wirklich aus dem Warenkorb entfernen?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/inv/warenkorb/${produktid}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                throw new Error(`Fehler beim Entfernen aus dem Warenkorb: ${response.statusText}`);
            }
            alert("Produkt erfolgreich aus dem Warenkorb entfernt!");
            renderCart();

            const cartItemRemovedEvent = new CustomEvent('cartItemRemoved', {
                detail: { produktid: produktid, anzahl: removedQuantity }
            });
            window.dispatchEvent(cartItemRemovedEvent);

        } catch (error) {
            console.error("Fehler beim Entfernen des Produkts:", error);
            alert("Fehler beim Entfernen des Produkts: " + error.message);
        }
    } else {
        if (!confirm("Möchten Sie dieses Produkt wirklich aus dem Warenkorb entfernen?")) {
            return;
        }
        let localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const initialLength = localCart.length;
        localCart = localCart.filter(item => item.produktid !== produktid);

        if (localCart.length < initialLength) {
            localStorage.setItem("cart", JSON.stringify(localCart));
            alert("Produkt erfolgreich aus dem Warenkorb entfernt!");
            renderCart();

            const cartItemRemovedEvent = new CustomEvent('cartItemRemoved', {
                detail: { produktid: produktid, anzahl: removedQuantity }
            });
            window.dispatchEvent(cartItemRemovedEvent);
        }
    }
}

async function processCheckout() {
    const userToken = localStorage.getItem('adminToken');
    if (!userToken) {
        alert("Bitte melden Sie sich an oder registrieren Sie sich, um Ihre Bestellung abzuschließen.");
        window.location.href = "../LoginPage/loginpage.html"; // Oder zur Registrierungsseite
        return;
    }

    const currentCartItems = await fetchCart();

    if (currentCartItems.length === 0) {
        alert("Ihr Warenkorb ist leer. Bitte fügen Sie Produkte hinzu, um fortzufahren.");
        return;
    }

    if (confirm("Möchten Sie Ihre Bestellung jetzt abschließen?")) {
        try {
            const response = await fetch('http://localhost:3000/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    items: currentCartItems.map(item => ({
                        produktid: item.produktid,
                        anzahl: item.anzahl,
                        preis: item.preis
                    })),
                    totalPrice: parseFloat(totalPriceElement.textContent.replace('€', ''))
                })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert("Sitzung abgelaufen oder nicht autorisiert. Bitte neu anmelden.");
                    window.location.href = "../LoginPage/loginpage.html";
                    return;
                }
                const errorData = await response.json();
                throw new Error(`Fehler beim Abschließen der Bestellung: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();
            alert("Bestellung erfolgreich aufgegeben! Vielen Dank für Ihren Einkauf.");

            localStorage.removeItem("cart");

            renderCart();
            updateCartCount();


        } catch (error) {
            console.error("Fehler beim Abschließen der Bestellung:", error);
            alert("Fehler beim Abschließen der Bestellung: " + error.message);
        }
    }
}

if (checkoutButton) {
    checkoutButton.addEventListener('click', processCheckout);
}

window.addEventListener("DOMContentLoaded", () => {
    renderCart();
});


function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || item.anzahl), 0);
    const cartCountElement = document.getElementById("cart-count");
    if(cartCountElement) {
        cartCountElement.textContent = count;
    }
}