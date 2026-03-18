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

        return {
            id: rawExpedition.id || "",
            name: rawExpedition.name || "Expedition",
            startTime: Number(rawExpedition.startTime) || Date.now(),
            endTime: Number(rawExpedition.endTime) || 0,
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
            zooIncome: Math.max(0, Number(data.zooIncome)) || derivedZooIncome,
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

    async loadPlayer() {
        const localSave = localStorage.getItem("cryptozoo_save");

        if (localSave) {
            try {
                CryptoZoo.state = this.normalizeState(JSON.parse(localSave));
            } catch (error) {
                console.error("Local load error:", error);
                CryptoZoo.state = this.normalizeState(CryptoZoo.state);
            }
        } else {
            CryptoZoo.state = this.normalizeState(CryptoZoo.state);
        }

        if (CryptoZoo.gameplay?.recalculateProgress) {
            CryptoZoo.gameplay.recalculateProgress();
        }

        return CryptoZoo.state;
    },

    async savePlayer() {
        const payload = this.getSavePayload();
        CryptoZoo.state = this.normalizeState(payload);

        if (CryptoZoo.gameplay?.recalculateProgress) {
            CryptoZoo.gameplay.recalculateProgress();
        }

        localStorage.setItem("cryptozoo_save", JSON.stringify(CryptoZoo.state));
        return CryptoZoo.state;
    },

    async loadRanking() {
        try {
            const currentName = this.getUsername();
            const currentCoins = Number(CryptoZoo.state?.coins) || 0;

            return [
                {
                    username: currentName,
                    coins: currentCoins
                }
            ];
        } catch (error) {
            console.error("API ranking error:", error);
            return [];
        }
    }
};