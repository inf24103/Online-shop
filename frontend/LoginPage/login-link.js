document.addEventListener("DOMContentLoaded", () => {
    //Login Link senden
    const popupOverlay = document.getElementById("login-link-popup");
    const sendLinkBtn = document.getElementById("send-login-link-btn");
    const cancelBtn = document.getElementById("cancel-popup-btn");
    const confirmBtn = document.getElementById("send-link-confirm-btn");
    const popupUsername = document.getElementById("popup-username");

    if (sendLinkBtn && popupOverlay && cancelBtn && confirmBtn && popupUsername) {

        sendLinkBtn.addEventListener("click", () => {
            popupOverlay.style.display = "flex";
        });

        cancelBtn.addEventListener("click", () => {
            popupOverlay.style.display = "none";
            popupUsername.value = "";
        });

        confirmBtn.addEventListener("click", async () => {
            const username = popupUsername.value.trim();
            if (!username) {
                zeigeToast("Bitte Benutzernamen eingeben.", "error");
                return;
            }

            try {

                const res = await fetch(`http://localhost:3000/api/auth/login/withlink/${encodeURIComponent(username)}`);

                if (res.status === 404) {
                    zeigeToast("Benutzer nicht gefunden!", "error");
                } else if (res.ok) {
                    zeigeToast("Link erfolgreich versendet!", "success");
                } else {
                    zeigeToast("Fehler beim Senden des Login-Links.", "error");
                }

            } catch (e) {
                console.error(e);
                zeigeToast("Fehler beim Login-Link senden!");
            }

            popupOverlay.style.display = "none";
            popupUsername.value = "";

        });
    }
});