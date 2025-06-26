document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("form");

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        //Form Daten einlesen
        const data = {
            username: form.username.value,
            lastname: form.lastname.value,
            firstname: form.firstname.value,
            email: form.email.value,
            password: form.password.value,
            zipcode: form.zipcode.value,
            village: form.village.value,
            street: form.street.value,
            housenumber: form.housenumber.value,
            telephone: form.telephone.value
        };

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });
            if(!res.ok) throw new Error("Fehler beim Senden der Daten");

            alert("Registrierung erfolgreich. Bitte bestätige deine Email");
            form.reset();
        } catch (e) {
            console.error(e);
            alert("Es ist ein Fehler aufgetreten!");
        }

    })
})