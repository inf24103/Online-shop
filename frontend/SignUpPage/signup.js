document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("form");

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        //Form Daten einlesen
        const data = {
            username: form.querySelector("input[name='username']").value,
            lastname: form.querySelector("input[name='lastname']").value,
            firstname: form.querySelector("input[name='firstname']").value,
            email: form.querySelector("input[name='email']").value,
            password: form.querySelector("input[name='password']").value,
            zipcode: form.querySelector("input[name='zipcode']").value,
            village: form.querySelector("input[name='village']").value,
            street: form.querySelector("input[name='street']").value,
            housenumber: form.querySelector("input[name='housenumber']").value,
            telephone: form.querySelector("input[name='telephone']").value
        };

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });
            if(!res.ok) {
                if(res.status === 401) {
                    alert("Es existiert bereits ein Account");
                } else {
                    throw new Error("Fehler beim Senden der Daten")
                }
            } else {
                alert("Registrierung erfolgreich. Bitte bestätige deine Email");
                form.reset();
            }
        } catch (e) {
            console.error(e);
            alert("Es ist ein Fehler aufgetreten!");
        }

    })
})