window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
    readTelegramUserOnce() {
        const tgUser =
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.initDataUnsafe &&
            window.Telegram.WebApp.initDataUnsafe.user;

        if (tgUser && tgUser.id) {
            const safeUser = {
                id: String(tgUser.id),
                username: String(tgUser.username || ""),
                first_name: String(tgUser.first_name || "Gracz"),
                last_name: String(tgUser.last_name || ""),
                language_code: String(tgUser.language_code || "pl"),
                isMock: false,
                isTelegramWebApp: true
            };

            try {
                localStorage.setItem("telegramId", safeUser.id);
                localStorage.setItem("telegramUsername", safeUser.username);
                localStorage.setItem("telegramFirstName", safeUser.first_name);
            } catch (error) {
                console.warn("telegram user localStorage failed:", error);
            }

            return safeUser;
        }

        return null;
    },

    async getTelegramUser() {
        try {
            if (window.Telegram?.WebApp?.ready) {
                window.Telegram.WebApp.ready();
            }

            if (window.Telegram?.WebApp?.expand) {
                window.Telegram.WebApp.expand();
            }
        } catch (error) {
            console.warn("Telegram WebApp ready/expand failed:", error);
        }

        for (let i = 0; i < 10; i += 1) {
            const user = this.readTelegramUserOnce();

            if (user && user.id) {
                return user;
            }

            await this.sleep(150);
        }

        const cachedId = String(localStorage.getItem("telegramId") || "").trim();
        const cachedUsername = String(localStorage.getItem("telegramUsername") || "").trim();
        const cachedFirstName = String(localStorage.getItem("telegramFirstName") || "").trim();

        if (cachedId) {
            return {
                id: cachedId,
                username: cachedUsername,
                first_name: cachedFirstName || "Gracz",
                last_name: "",
                language_code: "pl",
                isMock: false,
                isTelegramWebApp: false,
                isCached: true
            };
        }

        throw new Error("Missing Telegram user id");
    },

    async getPlayerId() {
        const user = await this.getTelegramUser();
        return String(user.id);
    },

    async getUsername() {
        const tg = await this.getTelegramUser();
        return String(tg.username || tg.first_name || "Gracz");
    },

    getTelegramStartParam() {
        try {
            return String(window.Telegram?.WebApp?.initDataUnsafe?.start_param || "").trim();
        } catch (error) {
            console.warn("getTelegramStartParam failed:", error);
            return "";
        }
    },

    getUrlStartParam() {
        try {
            const params = new URLSearchParams(window.location.search || "");
            return String(
                params.get("start") ||
                params.get("startapp") ||
                params.get("ref") ||
                ""
            ).trim();
        } catch (error) {
            console.warn("getUrlStartParam failed:", error);
            return "";
        }
    }
});