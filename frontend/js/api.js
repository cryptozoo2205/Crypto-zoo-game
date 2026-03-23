window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    testResetMode: false,
    initialized: false,

    async init() {
        if (this.initialized) return CryptoZoo.state;
        this.initialized = true;

        try {
            await this.loadPlayer();
        } catch (error) {
            console.error("API init load failed:", error);
            CryptoZoo.state = this.normalizeState(CryptoZoo.state || this.getDefaultState());
        }

        return CryptoZoo.state;
    },

    getApiBase() {
        const fromStorage = localStorage.getItem("cryptozoo_api_base");
        if (fromStorage) {
            return String(fromStorage).replace(/\/+$/, "");
        }

        const fromConfig =
            window.CryptoZoo?.config?.apiBase ||
            window.CryptoZoo?.config?.API_BASE ||
            window.CryptoZoo?.config?.backendUrl ||
            window.CRYPTOZOO_API_BASE ||
            "";

        if (fromConfig) {
            return String(fromConfig).replace(/\/+$/, "");
        }

        return "/api";
    },

    setApiBase(value) {
        const safeValue = String(value || "").trim().replace(/\/+$/, "");

        if (!safeValue) {
            localStorage.removeItem("cryptozoo_api_base");
            return;
        }

        localStorage.setItem("cryptozoo_api_base", safeValue);
    },

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

            if (tgUser.first_name) {
                localStorage.setItem("telegramFirstName", tgUser.first_name);
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

        if (tgUser) {
            if (tgUser.username) {
                localStorage.setItem("telegramUsername", tgUser.username);
                return tgUser.username;
            }

            const fallbackName =
                [tgUser.first_name, tgUser.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || "Gracz";

            localStorage.setItem("telegramFirstName", fallbackName);
            return fallbackName;
        }

        return (
            localStorage.getItem("telegramUsername") ||
            localStorage.getItem("telegramFirstName") ||
            "Gracz"
        );
    },

    getDefaultState() {
        return {
            coins: 0,
            gems: 0,
            rewardBalance: 0,
            rewardWallet: 0,
            withdrawPending: 0,
            level: 1,
            xp: 0,
            coinsPerClick: 1,
            upgradeCost: 50,
            zooIncome: 0,
            expeditionBoost: 0,
            offlineBoost: 1,
            lastLogin: Date.now(),
            lastDailyRewardAt: 0,
            dailyRewardStreak: 0,
            dailyRewardClaimDayKey: "",
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
            expedition: null,
            minigames: {
                wheelCooldownUntil: 0,
                memoryCooldownUntil: 0,
                extraWheelSpins: 0
            },
            shopPurchases: {}
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

    normalizeMinigames(rawMinigames) {
        return {
            wheelCooldownUntil: Math.max(0, Number(rawMinigames?.wheelCooldownUntil) || 0),
            memoryCooldownUntil: Math.max(0, Number(rawMinigames?.memoryCooldownUntil) || 0),
            extraWheelSpins: Math.max(0, Number(rawMinigames?.extraWheelSpins) || 0)
        };
    },

    normalizeShopPurchases(rawShopPurchases) {
        const result = {};
        const source =
            rawShopPurchases && typeof rawShopPurchases === "object"
                ? rawShopPurchases
                : {};

        Object.keys(source).forEach((key) => {
            result[key] = Math.max(0, Number(source[key]) || 0);
        });

        return result;
    },

    recalculateZooIncomeFromAnimals(animals) {
        const configAnimals = CryptoZoo.config?.animals || {};
        const safeAnimals = animals || {};
        let total = 0;

        Object.keys(configAnimals).forEach((type) => {
            const config = configAnimals[type];
            const animal = safeAnimals[type] || { count: 0, level: 1 };

            total +=
                Math.max(0, Number(animal.count) || 0) *
                Math.max(1, Number(an