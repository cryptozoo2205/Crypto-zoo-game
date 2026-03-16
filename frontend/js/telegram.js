window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    init() {
        if (!window.Telegram || !window.Telegram.WebApp) {
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

            if (typeof tg.requestFullscreen === "function") {
                try {
                    tg.requestFullscreen();
                } catch (fullscreenError) {
                    console.error("TELEGRAM FULLSCREEN ERROR:", fullscreenError);
                }
            }

            document.body.style.overflowX = "hidden";
            document.body.style.overflowY = "auto";
            document.documentElement.style.overflowX = "hidden";
            document.documentElement.style.overflowY = "auto";
        } catch (error) {
            console.error("TELEGRAM INIT ERROR:", error);
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
        } catch (error) {
            console.error("TELEGRAM USER ERROR:", error);
        }
    }
};