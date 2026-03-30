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
            await this.syncPendingDeposits(true);
        } catch (error) {
            console.error("API init load failed:", error);
            CryptoZoo.state = this.normalizeState(
                CryptoZoo.state || this.getDefaultState()
            );
            CryptoZoo.state.telegramUser = this.getTelegramUser();
            localStorage.setItem("cryptozoo_save", JSON.stringify(CryptoZoo.state));
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

    getTelegramUser() {
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
                isMock: false,
                isTelegramWebApp: true
            };

            localStorage.setItem("telegramId", safeUser.id);
            localStorage.setItem("telegramUsername", safeUser.username);
            localStorage.setItem("telegramFirstName", safeUser.first_name);

            return safeUser;
        }

        let localId = localStorage.getItem("telegramId") || "mock-user-1";

        return {
            id: String(localId),
            username: "mock_user",
            first_name: "Mock",
            isMock: true,
            isTelegramWebApp: false
        };
    },

    getPlayerId() {
        return String(this.getTelegramUser().id);
    },

    getUsername() {
        const tg = this.getTelegramUser();
        return tg.username || tg.first_name || "Gracz";
    },

    getDefaultState() {
        return {
            telegramUser: this.getTelegramUser(),

            coins: 0,
            gems: 0,
            rewardBalance: 0,
            rewardWallet: 0,
            withdrawPending: 0,

            level: 1,
            xp: 0,

            coinsPerClick: 1,
            zooIncome: 0,

            expeditionBoost: 0,

            // 🔥 NOWE
            dailyExpeditionBoost: {
                activeUntil: 0,
                lastPurchaseAt: 0
            },

            expeditionStats: {
                rareChanceBonus: 0,
                epicChanceBonus: 0,
                timeReductionSeconds: 0,
                timeBoostCharges: []
            },

            shopPurchases: {},

            animals: {},
            boxes: {},

            expedition: null,

            lastLogin: Date.now()
        };
    },

    normalizeState(raw) {
        const base = this.getDefaultState();
        const data = raw || {};

        return {
            ...base,
            ...data,

            coins: Math.max(0, Number(data.coins) || 0),
            gems: Math.max(0, Number(data.gems) || 0),

            rewardBalance: Math.max(0, Number(data.rewardBalance) || 0),
            rewardWallet: Math.max(0, Number(data.rewardWallet) || 0),
            withdrawPending: Math.max(0, Number(data.withdrawPending) || 0),

            level: Math.max(1, Number(data.level) || 1),

            expeditionBoost: Math.max(0, Number(data.expeditionBoost) || 0),

            // 🔥 NOWE
            dailyExpeditionBoost: {
                activeUntil: Math.max(0, Number(data.dailyExpeditionBoost?.activeUntil) || 0),
                lastPurchaseAt: Math.max(0, Number(data.dailyExpeditionBoost?.lastPurchaseAt) || 0)
            }
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
            rewardWallet: state.rewardWallet,
            withdrawPending: state.withdrawPending,

            level: state.level,

            expeditionBoost: state.expeditionBoost,

            // 🔥 NOWE
            dailyExpeditionBoost: state.dailyExpeditionBoost
        };
    },

    async request(path, options = {}) {
        const response = await fetch(`${this.getApiBase()}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
    },

    async loadPlayer() {
        try {
            const data = await this.request(`/player/${this.getPlayerId()}`);
            CryptoZoo.state = this.normalizeState(data);
        } catch (e) {
            console.warn("LOAD FAIL → local fallback");
            CryptoZoo.state = this.normalizeState(
                JSON.parse(localStorage.getItem("cryptozoo_save") || "{}")
            );
        }

        localStorage.setItem("cryptozoo_save", JSON.stringify(CryptoZoo.state));
        return CryptoZoo.state;
    },

    async savePlayer() {
        const payload = this.getSavePayload();

        try {
            await this.request("/player/save", {
                method: "POST",
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn("SAVE FAIL → local only");
        }

        localStorage.setItem("cryptozoo_save", JSON.stringify(payload));
        return payload;
    },

    async syncPendingDeposits() {
        try {
            await this.request("/deposit/verify-player", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: this.getPlayerId()
                })
            });

            await this.loadPlayer();
        } catch (e) {
            console.warn("Deposit sync failed");
        }
    }
};