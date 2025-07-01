document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const menu = document.getElementById("sidebar-menu");
    const accountLink = document.getElementById("account");

    const overlay = document.createElement("div");
    overlay.id = "sidebar-overlay";
    document.body.appendChild(overlay);

    accountLink.addEventListener("click", async (e) => {
        e.preventDefault();

        //Menü leeren
        menu.innerHTML = "<li>Lade...</li>";
        //Sidebar einblenden
        sidebar.classList.add("open");
        overlay.classList.add("show");

        let loggedIn = false;

        try {
            const res = await fetch("http://localhost:3000/api/user/me", {
                credentials: "include"
            });

            if(res.ok) {
                const [user] = await res.json();
                loggedIn = true;
                rolle = user.rolle;
            }

        } catch (e) {
            loggedIn = false;
        }
        //Anzeige wenn eingeloggt
        if(loggedIn) {
            menu.innerHTML = `
            <li><a href="#Profil">Profilverwaltung</a></li>
            <li><a href="#Einkaufsliste">Einkaufslisten</a></li>
            <li><a href="../Userverwaltung/userverwaltung.html">Userverwaltung</a></li>
            <li><a href="#" id="logout">Abmelden</a></li>`;

            //Onclick Event
            document.getElementById("logout").addEventListener("click", async (e) => {
                e.preventDefault();
                await fetch("");
                location.reload();
            })
        } else {
            menu.innerHTML = `
            <li><a href="../LoginPage/loginpage.html">Login</a></li>
            <li><a href="../SignUpPage/signup.html">Registrieren</a></li>`;
        }


    });
});