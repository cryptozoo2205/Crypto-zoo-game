window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.telegram = {
    init() {
        const isTelegramWebApp = !!(
            window.Telegram &&
            window.Telegram.WebApp
        );

        if (!isTelegramWebApp) {
            this.applyIdentityToUi();
            return;
        }

        const tg = window.Telegram.WebApp;

        try {
            tg.ready();

            if (typeof tg.setHeaderColor === "function") {
                tg.setHeaderColor("#0b1220");
            }

            if (typeof tg.setBackgroundColor === "function") {
                tg.setBackgroundColor("#0b1220");
            }

            if (typeof tg.expand === "function") {
                try {
                    tg.expand();
                } catch (error) {
                    console.warn("Telegram expand failed:", error);
                }
            }

            if (typeof tg.disableVerticalSwipes === "function") {
                try {
                    tg.disableVerticalSwipes();
                } catch (error) {
                    console.warn("Telegram disableVerticalSwipes failed:", error);
                }
            }

            if (typeof tg.requestFullscreen === "function") {
                try {
                    tg.requestFullscreen();
                } catch (error) {
                    console.warn("Telegram requestFullscreen failed:", error);
                }
            }

            setTimeout(() => {
                try {
                    tg.expand();
                } catch (error) {
                    console.warn("Telegram expand retry 1 failed:", error);
                }
            }, 80);

            setTimeout(() => {
                try {
                    tg.expand();
                } catch (error) {
                    console.warn("Telegram expand retry 2 failed:", error);
                }
            }, 260);

            setTimeout(() => {
                try {
                    if (typeof tg.requestFullscreen === "function") {
                        tg.requestFullscreen();
                    }
                } catch (error) {
                    console.warn("Telegram requestFullscreen retry failed:", error);
                }
            }, 420);

            this.setupPlayerIdentity();
            this.applyViewportFix();
            this.applyIdentityToUi();
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
            const safeDisplayName = safeUsername || safeFirstName || "Gracz";

            localStorage.setItem("telegramId", safeId);
            localStorage.setItem("telegramUsername", safeUsername);
            localStorage.setItem("telegramFirstName", safeFirstName);
            localStorage.setItem("telegramDisplayName", safeDisplayName);
        } catch (error) {
            console.error("TELEGRAM USER ERROR:", error);
        }
    },

    applyViewportFix() {
        const root = document.documentElement;
        const body = document.body;
        const app = document.getElementById("app");
        const game = document.getElementById("game");

        if (root) {
            root.style.margin = "0";
            root.style.padding = "0";
            root.style.width = "100%";
            root.style.height = "100%";
            root.style.overflow = "hidden";
            root.style.background = "#0b1220";
        }

        if (body) {
            body.style.margin = "0";
            body.style.padding = "0";
            body.style.width = "100%";
            body.style.height = "100%";
            body.style.overflow = "hidden";
            body.style.background = "#0b1220";
            body.classList.add("telegram-webapp");
        }

        if (app) {
            app.style.width = "100%";
            app.style.height = "100dvh";
            app.style.minHeight = "100dvh";
            app.style.overflow = "hidden";
        }

        if (game) {
            game.style.height = "calc(100dvh - 110px)";
            game.style.overflowY = "auto";
            game.style.overflowX = "hidden";
            game.style.webkitOverflowScrolling = "touch";
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
            topUserStatus.textContent = isTelegram
                ? "● Telegram Online"
                : "● Local Mode";
        }
    }
};