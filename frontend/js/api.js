window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    testResetMode: false,
    initialized: false,

    async init() {
        if (this.initialized) {
            return CryptoZoo.state;
        }

        this.initialized = true;

        try {
            await this.loadPlayer();
        } catch (error) {
            console.error("API init load failed:", error);
            CryptoZoo.state = this.normalizeState(
                CryptoZoo.state || this.getDefaultState()
            );
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
                hippo