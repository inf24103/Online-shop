const cartContainer = document.querySelector('.cart-items');
const totalPriceElement = document.getElementById('total-price');
const checkoutButton = document.getElementById('checkout-button');

// API Base URLs
const API_INV_BASE_URL = 'http://localhost:3000/api/inv';

// Hilfsfunktion zur Bestimmung des aktuellen Tokens (userToken oder adminToken)
function getCurrentUserToken() {
    return localStorage.getItem('userToken'); // Wichtig: 'userToken' verwenden
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || item.anzahl || 0), 0);
    const cartCountElement = document.getElementById("cart-count");
    if(cartCountElement) {
        cartCountElement.textContent = count;
    }
}

const IMAGE_BASE_URL = 'http://localhost:3000/';

async function fetchCart() {
    const userToken = getCurrentUserToken();

    if (userToken) {
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/myproducts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.warn("Sitzung abgelaufen oder nicht autorisiert. Leere lokalen Warenkorb.");
                    localStorage.removeItem('userToken');
                    localStorage.removeItem('cart');
                    updateCartCount();
                    return [];
                }
                throw new Error(`Fehler beim Laden des Warenkorbs: ${response.statusText}`);
            }
            const cartData = await response.json();
            // Backend-Antwort in LocalStorage spiegeln, 'anzahl' und 'quantity' sowie 'menge' (verfügbarer Bestand)
            // Es ist entscheidend, dass das Backend hier die aktuelle Verfügbarkeit (menge) des Produkts mitliefert.
            // Falls nicht, müsste ein zusätzlicher Aufruf für jedes Produkt erfolgen.
            // Annahme: Das Backend liefert 'menge' im Produktobjekt zurück, oder wir müssen es abrufen.
            const mappedCartData = await Promise.all(cartData.map(async item => {
                let productDetails = item.product;
                // Wenn das Backend die Menge nicht direkt im Warenkorb-Product-Objekt liefert,
                // müssen wir sie hier separat abrufen.
                if (!productDetails.menge && userToken) {
                    try {
                        const productInfoResponse = await fetch(`${API_INV_BASE_URL}/product/${item.product.produktid}`, {
                            headers: { 'Authorization': `Bearer ${userToken}` }
                        });
                        if (productInfoResponse.ok) {
                            const details = await productInfoResponse.json();
                            productDetails.menge = details.menge; // Aktuelle Menge aus der Produktdatenbank
                        } else {
                            console.warn(`Konnte Produktdetails für ID ${item.product.produktid} nicht abrufen.`);
                        }
                    } catch (error) {
                        console.error(`Fehler beim Abrufen der Produktmenge für ID ${item.product.produktid}:`, error);
                    }
                }
                return {
                    ...productDetails,
                    anzahl: item.anzahl,
                    quantity: item.anzahl,
                    // Die Menge, die zum Zeitpunkt des Hinzufügens oder der letzten Aktualisierung verfügbar war,
                    // sollte hier als 'originalMenge' oder 'availableStock' gespeichert werden,
                    // um sie bei der Überprüfung zu nutzen, falls das Backend die aktuelle Menge nicht mitliefert.
                    // Besser ist, wenn das Backend immer die aktuelle Menge liefert.
                    availableStock: productDetails.menge // <-- Dies ist die aktuelle Verfügbarkeit aus der DB
                };
            }));
            localStorage.setItem("cart", JSON.stringify(mappedCartData));
            return mappedCartData;
        } catch (error) {
            console.error("Fehler beim Abrufen des Warenkorbs vom Backend:", error);
            alert("Fehler beim Laden Ihres Warenkorbs. Bitte versuchen Sie es erneut.");
            localStorage.removeItem('userToken');
            localStorage.removeItem('cart');
            updateCartCount();
            return [];
        }
    } else {
        // Wenn kein Token vorhanden, Warenkorb nur aus LocalStorage laden
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        return localCart.map(item => ({
            produktid: item.produktid,
            produktname: item.produktname,
            preis: item.preis,
            bild: item.bild,
            kategorie: item.kategorie,
            beschreibung: item.beschreibung,
            anzahl: item.quantity || 1,
            quantity: item.quantity || 1, // Konsistenz für quantity
            menge: item.menge, // Die ursprünglich im localStorage gespeicherte Menge
            availableStock: item.availableStock || item.menge || Infinity // Verfügbarer Bestand für Gast-User
        }));
    }
}

