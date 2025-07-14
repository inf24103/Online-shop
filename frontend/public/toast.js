function zeigeToast(nachricht, typ = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${typ}`;
    toast.textContent = nachricht;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("visible"), 50);
    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}