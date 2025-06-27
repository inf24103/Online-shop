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

async function renderProducts() {
    const container = document.querySelector(".product-card");
    container.innerHTML = '';

    for (let i = 0; i < 2; i++) {
        const card = document.createElement("div");
        card.classList.add("product");
        card.innerHTML = `
        ${products[i].pic ? `<img src="${products[i].pic}" alt="${products[i].pic}">` : ''}
            <h3>${products[i].name}</h3>
            <p>${products[i].price}</p>
            <p>${products[i].category}</p>
            `;
        container.appendChild(card);
    }
}

window.addEventListener("DOMContentLoaded", renderProducts);