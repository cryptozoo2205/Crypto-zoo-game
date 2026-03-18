window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    init() {
        if (!window.Telegram || !window.Telegram.WebApp) {
            this.applyLocalIdentityToUi();
            return;
        }

        const tg = window.Telegram.WebApp;

        try {
            tg.ready();

            if (typeof tg.expand === "function") {
                tg.expand();
            }

            if (typeof tg.setBackgroundColor === "function") {
                tg.setBackgroundColor("#0f172a");
            }

            if (typeof tg.setHeaderColor === "function") {
                tg.setHeaderColor("#0f172a");
            }

            this.setupPlayerIdentity();
            this.applyLocalIdentityToUi();

            document.body.style.overflowX = "hidden";
            document.body.style.overflowY = "auto";
            document.documentElement.style.overflowX = "hidden";
            document.documentElement.style.overflowY = "auto";
        } catch (error) {
            console.error("TELEGRAM INIT ERROR:", error);
            this.applyLocalIdentityToUi();
        }
    },

    setupPlayerIdentity() {
        if (!window.Telegram || !window.Telegram.WebApp) {
            return;
        }

        try {
            const user = window.Telegram.WebApp.initDataUnsafe.user;

            if (!user) {
                return;
            }

            localStorage.setItem("telegramId", String(user.id));

            if (user.username) {
                localStorage.setItem("telegramUsername", user.username);
            }

            const displayName =
                user.username ||
                [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
                "Gracz";

            localStorage.setItem("telegramDisplayName", displayName);
        } catch (error) {
            console.error("TELEGRAM USER ERROR:", error);
        }
    },

    applyLocalIdentityToUi() {
        const displayName =
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramDisplayName") ||
            "Crypto Zoo";

        const topUserName = document.querySelector(".top-user-name");
        const topUserStatus = document.querySelector(".top-user-status");

        if (topUserName) {
            topUserName.textContent = displayName;
        }

        if (topUserStatus) {
            if (window.Telegram && window.Telegram.WebApp) {
                topUserStatus.textContent = "● Telegram Online";
            } else {
                topUserStatus.textContent = "● Local Mode";
            }
        }
    }
};