window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    getPlayerId() {
        const tgUser =
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.initDataUnsafe &&
            window.Telegram.WebApp.initDataUnsafe.user;

        if (tgUser && tgUser.id) {
            localStorage.setItem("telegramId", String(tgUser.id));
            if (tgUser.username) {
                localStorage.setItem("telegramUsername", tgUser.username);
            }
            return String(tgUser.id);
        }

        let localId = localStorage.getItem("telegramId");
        if (!localId) {
            localId = "local-player";
            localStorage.setItem("telegramId", localId);
        }

        return localId;
    },

    getUsername() {
        const tgUser =
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.initDataUnsafe &&
            window.Telegram.WebApp.initDataUnsafe.user;

        if (tgUser && tgUser.username) {
            localStorage.setItem("telegramUsername", tgUser.username);
            return tgUser.username;
        }

        return localStorage.getItem("telegramUsername") || "Gracz";
    },

    getSavePayload() {
        const state = CryptoZoo.state || {};

        return {
            telegramId: this.getPlayerId(),
            username: this.getUsername(),
            coins: Number(state.coins) || 0,
            gems: Number(state.gems) || 0,
            level: Number(state.level) || 1,
            coinsPerClick: Number(state.coinsPerClick) || 1,
            upgradeCost: Number(state.upgradeCost) || 50,
            animals: state.animals || {}
        };
    },

    async loadPlayer() {
        try {
            const telegramId = this.getPlayerId();
            const response = await fetch("/api/player/" + encodeURIComponent(telegramId));

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
            const response = await fetch("/api/player", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(this.getSavePayload())
            });

            if (!response.ok) {
                return null;
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
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("API ranking error:", error);
            return [];
        }
    }
};