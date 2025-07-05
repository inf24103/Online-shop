/*import {updateProductQuantity} from "./produktDRL";
updateProductQuantity*/


const cart = JSON.parse(localStorage.getItem("cart")) || [];
const cartContainer = document.querySelector(".cart-items");
const totalPriceElement = document.getElementById("total-price");

function renderCart(){
    cartContainer.innerHTML = "";
    let total = 0;

    cart.forEach((product, index) => {
        const item = document.createElement("div");
        item.className = "cart-item";
        total += product.price * product.quantity;

        item.innerHTML = `
        <img src = "${product.pic || 'https://via.placeholder.com/100'}" alt = "${product.name}">
        <div>
            <h3>${product.name}</h3>
            <p>€${product.price.toFixed(2)}</p>
            <div>
                <button onclick="updateQuantity(${index}, -1)">-</button>
                <button onclick="updateQuantity(${index}, +1)">+</button>
                <button onclick="removeItem(${index}, +1)">Entfernen</button>
            </div>
        </div>
        <strong>€${(product.price * product.quantity).toFixed(2)}</strong>
    `;

    cartContainer.appendChild(item);
    });

    totalPriceElement.textContent =`€${total.toFixed(2)}`;
}




function updateQuantity(index, change) {
    cart[index].quantity += change;
    if(cart[index].quantity <= 0){
        cart.splice(index, 1);
    }
    SaveAndRender();
}

function removeItem(index){
    cart.splice(index, 1);
    SaveAndRender();
}

function SaveAndRender(){
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

renderCart();