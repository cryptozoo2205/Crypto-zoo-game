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

    getDefaultState() {
        return {
            coins: 0,
            gems: 0,
            rewardBalance: 0,
            level: 1,
            xp: 0,
            coinsPerClick: 1,
            upgradeCost: 50,
            zooIncome: 0,
            lastLogin: Date.now(),
            animals: {
                monkey: { count: 0, level: 1 },
                panda: { count: 0, level: 1 },
                lion: { count: 0, level: 1 },
                tiger: { count: 0, level: 1 },
                elephant: { count: 0, level: 1 },
                giraffe: { count: 0, level: 1 },
                zebra: { count: 0, level: 1 },
                hippo: { count: 0, level: 1 },
                penguin: { count: 0, level: 1 },
                bear: { count: 0, level: 1 },
                crocodile: { count: 0, level: 1 },
                kangaroo: { count: 0, level: 1 },
                wolf: { count: 0, level: 1 }
            },
            boxes: {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            },
            expedition: null
        };
    },

    normalizeState(raw) {
        const base = this.getDefaultState();
        const data = raw || {};

        return {
            ...base,
            ...data,
            coins: Number(data.coins ?? base.coins) || 0,
            gems: Number(data.gems ?? base.gems) || 0,
            rewardBalance: Number(data.rewardBalance ?? base.rewardBalance) || 0,
            level: Number(data.level ?? base.level) || 1,
            xp: Number(data.xp ?? base.xp) || 0,
            coinsPerClick: Number(data.coinsPerClick ?? base.coinsPerClick) || 1,
            upgradeCost: Number(data.upgradeCost ?? base.upgradeCost) || 50,
            zooIncome: Number(data.zooIncome ?? base.zooIncome) || 0,
            lastLogin: Number(data.lastLogin ?? base.lastLogin) || Date.now(),
            animals: {
                ...base.animals,
                ...(data.animals || {})
            },
            boxes: {
                ...base.boxes,
                ...(data.boxes || {})
            },
            expedition: data.expedition || null
        };
    },

    getSavePayload() {
        const state = this.normalizeState(CryptoZoo.state || {});

        return {
            telegramId: this.getPlayerId(),
            username: this.getUsername(),

            coins: state.coins,
            gems: state.gems,
            rewardBalance: state.rewardBalance,
            level: state.level,
            xp: state.xp,
            coinsPerClick: state.coinsPerClick,
            upgradeCost: state.upgradeCost,
            zooIncome: state.zooIncome,
            lastLogin: state.lastLogin,

            animals: state.animals,
            boxes: state.boxes,
            expedition: state.expedition
        };
    },

    async loadPlayer() {
        const localSave = localStorage.getItem("cryptozoo_save");

        if (localSave) {
            try {
                const parsed = JSON.parse(localSave);
                CryptoZoo.state = this.normalizeState(parsed);
            } catch (error) {
                console.error("Local load error:", error);
            }
        } else {
            CryptoZoo.state = this.normalizeState(CryptoZoo.state);
        }

        try {
            const telegramId = this.getPlayerId();
            const response = await fetch("/api/player/" + encodeURIComponent(telegramId));

            if (!response.ok) {
                return CryptoZoo.state;
            }

            const data = await response.json();

            if (data && typeof data === "object") {
                const merged = this.normalizeState({
                    ...CryptoZoo.state,
                    ...data
                });

                CryptoZoo.state = merged;
                localStorage.setItem("cryptozoo_save", JSON.stringify(merged));
            }

            return CryptoZoo.state;
        } catch (error) {
            console.error("API loadPlayer error:", error);
            return CryptoZoo.state;
        }
    },

    async savePlayer() {
        const payload = this.getSavePayload();

        localStorage.setItem("cryptozoo_save", JSON.stringify(payload));

        try {
            const response = await fetch("/api/player", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
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