async function renderCart() {
    const cartItems = await fetchCart();
    const userToken = getCurrentUserToken();

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
        if (checkoutButton) {
            checkoutButton.style.display = 'none';
        }
        updateCartCount();
        return;
    }

    if (checkoutButton) {
        checkoutButton.style.display = 'block';
    }

    for (const product of cartItems) {
        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/100?text=No+Image';

        const itemQuantity = product.anzahl;
        const itemPrice = parseFloat(product.preis);
        const itemTotalPrice = itemPrice * itemQuantity;
        total += itemTotalPrice;

        // Bestimme die maximal verfügbare Menge für dieses Produkt
        // Dies sollte die aktuelle Menge aus der Datenbank sein (für eingeloggte Nutzer)
        // oder die zuletzt bekannte Menge im localStorage für Gäste.
        let maxAvailableQuantity = Infinity;
        if (userToken) {
            // Wenn der User eingeloggt ist, sollte die Menge im 'product.availableStock'
            // aus fetchCart aktuell sein (direkt vom Backend).
            maxAvailableQuantity = product.availableStock !== undefined ? product.availableStock : Infinity;
            if (maxAvailableQuantity === Infinity) {
                console.warn(`Aktuelle Bestandsmenge für Produkt ID ${product.produktid} konnte nicht ermittelt werden (angemeldeter Benutzer).`);
            }
        } else {
            // Für Gast-Benutzer: nutze die im localStorage gespeicherte "availableStock"
            // Dies erfordert, dass die Produktseite diese Menge korrekt in den localStorage schreibt.
            maxAvailableQuantity = product.availableStock !== undefined ? product.availableStock : Infinity;
            if (maxAvailableQuantity === Infinity) {
                console.warn(`Aktuelle Bestandsmenge für Produkt ID ${product.produktid} konnte nicht ermittelt werden (Gast-Benutzer).`);
            }
        }

        // Korrektur: Wenn die im Warenkorb befindliche Menge die maximal verfügbare Menge übersteigt,
        // passe die angezeigte Menge an und informiere den Nutzer.
        let displayQuantity = itemQuantity;
        if (itemQuantity > maxAvailableQuantity) {
            displayQuantity = maxAvailableQuantity;
            // Aktualisiere den Warenkorb im Hintergrund, falls die Menge zu hoch ist
            if (userToken) {
                await updateQuantityBackend(product.produktid, maxAvailableQuantity, userToken);
            } else {
                let localCart = JSON.parse(localStorage.getItem("cart")) || [];
                const itemIndex = localCart.findIndex(item => item.produktid === product.produktid);
                if (itemIndex !== -1) {
                    localCart[itemIndex].quantity = maxAvailableQuantity;
                    localCart[itemIndex].anzahl = maxAvailableQuantity;
                    localStorage.setItem("cart", JSON.stringify(localCart));
                }
            }
            alert(`Die Menge für "${product.produktname}" wurde auf die maximal verfügbare Menge von ${maxAvailableQuantity} korrigiert.`);
            // Wichtig: renderCart wird nach diesem Alert nochmal aufgerufen, um die Änderungen widerzuspiegeln
            // Daher ist es besser, hier nur die Anzeige anzupassen und den vollständigen Re-Render am Ende der Funktion zu haben
            // oder den renderCart nach dem Alert in updateQuantity aufzurufen.
            // Für diesen Fall lassen wir renderCart die Korrektur durchführen und rendern am Ende einmal neu.
        }

        const item = document.createElement("div");
        item.className = "cart-item";

        item.innerHTML = `
            <img src="${imageUrl}" alt="${product.produktname}">
            <div>
                <h3>${product.produktname}</h3>
                <p>€${itemPrice.toFixed(2)} x <span class="item-quantity-display">${displayQuantity}</span></p>
                <div>
                    <button class="update-quantity-btn" data-productid="${product.produktid}" data-change="-1" data-max-qty="${maxAvailableQuantity}">-</button>
                    <button class="update-quantity-btn" data-productid="${product.produktid}" data-change="+1" data-max-qty="${maxAvailableQuantity}">+</button>
                    <button class="remove-item-btn" data-productid="${product.produktid}">Entfernen</button>
                </div>
            </div>
            <strong>€${(itemPrice * displayQuantity).toFixed(2)}</strong>
        `;
        cartContainer.appendChild(item);
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
            // 'data-max-qty' wird aus dem DOM gelesen, was gut ist, aber die ultimative Quelle sollte immer der Backend-Check sein
            // insbesondere bei Mengenänderungen.
            const maxAvailableFromData = parseInt(event.target.dataset.maxQty);
            await updateQuantity(produktid, change, maxAvailableFromData);
        };
    });

    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.onclick = async (event) => {
            const produktid = parseInt(event.target.dataset.productid);
            await removeItemFromCart(produktid);
        };
    });
}

