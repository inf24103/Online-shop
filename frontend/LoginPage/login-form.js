document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        //Form Daten einlesen
        const data = {
            username: form.username.value,
            password: form.password.value
        };

        try {
            const res = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                body: JSON.stringify(data),
                credentials: "include",
                headers: {"Content-Type": "application/json"}
            })
            if (res.status === 401) {
                zeigeToast("Benutzername oder Passwort ungültig", "error");
            }
            if (res.status === 200) {
                form.reset();
                window.location.href = "/user/index.html";
            }
        } catch (e) {
            console.error(e);
            zeigeToast("Es ist ein Fehler aufgetreten!", "error");
        }
    });
});