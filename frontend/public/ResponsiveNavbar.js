const hamburger = document.querySelector(".hamburger");
const sidebar = document.querySelector(".sidebar");
const sidebarClose = document.querySelector(".sidebarClose");
const sidebarMenu = document.querySelector("#sidebar-menu");
const navLinks = document.querySelectorAll(".nav-links a");

//Navigation in Sidebar kopieren
navLinks.forEach(link => {
    const li = document.createElement("li");
    const clone = link.cloneNode(true);
    li.appendChild(clone);
    sidebarMenu.appendChild(li);
});

hamburger.addEventListener("click", () => {
    sidebar.classList.add("open");
});

sidebarClose.addEventListener("click", () => {
    sidebar.classList.remove("open");
})