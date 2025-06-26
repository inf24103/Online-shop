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
                    headers: {"Content-Type": "application/json"},
                })
                if(res.status === 401) {
                    alert("Benutzername oder Passwort ungültig");
                }
                if(res.status === 200) {
                    alert("Login erfolgreich");
                    form.reset();
                }
            } catch (e) {
                console.error(e);
                alert("Es ist ein Fehler aufgetreten!");
            }
        })
    })