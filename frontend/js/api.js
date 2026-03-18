window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    getTelegramUser() {
        try {
            return (
                window.Telegram &&
                window.Telegram.WebApp &&
                window.Telegram.WebApp.initDataUnsafe &&
                window.Telegram.WebApp.initDataUnsafe.user
            ) || null;
        } catch (error) {
            console.error("GET TELEGRAM USER ERROR:", error);
            return null;
        }
    },

    getPlayerId() {
        const tgUser = this.getTelegramUser();

        if (tgUser && tgUser.id) {
            localStorage.setItem("telegramId", String(tgUser.id));

            if (tgUser.username) {
                localStorage.setItem("telegramUsername", tgUser.username);
            }

            const displayName =
                tgUser.username ||
                [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() ||
                "Gracz";

            localStorage.setItem("telegramDisplayName", displayName);

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
        const tgUser = this.getTelegramUser();

        if (tgUser) {
            const username =
                tgUser.username ||
                [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() ||
                "Gracz";

            if (tgUser.username) {
                localStorage.setItem("telegramUsername", tgUser.username);
            }

            localStorage.setItem("telegramDisplayName", username);
            return username;
        }

        return (
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramDisplayName") ||
            "Gracz"
        );
    },

    getPlayerSaveKey(playerId) {
        return `cryptozoo_save_${playerId}`;
    },

    getRankingKey() {
        return "cryptozoo_ranking";
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
            expeditionBoost: 0,
            offlineBoost: 1,
            lastLogin: Date.now(),
            boost2xActiveUntil: 0,
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

    normalizeAnimals(rawAnimals) {
        const baseAnimals = this.getDefaultState().animals;
        const result = {};

        Object.keys(baseAnimals).forEach((type) => {
            const raw = rawAnimals && rawAnimals[type] ? rawAnimals[type] : baseAnimals[type];

            result[type] = {
                count: Math.max(0, Number(raw.count) || 0),
                level: Math.max(1, Number(raw.level) || 1)
            };
        });

        return result;
    },

    normalizeBoostTimestamp(value) {
        let safeValue = Number(value) || 0;

        if (safeValue <= 0) {
            return 0;
        }

        if (safeValue < 1000000000000) {
            safeValue *= 1000;
        }

        if (safeValue <= Date.now()) {
            return 0;
        }

        return safeValue;
    },

    normalizeExpedition(rawExpedition) {
        if (!rawExpedition || typeof rawExpedition !== "object") {
            return null;
        }

        const endTime = Number(rawExpedition.endTime) || 0;

        if (endTime <= 0) {
            return null;
        }

        return {
            id: rawExpedition.id || "",
            name: rawExpedition.name || "Expedition",
            startTime: Number(rawExpedition.startTime) || Date.now(),
            endTime,
            rewardRarity: rawExpedition.rewardRarity || "common",
            rewardCoins: Math.max(0, Number(rawExpedition.rewardCoins) || 0),
            rewardGems: Math.max(0, Number(rawExpedition.rewardGems) || 0)
        };
    },

    recalculateZooIncomeFromAnimals(animals) {
        const configAnimals = CryptoZoo.config?.animals || {};
        const safeAnimals = animals || {};
        let total = 0;

        Object.keys(configAnimals).forEach((type) => {
            const config = configAnimals[type];
            const animal = safeAnimals[type] || { count: 0, level: 1 };

            total +=
                (Math.max(0, Number(animal.count) || 0)) *
                (Math.max(1, Number(animal.level) || 1)) *
                (Math.max(0, Number(config.baseIncome) || 0));
        });

        return total;
    },

    normalizeState(raw) {
        const base = this.getDefaultState();
        const data = raw || {};
        const animals = this.normalizeAnimals(data.animals || {});
        const boost2xActiveUntil = this.normalizeBoostTimestamp(data.boost2xActiveUntil ?? base.boost2xActiveUntil);
        const derivedZooIncome = this.recalculateZooIncomeFromAnimals(animals);

        return {
            ...base,
            ...data,
            coins: Math.max(0, Number(data.coins ?? base.coins) || 0),
            gems: Math.max(0, Number(data.gems ?? base.gems) || 0),
            rewardBalance: Math.max(0, Number(data.rewardBalance ?? base.rewardBalance) || 0),
            level: Math.max(1, Number(data.level ?? base.level) || 1),
            xp: Math.max(0, Number(data.xp ?? base.xp) || 0),
            coinsPerClick: Math.max(1, Number(data.coinsPerClick ?? base.coinsPerClick) || 1),
            upgradeCost: Math.max(0, Number(data.upgradeCost ?? base.upgradeCost) || 50),
            zooIncome: Math.max(0, Number(data.zooIncome) || 0, derivedZooIncome),
            expeditionBoost: Math.max(0, Number(data.expeditionBoost ?? base.expeditionBoost) || 0),
            offlineBoost: Math.max(1, Number(data.offlineBoost ?? base.offlineBoost) || 1),
            lastLogin: Number(data.lastLogin ?? base.lastLogin) || Date.now(),
            boost2xActiveUntil,
            animals,
            boxes: {
                common: Math.max(0, Number(data.boxes?.common) || 0),
                rare: Math.max(0, Number(data.boxes?.rare) || 0),
                epic: Math.max(0, Number(data.boxes?.epic) || 0),
                legendary: Math.max(0, Number(data.boxes?.legendary) || 0)
            },
            expedition: this.normalizeExpedition(data.expedition)
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
            expeditionBoost: state.expeditionBoost,
            offlineBoost: state.offlineBoost,
            lastLogin: Date.now(),
            boost2xActiveUntil: state.boost2xActiveUntil,
            animals: state.animals,
            boxes: state.boxes,
            expedition: state.expedition
        };
    },

    readRankingStore() {
        try {
            const raw = localStorage.getItem(this.getRankingKey());
            const parsed = raw ? JSON.parse(raw) : [];

            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("RANKING READ ERROR:", error);
            return [];
        }
    },

    writeRankingStore(rows) {
        try {
            localStorage.setItem(this.getRankingKey(), JSON.stringify(rows));
        } catch (error) {
            console.error("RANKING WRITE ERROR:", error);
        }
    },

    updateRankingSnapshot() {
        const playerId = this.getPlayerId();
        const username = this.getUsername();
        const state = this.normalizeState(CryptoZoo.state || {});
        const rows = this.readRankingStore();

        const row = {
            telegramId: playerId,
            username,
            coins: Math.max(0, Number(state.coins) || 0),
            level: Math.max(1, Number(state.level) || 1),
            updatedAt: Date.now()
        };

        const existingIndex = rows.findIndex((item) => String(item.telegramId) === String(playerId));

        if (existingIndex >= 0) {
            rows[existingIndex] = {
                ...rows[existingIndex],
                ...row
            };
        } else {
            rows.push(row);
        }

        rows.sort((a, b) => {
            const coinsDiff = (Number(b.coins) || 0) - (Number(a.coins) || 0);
            if (coinsDiff !== 0) return coinsDiff;

            const levelDiff = (Number(b.level) || 0) - (Number(a.level) || 0);
            if (levelDiff !== 0) return levelDiff;

            return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
        });

        this.writeRankingStore(rows.slice(0, 100));
    },

    async loadPlayer() {
        const playerId = this.getPlayerId();
        const playerKey = this.getPlayerSaveKey(playerId);

        const localPlayerSave = localStorage.getItem(playerKey);
        const legacySave = localStorage.getItem("cryptozoo_save");

        if (localPlayerSave) {
            try {
                CryptoZoo.state = this.normalizeState(JSON.parse(localPlayerSave));
            } catch (error) {
                console.error("PLAYER LOAD ERROR:", error);
                CryptoZoo.state = this.normalizeState(CryptoZoo.state);
            }
        } else if (legacySave) {
            try {
                CryptoZoo.state = this.normalizeState(JSON.parse(legacySave));
                localStorage.setItem(playerKey, JSON.stringify(CryptoZoo.state));
            } catch (error) {
                console.error("LEGACY LOAD ERROR:", error);
                CryptoZoo.state = this.normalizeState(CryptoZoo.state);
            }
        } else {
            CryptoZoo.state = this.normalizeState(CryptoZoo.state);
        }

        if (CryptoZoo.gameplay?.recalculateProgress) {
            CryptoZoo.gameplay.recalculateProgress();
        }

        this.updateRankingSnapshot();
        return CryptoZoo.state;
    },

    async savePlayer() {
        const playerId = this.getPlayerId();
        const playerKey = this.getPlayerSaveKey(playerId);
        const payload = this.getSavePayload();

        CryptoZoo.state = this.normalizeState(payload);

        if (CryptoZoo.gameplay?.recalculateProgress) {
            CryptoZoo.gameplay.recalculateProgress();
        }

        localStorage.setItem(playerKey, JSON.stringify(CryptoZoo.state));
        localStorage.setItem("cryptozoo_save", JSON.stringify(CryptoZoo.state));

        this.updateRankingSnapshot();
        return CryptoZoo.state;
    },

    async loadRanking() {
        try {
            this.updateRankingSnapshot();

            const rows = this.readRankingStore();

            return rows
                .sort((a, b) => {
                    const coinsDiff = (Number(b.coins) || 0) - (Number(a.coins) || 0);
                    if (coinsDiff !== 0) return coinsDiff;

                    const levelDiff = (Number(b.level) || 0) - (Number(a.level) || 0);
                    if (levelDiff !== 0) return levelDiff;

                    return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
                })
                .slice(0, 50)
                .map((row) => ({
                    telegramId: String(row.telegramId || ""),
                    username: row.username || "Gracz",
                    coins: Math.max(0, Number(row.coins) || 0),
                    level: Math.max(1, Number(row.level) || 1)
                }));
        } catch (error) {
            console.error("API ranking error:", error);
            return [];
        }
    }
};