document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const menu = document.getElementById("sidebar-menu");
    const accountLink = document.getElementById("account");
    const closeBtn = document.querySelector(".sidebar-close");

    const overlay = document.createElement("div");
    overlay.id = "sidebar-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0, 0, 0, 0.3)";
    overlay.style.display = "none";
    overlay.style.zIndex = "99";
    document.body.appendChild(overlay);

    accountLink.addEventListener("click", async (e) => {
        e.preventDefault();

        //Menü leeren
        menu.innerHTML = "<li>Lade...</li>";
        //Sidebar einblenden
        sidebar.classList.add("open");
        overlay.style.display = "block";

        let loggedIn = false;
        let rolle = "";

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
            let html = `
            <li><a href="#Profil">Profilverwaltung</a></li>
            <li><a href="#Einkaufsliste">Einkaufslisten</a></li>`
            if(rolle === "admin") {
                html += `<li><a href="../Userverwaltung/userverwaltung.html">Userverwaltung</a></li>`
            }
            html += `<li><a href="#" id="logout">Abmelden</a></li>`;
            menu.innerHTML = html;

            //Onclick Event
            document.getElementById("logout").addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    const res = await fetch("http://localhost:3000/api/auth/logout", {
                        method: "POST",
                        credentials: "include"
                    });
                } catch (e) {
                    console.log(e);
                }
                location.reload();
            });
        } else {
            menu.innerHTML = `
            <li><a href="../LoginPage/loginpage.html">Login</a></li>
            <li><a href="../SignUpPage/signup.html">Registrieren</a></li>`;
        }
    });

    const closeSidebar = () => {
        sidebar.classList.remove("open");
        overlay.style.display = "none";
    };
    closeBtn.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);

});