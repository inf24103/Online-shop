const purchaseListContainer = document.getElementById('purchase-list');
const loadingMessage = document.getElementById('loading-message');
const noOrdersMessage = document.getElementById('no-orders-message');
const errorMessage = document.getElementById('error-message');

const API_INV_BASE_URL = 'http://localhost:3000/api/inv';
const IMAGE_BASE_URL = 'http://localhost:3000/';

async function fetchPurchaseHistory() {
    loadingMessage.classList.remove('hidden');
    noOrdersMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    purchaseListContainer.innerHTML = '';

    try {
        const response = await fetch(`${API_INV_BASE_URL}/kaeufe/my`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert("Bitte melden Sie sich an, um Ihre Bestellungen zu sehen.");
                window.location.href = "../LoginPage/loginpage.html";
                return;
            }
            throw new Error(`Fehler beim Laden der Bestellhistorie: ${response.statusText}`);
        }

        const orders = await response.json();

        if (orders.length === 0) {
            noOrdersMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
            return;
        }

        for (const order of orders) {
            await renderOrder(order);
        }

    } catch (error) {
        console.error("Fehler beim Abrufen der Bestellhistorie:", error);
        errorMessage.classList.remove('hidden');
    } finally {
        loadingMessage.classList.add('hidden');
    }
}

async function renderOrder(order) {
    const orderItemDiv = document.createElement('div');
    orderItemDiv.classList.add('order-item');

    const orderDate = new Date(order.datum);
    const formattedDate = orderDate.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const productsInOrder = await fetchProductsForOrder(order.einkaufid);
    let totalOrderPrice = 0;
    for (const product of productsInOrder) {
        totalOrderPrice += parseFloat(product.preis) * product.anzahl;
    }

    orderItemDiv.innerHTML = `
        <div class="order-header" data-orderid="${order.einkaufid}">
            <h3>Bestellung vom: ${formattedDate}</h3>
            <span class="order-total">Gesamt: €${totalOrderPrice.toFixed(2)}</span>
            <span class="toggle-icon">&#9654;</span>
        </div>
        <div class="order-details" id="order-details-${order.einkaufid}">
            <h4>Bestellte Produkte:</h4>
        </div>
    `;

    purchaseListContainer.appendChild(orderItemDiv);

    orderItemDiv.querySelector('.order-header').addEventListener('click', async (event) => {
        const header = event.currentTarget;
        const orderDetailsDiv = orderItemDiv.querySelector('.order-details');
        const orderId = header.dataset.orderid;

        if (orderDetailsDiv.classList.contains('expanded')) {
            orderDetailsDiv.classList.remove('expanded');
            header.classList.remove('expanded');
            orderDetailsDiv.innerHTML = '<h4>Bestellte Produkte:</h4>';
        } else {
            header.classList.add('expanded');
            orderDetailsDiv.classList.add('expanded');
            await loadOrderProducts(orderId, orderDetailsDiv);
        }
    });
}

async function fetchProductsForOrder(orderId) {
    try {
        const response = await fetch(`${API_INV_BASE_URL}/kaeufe/${orderId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Produktdetails für Bestellung ${orderId}: ${response.statusText}`);
        }

        const products = await response.json();
        return products;

    } catch (error) {
        console.error(`Fehler beim Abrufen der Produkte für Bestellung ${orderId}:`, error);
        alert(`Konnte Produkte für Bestellung ${orderId} nicht laden.`);
        return [];
    }
}

async function loadOrderProducts(orderId, containerDiv) {
    containerDiv.innerHTML = '<h4>Bestellte Produkte:</h4><p>Produkte werden geladen...</p>';

    const products = await fetchProductsForOrder(orderId);

    if (products.length === 0) {
        containerDiv.innerHTML = '<h4>Bestellte Produkte:</h4><p>Keine Produkte für diese Bestellung gefunden.</p>';
        return;
    }

    containerDiv.innerHTML = '<h4>Bestellte Produkte:</h4>';
    for (const product of products) {
        const productDiv = document.createElement('div');
        productDiv.classList.add('order-product-item');

        const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/60?text=No+Image';

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

window.addEventListener('DOMContentLoaded', fetchPurchaseHistory);