async function updateQuantity(produktid, change, currentMaxAvailableFromUI) {
    const userToken = getCurrentUserToken();
    let currentCartItems = await fetchCart(); // Holt den aktuellsten Warenkorb-Stand vom Backend/localStorage
    const existingItem = currentCartItems.find(item => item.produktid === produktid);

    if (!existingItem) {
        console.warn(`Produkt mit ID ${produktid} nicht im Warenkorb gefunden.`);
        await renderCart();
        return;
    }

    const newAnzahl = existingItem.anzahl + change;

    let actualMaxAvailable = currentMaxAvailableFromUI; // Startwert aus UI-Datenattribut

    // Wichtiger Bestands-Check: Immer die aktuellste Menge vom Backend holen, wenn angemeldet.
    if (userToken) {
        try {
            const productInfoResponse = await fetch(`${API_INV_BASE_URL}/product/${produktid}`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (productInfoResponse.ok) {
                const productDetails = await productInfoResponse.json();
                actualMaxAvailable = productDetails.menge; // Tatsächliche verfügbare Menge aus DB
            } else {
                console.warn(`Konnte aktuelle Produktmenge für ID ${produktid} nicht abrufen. Verwende vorhandenen Wert.`);
                // Fallback: Wenn der API-Aufruf fehlschlägt, den Wert aus dem existingItem verwenden
                // existingItem.availableStock sollte der zuletzt vom Backend geholte Wert sein
                actualMaxAvailable = existingItem.availableStock || Infinity;
            }
        } catch (error) {
            console.error(`Fehler beim Abrufen der Produktmenge für ID ${produktid}:`, error);
            actualMaxAvailable = existingItem.availableStock || Infinity;
        }
    } else {
        // Für Gast-Benutzer: Die "availableStock" im localStorage ist die einzige Quelle.
        // Diese muss von der Produktseite beim Hinzufügen zum Warenkorb korrekt gesetzt werden.
        actualMaxAvailable = existingItem.availableStock || Infinity;
        if (actualMaxAvailable === Infinity) {
            console.warn("Originalmenge für Gast-Warenkorb-Produkt nicht gefunden, unbegrenzte Menge angenommen.");
        }
    }

    if (newAnzahl > actualMaxAvailable) {
        alert(`Es sind nur noch ${actualMaxAvailable} Stück von diesem Produkt verfügbar.`);
        // Wenn die neue Menge das Maximum überschreitet, setze sie auf das Maximum
        if (existingItem.anzahl !== actualMaxAvailable) { // Nur aktualisieren, wenn nicht bereits Maximum
            if (userToken) {
                await updateQuantityBackend(produktid, actualMaxAvailable, userToken);
            } else {
                let localCart = JSON.parse(localStorage.getItem("cart")) || [];
                const itemIndex = localCart.findIndex(item => item.produktid === produktid);
                if (itemIndex !== -1) {
                    localCart[itemIndex].quantity = actualMaxAvailable;
                    localCart[itemIndex].anzahl = actualMaxAvailable;
                    localStorage.setItem("cart", JSON.stringify(localCart));
                }
                renderCart(); // Neu rendern, um die korrigierte Menge anzuzeigen
            }
        }
        return; // Beende die Funktion hier, da die Menge bereits korrigiert oder ein Fehler aufgetreten ist.
    }

    if (newAnzahl <= 0) {
        if (confirm("Möchten Sie dieses Produkt wirklich aus dem Warenkorb entfernen?")) {
            await removeItemFromCart(produktid);
        }
        return;
    }

    // Wenn alle Prüfungen bestanden sind, die Menge aktualisieren
    if (userToken) {
        await updateQuantityBackend(produktid, newAnzahl, userToken);
    } else {
        let localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const itemIndex = localCart.findIndex(item => item.produktid === produktid);

        if (itemIndex !== -1) {
            localCart[itemIndex].quantity = newAnzahl;
            localCart[itemIndex].anzahl = newAnzahl;
            localStorage.setItem("cart", JSON.stringify(localCart));
            renderCart();
        }
    }
}

// Hilfsfunktion für Backend-Mengenaktualisierung, um Code-Redundanz zu vermeiden
async function updateQuantityBackend(produktid, anzahl, userToken) {
    try {
        const response = await fetch(`${API_INV_BASE_URL}/warenkorb/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ produktid, anzahl })
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
            throw new Error(`Fehler beim Aktualisieren der Menge: ${errorData.message || response.statusText}`);
        }
        // Nach erfolgreicher Aktualisierung muss der Warenkorb neu geladen und gerendert werden,
        // um die konsistenten Daten anzuzeigen, die das Backend zurückgibt.
        renderCart();
    } catch (error) {
        console.error("Fehler beim Aktualisieren der Menge (Backend):", error);
        alert("Fehler beim Aktualisieren der Menge: " + error.message);
    }
}


async function removeItemFromCart(produktid) {
    const userToken = getCurrentUserToken();
    const currentCartItems = await fetchCart();
    const removedItem = currentCartItems.find(item => item.produktid === produktid);
    const removedQuantity = removedItem ? (removedItem.anzahl || removedItem.quantity) : 0; // Use anzahl or quantity

    if (userToken) {
        try {
            const response = await fetch(`${API_INV_BASE_URL}/warenkorb/${produktid}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
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
                throw new Error(`Fehler beim Entfernen aus dem Warenkorb: ${response.statusText}`);
            }
            alert("Produkt erfolgreich aus dem Warenkorb entfernt!");
            renderCart();

            if (removedItem) {
                const cartItemRemovedEvent = new CustomEvent('cartItemRemoved', {
                    detail: { produktid: produktid, anzahl: removedQuantity }
                });
                window.dispatchEvent(cartItemRemovedEvent);
            }

        } catch (error) {
            console.error("Fehler beim Entfernen des Produkts (API):", error);
            alert("Fehler beim Entfernen des Produkts: " + error.message);
        }
    } else {
        let localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const initialLength = localCart.length;
        const itemToRemove = localCart.find(item => item.produktid === produktid);
        localCart = localCart.filter(item => item.produktid !== produktid);

        if (localCart.length < initialLength) {
            localStorage.setItem("cart", JSON.stringify(localCart));
            alert("Produkt erfolgreich aus dem Warenkorb entfernt!");
            renderCart();

            if (itemToRemove) {
                const cartItemRemovedEvent = new CustomEvent('cartItemRemoved', {
                    detail: { produktid: produktid, anzahl: itemToRemove.quantity || itemToRemove.anzahl }
                });
                window.dispatchEvent(cartItemRemovedEvent);
            }
        }
    }
}

window.addEventListener('cartCleared', () => {
    renderCart();
});

window.addEventListener("DOMContentLoaded", () => {
    renderCart();
    updateCartCount();
});