async function loadProducts() {

    const res = await fetch("http://localhost:3000/api/inv/product/all");
    if(!res.ok) throw new Error("Fehler beim Laden der Produkte");
    return await res.json();

}

async function renderProducts() {

    let products = [];
    try {
        products = await loadProducts();
    } catch (e) {
        console.error(e);
    }

    const container = document.querySelector('.product-card');
    container.innerHTML = '';

    products.forEach((item) => {
        const card = document.createElement('div');
        card.className = "product";
        card.innerHTML = `
            <h3>${item.produktname}</h3>
            <p>${item.preis}</p>
            <p>${item.kategorie}</p>
            <button>Add to card</button>
            `;
        container.appendChild(card);
        console.log(item);
    })
}

window.addEventListener('DOMContentLoaded', renderProducts)