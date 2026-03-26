window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    init() {
        if (!window.Telegram || !window.Telegram.WebApp) {
            this.applyIdentityToUi();
            return;
        }

        const tg = window.Telegram.WebApp;

        try {
            tg.ready();

            if (typeof tg.expand === "function") {
                tg.expand();
            }

            if (typeof tg.enableClosingConfirmation === "function") {
                tg.enableClosingConfirmation();
            }

            if (typeof tg.setHeaderColor === "function") {
                tg.setHeaderColor("#0b1220");
            }

            if (typeof tg.setBackgroundColor === "function") {
                tg.setBackgroundColor("#0b1220");
            }

            if (typeof tg.requestFullscreen === "function") {
                try {
                    tg.requestFullscreen();
                } catch (error) {
                    console.warn("Telegram requestFullscreen failed:", error);
                }
            }

            this.setupPlayerIdentity();
            this.applyIdentityToUi();

            document.documentElement.style.background = "#0b1220";
            document.body.style.background = "#0b1220";
            document.documentElement.style.overflowX = "hidden";
            document.body.style.overflowX = "hidden";
            document.body.classList.add("telegram-webapp");
        } catch (error) {
            console.error("TELEGRAM INIT ERROR:", error);
            this.applyIdentityToUi();
        }
    },

    setupPlayerIdentity() {
        if (!window.Telegram || !window.Telegram.WebApp) {
            return;
        }

        try {
            const user = window.Telegram.WebApp.initDataUnsafe?.user;

            if (!user || !user.id) {
                return;
            }

            const safeId = String(user.id);
            const safeUsername = String(user.username || "");
            const safeFirstName = String(user.first_name || "Gracz");
            const displayName = safeUsername || safeFirstName || "Gracz";

            localStorage.setItem("telegramId", safeId);
            localStorage.setItem("telegramUsername", safeUsername);
            localStorage.setItem("telegramFirstName", safeFirstName);
            localStorage.setItem("telegramDisplayName", displayName);
        } catch (error) {
            console.error("TELEGRAM USER ERROR:", error);
        }
    },

    applyIdentityToUi() {
        const isTelegram = !!(window.Telegram && window.Telegram.WebApp);
        const username = localStorage.getItem("telegramUsername") || "";
        const firstName = localStorage.getItem("telegramFirstName") || "";
        const displayName =
            username ||
            localStorage.getItem("telegramDisplayName") ||
            firstName ||
            "Crypto Zoo";

        const topUserName = document.getElementById("topPlayerName");
        const topUserStatus = document.getElementById("topPlayerStatus");

        if (topUserName) {
            topUserName.textContent = displayName;
        }

        if (topUserStatus) {
            topUserStatus.textContent = isTelegram ? "● Telegram Online" : "● Local Mode";
        }
    }
};