const purchaseListContainer = document.getElementById('purchase-list');
const loadingMessage = document.getElementById('loading-message');
const noOrdersMessage = document.getElementById('no-orders-message');
const errorMessage = document.getElementById('error-message');

const API_INV_BASE_URL = 'http://localhost:3000/api/inv';
const IMAGE_BASE_URL = 'http://localhost:3000/';

document.addEventListener('DOMContentLoaded', fetchPurchaseHistory);

async function fetchPurchaseHistory() {
    showLoading(true);
    resetMessages();

    try {
        const orders = await getOrders();
        if (!orders.length) {
            noOrdersMessage.classList.remove('hidden');
        } else {
            for (const order of orders) {
                await renderOrder(order);
            }
        }
    } catch (error) {
        console.error("Fehler beim Abrufen der Bestellhistorie:", error);
        errorMessage.classList.remove('hidden');
    } finally {
        showLoading(false);
    }
}

async function getOrders() {
    const response = await fetch(`${API_INV_BASE_URL}/kaeufe/my`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            alert("Bitte melden Sie sich an, um Ihre Bestellungen zu sehen.");
            window.location.href = "../LoginPage/loginpage.html";
            throw new Error('Nicht angemeldet');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
}

async function renderOrder(order) {
    const orderItemDiv = document.createElement('div');
    orderItemDiv.classList.add('order-item');

    const formattedDate = new Date(order.datum).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const products = await fetchProductsForOrder(order.einkaufid);
    const totalPrice = products.reduce((sum, p) => sum + (parseFloat(p.preis) * p.anzahl), 0);

    orderItemDiv.innerHTML = `
        <div class="order-header" data-orderid="${order.einkaufid}">
            <h3>Bestellung vom: ${formattedDate}</h3>
            <span class="order-total">Gesamt: €${totalPrice.toFixed(2)}</span>
            <span class="toggle-icon">&#9654;</span>
        </div>
        <div class="order-details" id="order-details-${order.einkaufid}"><h4>Bestellte Produkte:</h4></div>
    `;

    purchaseListContainer.appendChild(orderItemDiv);

    const header = orderItemDiv.querySelector('.order-header');
    const details = orderItemDiv.querySelector('.order-details');
    const toggleIcon = header.querySelector('.toggle-icon');

    header.addEventListener('click', async () => {
        const expanded = details.classList.toggle('expanded');
        header.classList.toggle('expanded');
        toggleIcon.innerHTML = expanded ? '&#9660;' : '&#9654;';

        if (expanded) {
            await loadOrderProducts(order.einkaufid, details);
        } else {
            details.innerHTML = '<h4>Bestellte Produkte:</h4>';
        }
    });
}

async function fetchProductsForOrder(orderId) {
    try {
        const response = await fetch(`${API_INV_BASE_URL}/kaeufe/${orderId}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Produkte für Bestellung ${orderId}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Fehler bei Bestellung ${orderId}:`, error);
        alert(`Produkte für Bestellung ${orderId} konnten nicht geladen werden.`);
        return [];
    }
}

async function loadOrderProducts(orderId, containerDiv) {
    containerDiv.innerHTML = '<h4>Bestellte Produkte:</h4><p>Produkte werden geladen...</p>';
    const products = await fetchProductsForOrder(orderId);

    if (!products.length) {
        containerDiv.innerHTML = '<h4>Bestellte Produkte:</h4><p>Keine Produkte für diese Bestellung gefunden.</p>';
        return;
    }

    containerDiv.innerHTML = '<h4>Bestellte Produkte:</h4>';

    for (const product of products) {
        const productDiv = document.createElement('div');
        productDiv.classList.add('order-product-item');

        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200?text=Kein+Bild';

        productDiv.innerHTML = `
            <img src="${imageUrl}" alt="${product.produktname}">
            <div class="product-info">
                <h5>${product.produktname}</h5>
                <p>Menge: ${product.anzahl} | Einzelpreis: €${parseFloat(product.preis).toFixed(2)}</p>
                <p>Gesamtpreis Position: €${(parseFloat(product.preis) * product.anzahl).toFixed(2)}</p>
            </div>
        `;

        containerDiv.appendChild(productDiv);
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingMessage.classList.remove('hidden');
    } else {
        loadingMessage.classList.add('hidden');
    }
}

function resetMessages() {
    noOrdersMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    purchaseListContainer.innerHTML = '';
}
