window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    getPlayerPayload() {
        const state = CryptoZoo.state || {};
        const telegramId =
            localStorage.getItem("telegramId") ||
            (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user
                ? String(window.Telegram.WebApp.initDataUnsafe.user.id)
                : "local-player");

        const username =
            localStorage.getItem("telegramUsername") ||
            (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user
                ? (window.Telegram.WebApp.initDataUnsafe.user.username || "Gracz")
                : "Gracz lokalny");

        return {
            telegramId,
            username,
            coins: Number(state.coins) || 0,
            level: Number(state.level) || 1,
            coinsPerClick: Number(state.coinsPerClick) || 1,
            upgradeCost: Number(state.upgradeCost) || 50,
            animals: state.animals || {}
        };
    },

    async loadPlayer() {
        try {
            const payload = this.getPlayerPayload();

            const response = await fetch("/api/player/" + encodeURIComponent(payload.telegramId));

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("API loadPlayer error:", error);
            return null;
        }
    },

    async savePlayer() {
        try {
            const payload = this.getPlayerPayload();

            const response = await fetch("/api/player", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Save failed");
            }

            return await response.json();
        } catch (error) {
            console.error("API savePlayer error:", error);
            return null;
        }
    },

    async loadRanking() {
        try {
            const response = await fetch("/api/ranking");

            if (!response.ok) {
                return [];
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                return [];
            }

            return data;
        } catch (error) {
            console.error("API loadRanking error:", error);
            return [];
        }
    }
};