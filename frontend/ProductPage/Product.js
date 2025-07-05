//Beispiel Daten händisch
const products = [
    {id: 1, name: "Whey Protein Vanilla", price: 19.99, category: "Supplements", pic: "https://cdn.shopify.com/s/files/1/0845/1358/7515/files/DesignerProteinPudding_360g_Black_WhiteVanillaFlavor_2024x2024_shop-iG0RlCqX_44ab9e01-a5e0-40b6-b077-ddd211bca90e.jpg?v=1749637177"},
    {id: 2, name: "Creatine Monohydrate", price: 14.49, category: "Supplements"},
    {id: 3, name: "Gym T-Shirt Black", price: 24.99, category: "Clothing"},
    {id: 4, name: "Fitness Shorts", price: 29.99, category: "Clothing"},
    {id: 5, name: "Protein Shaker 700ml", price: 9.99, category: "Style"},
    {id: 6, name: "Lifting Gloves", price: 15.99, category: "Style"},
    {id: 7, name: "Pre-Workout Booster", price: 22.49, category: "Supplements"},
    {id: 8, name: "Sleeveless Hoodie", price: 34.95, category: "Clothing"},
    {id: 9, name: "Resistance Bands Set", price: 17.99, category: "Style"},
    {id: 10, name: "Zinc + Magnesium Capsules", price: 11.90, category: "Supplements"}
];

const productDetailModal = document.getElementById('product-detail-modal');
const modalImage = document.getElementById('modal-product-image');
const modalName = document.getElementById('modal-product-name');
const modalDescription = document.getElementById('modal-product-description');
const modalPrice = document.getElementById('modal-product-price');
const modalCategory = document.getElementById('modal-product-category');
const closeButton = productDetailModal.querySelector('.close-button');
const addToCartModalButton = productDetailModal ? productDetailModal.querySelector('.add-to-cart-modal') : null;
let currentProductInModal = null;
const filterForm = document.querySelector(".filter form");

function renderProducts(productList = products) {
    const container = document.querySelector('.product-card');
    container.innerHTML = '';

    productList.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product');
        card.innerHTML = `
            ${product.pic ? `<img src="${product.pic}" alt="${product.pic}">` : ''}
            <h3>${product.name}</h3>
            <p>${product.category}</p>
            <p><strong>€${product.price}</strong></p>
            <button class="add-to-cart-modal">Add to card</button>
            `;
        container.appendChild(card);

        card.addEventListener('click',(event) =>{
            if(!event.target.classList.contains('add-to-cart-initial')){
                openProductModal(product);
            }
        })

        const AddToCartButton = card.querySelector('.add-to-cart-modal');
        AddToCartButton.addEventListener('click', (event) => {
            event.stopPropagation();
            addToCart(product);
        });
    });
}

filterForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const searchTerm = filterForm.elements["search"].value.toLowerCase();
    const selectedCategory = filterForm.elements["category"].value;
    const maxPrice = parseFloat(filterForm.elements["price"].value);
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "All" || selectedCategory === ""|| product.category === selectedCategory;
        const matchesPrice = isNaN(maxPrice) || product.price <= maxPrice;

        return matchesSearch && matchesPrice && matchesCategory;
    });
    renderProducts(filteredProducts);
});

function addToCart(product){
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.findIndex(p => p.id === product.id);

    if (existing !== -1){
        cart[existing].quantity += 1;
    } else {
        cart.push({...product, quantity:1});
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function openProductModal(product){
    currentProductInModal = product;
    modalImage.src = product.pic || ''; //Standardbild falls keins vorhanden
    modalImage.alt = product.name;
    modalName.textContent = product.name;
    modalDescription.textContent = product.description || 'Keine detaillierte Beschreibung verfügbar.'; //Der Text wird erst sichtbar, wenn man das modal Fenster öffnet
    modalCategory.textContent = `Kategorie: ${product.category}`;
    modalPrice.textContent = `Preis: ${product.price}`

    productDetailModal.classList.add('is-expanded');
    document.body.style.overflow = 'hidden';//Verhindert das im hintergrund gescrolled werden kann.
}

function closeProductModal(){
    productDetailModal.classList.remove('is-expanded');
    document.body.style.overflow = '';//erlaubt scrollen wieder, wenn das Fenster geschlossen wird.
}

closeButton.addEventListener('click', closeProductModal);

productDetailModal.addEventListener('click', (event) =>{
    if (event.target === productDetailModal){
        closeProductModal();
    }
})

function updateCartCount(){
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById("cart-count");
    if(cartCountElement) {
        cartCountElement.textContent = count;
    }
}

if(addToCartModalButton){
    addToCartModalButton.addEventListener("click", (event) =>{
        event.stopPropagation();
        if (currentProductInModal){
            addToCart(currentProductInModal);
            closeProductModal();
        }
    });
}

window.addEventListener("DOMContentLoaded", () =>{
    renderProducts();
    updateCartCount();
})

/*window.addEventListener('DOMContentLoaded', renderProducts)*/