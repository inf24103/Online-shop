/* products.js – rendert die ersten 6 Produkte aus der API */

async function renderProducts() {
    const container = document.querySelector('.product-card');
    if (!container) return;

    container.innerHTML = 'Lade Produkte …';

    try {
        const res = await fetch('http://localhost:3000/api/inv/product/all', {
            credentials: 'include'          // Cookie mitsenden, falls nötig
        });
        if (!res.ok) throw new Error('API-Fehler ' + res.status);

        const data = await res.json();      // Array wie in deinem Beispiel
        const products = data.slice(0, 6);  // nur die ersten 6

        container.innerHTML = '';
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product';
            card.innerHTML = `
                ${p.bild ? `<img src="${p.bild}" alt="${p.produktname}">`
                : '<img src="../pictures/placeholder.jpg" alt="Bild folgt">'}
                <h3>${p.produktname}</h3>
                <p>€ ${Number(p.preis).toFixed(2)}</p>
                <p style="color:#777;">${p.kategorie}</p>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:red">Produkte konnten nicht geladen werden.</p>';
    }
}

window.addEventListener('DOMContentLoaded', renderProducts);
