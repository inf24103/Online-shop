const API_INV_BASE_URL = 'http://localhost:3000/api/inv';
const BESTSELLER_API_URL = `${API_INV_BASE_URL}/product/search`;
const IMAGE_BASE_URL = 'http://localhost:3000/';
const bestsellerProductsWrapper = document.getElementById('bestseller-products-wrapper');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function fetchAndRenderRandomBestsellers() {
    try {
        const response = await fetch(`${BESTSELLER_API_URL}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Produkte für Bestseller-Karussell: ${response.statusText}`);
        }

        let allProducts = await response.json();

        if (allProducts.length === 0) {
            bestsellerProductsWrapper.innerHTML = "<p>Aktuell keine Produkte für das Karussell verfügbar.</p>";
            return;
        }

        const shuffledProducts = shuffleArray(allProducts);

        const numberOfBestsellersToShow = Math.min(10, shuffledProducts.length);
        const randomBestsellers = shuffledProducts.slice(0, numberOfBestsellersToShow);

        const clonedProductsForCarousel = [...randomBestsellers, ...randomBestsellers, ...randomBestsellers, ...randomBestsellers];

        bestsellerProductsWrapper.innerHTML = '';

        clonedProductsForCarousel.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            const imageUrl = product.bild ? `${IMAGE_BASE_URL}${product.bild}` : 'https://via.placeholder.com/200?text=Kein Bild';

            productCard.innerHTML = `
                <img src="${imageUrl}" alt="${product.produktname}">
                <h3>${product.produktname}</h3>
                <p>€${parseFloat(product.preis).toFixed(2)}</p>
                <a href="/ProductPage/productpage.html?id=${product.produktid}" class="btn-secondary">Details</a>
            `;
            bestsellerProductsWrapper.appendChild(productCard);
        });

    } catch (error) {
        console.error("Fehler beim Laden der Produkte für das Bestseller-Karussell:", error);
        bestsellerProductsWrapper.innerHTML = "<p>Fehler beim Laden der Produkte für das Karussell. Bitte versuchen Sie es später erneut.</p>";
    }
}

window.addEventListener("DOMContentLoaded", fetchAndRenderRandomBestsellers);