window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    init() {
        const hasTelegramWebApp = !!(
            window.Telegram &&
            window.Telegram.WebApp
        );

        try {
            if (hasTelegramWebApp) {
                const tg = window.Telegram.WebApp;

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

                this.setupPlayerIdentityFromTelegram();
            } else {
                this.setupPlayerIdentityFromUrl();
            }

            this.applyIdentityToUi();

            document.body.style.overflowX = "hidden";
            document.body.style.overflowY = "auto";
            document.documentElement.style.overflowX = "hidden";
            document.documentElement.style.overflowY = "auto";
        } catch (error) {
            console.error("TELEGRAM INIT ERROR:", error);
            this.applyIdentityToUi();
        }
    },

    getUrlTelegramUser() {
        try {
            const params = new URLSearchParams(window.location.search || "");
            const tgId = String(params.get("tgId") || "").trim();
            const username = String(params.get("username") || "").trim();
            const firstName = String(params.get("first_name") || "").trim();

            if (!tgId) {
                return null;
            }

            return {
                id: tgId,
                username,
                first_name: firstName || username || "Gracz"
            };
        } catch (error) {
            console.warn("URL telegram parse failed:", error);
            return null;
        }
    },

    setupPlayerIdentityFromTelegram() {
        try {
            const user = window.Telegram.WebApp.initDataUnsafe.user;

            if (!user || !user.id) {
                return;
            }

            localStorage.setItem("telegramId", String(user.id));
            localStorage.setItem("telegramUsername", String(user.username || ""));
            localStorage.setItem("telegramFirstName", String(user.first_name || "Gracz"));
            localStorage.setItem("telegramDisplayName", String(
                user.username ||
                [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
                "Gracz"
            ));
            localStorage.setItem("cryptozoo_launch_mode", "telegram");
        } catch (error) {
            console.error("TELEGRAM USER ERROR:", error);
        }
    },

    setupPlayerIdentityFromUrl() {
        const user = this.getUrlTelegramUser();

        if (!user || !user.id) {
            return;
        }

        localStorage.setItem("telegramId", String(user.id));
        localStorage.setItem("telegramUsername", String(user.username || ""));
        localStorage.setItem("telegramFirstName", String(user.first_name || "Gracz"));
        localStorage.setItem("telegramDisplayName", String(
            user.username || user.first_name || "Gracz"
        ));
        localStorage.setItem("cryptozoo_launch_mode", "telegram-link");
    },

    isTelegramMode() {
        const launchMode = localStorage.getItem("cryptozoo_launch_mode");
        if (launchMode === "telegram" || launchMode === "telegram-link") {
            return true;
        }

        const urlUser = this.getUrlTelegramUser();
        if (urlUser && urlUser.id) {
            return true;
        }

        return !!(
            window.Telegram &&
            window.Telegram.WebApp
        );
    },

    applyIdentityToUi() {
        const displayName =
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramDisplayName") ||
            localStorage.getItem("telegramFirstName") ||
            "Crypto Zoo";

        const topUserName = document.querySelector(".top-user-name");
        const topUserStatus = document.querySelector(".top-user-status");

        if (topUserName) {
            topUserName.textContent = displayName;
        }

        if (topUserStatus) {
            if (this.isTelegramMode()) {
                topUserStatus.textContent = "● Telegram Online";
            } else {
                topUserStatus.textContent = "● Local Mode";
            }
        }
    }
};