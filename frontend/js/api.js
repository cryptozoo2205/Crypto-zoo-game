window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    testResetMode: false,
    initialized: false,
    initPromise: null,
    saveInProgress: false,

    async init() {
        if (this.initialized) {
            return CryptoZoo.state;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                await this.loadPlayer();
                await this.syncPendingDeposits(true);
            } catch (error) {
                console.error("API init load failed:", error);

                const localState = this.readLocalState();
                CryptoZoo.state = this.normalizeState(
                    localState || CryptoZoo.state || this.getDefaultState()
                );
                CryptoZoo.state.telegramUser = this.getTelegramUser();
                CryptoZoo.state.lastLogin = Date.now();
                CryptoZoo.state.updatedAt = Date.now();

                this.writeLocalState(CryptoZoo.state);
            }

            this.initialized = true;
            return CryptoZoo.state;
        })();

        try {
            return await this.initPromise;
        } finally {
            this.initPromise = null;
        }
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
            window.CryptoZoo?.config?.serverUrl ||
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
                last_name: String(tgUser.last_name || ""),
                language_code: String(tgUser.language_code || "pl"),
                isMock: false,
                isTelegramWebApp: true
            };

            localStorage.setItem("telegramId", safeUser.id);
            localStorage.setItem("telegramUsername", safeUser.username);
            localStorage.setItem("telegramFirstName", safeUser.first_name);

            return safeUser;
        }

        const localId = localStorage.getItem("telegramId") || "mock-user-1";
        const localUsername = localStorage.getItem("telegramUsername") || "mock_user";
        const localFirstName = localStorage.getItem("telegramFirstName") || "Mock";

        return {
            id: String(localId),
            username: String(localUsername),
            first_name: String(localFirstName),
            last_name: "",
            language_code: "pl",
            isMock: true,
            isTelegramWebApp: false
        };
    },

    getPlayerId() {
        return String(this.getTelegramUser().id);
    },

    getUsername() {
        const tg = this.getTelegramUser();
        return String(tg.username || tg.first_name || "Gracz");
    },

    getDefaultState() {
        const now = Date.now();

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

            depositHistory: [],
            deposits: [],
            transactions: [],
            withdrawHistory: [],
            payoutHistory: [],
            referrals: [],
            referralHistory: [],

            missions: {},
            dailyMissions: {},
            boosts: {},
            settings: {},
            profile: {},
            stats: {},

            lastLogin: now,
            updatedAt: now
        };
    },

    normalizeNumber(value, fallback = 0, min = 0) {
        const num = Number(value);
        if (!Number.isFinite(num)) {
            return fallback;
        }
        return Math.max(min, num);
    },

    normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    },

    normalizeObject(value) {
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    },

    normalizeState(raw) {
        const base = this.getDefaultState();
        const data = this.normalizeObject(raw);

        return {
            ...base,
            ...data,

            telegramUser: {
                ...base.telegramUser,
                ...this.normalizeObject(data.telegramUser)
            },

            coins: this.normalizeNumber(data.coins, base.coins, 0),
            gems: this.normalizeNumber(data.gems, base.gems, 0),
            rewardBalance: this.normalizeNumber(data.rewardBalance, base.rewardBalance, 0),
            rewardWallet: this.normalizeNumber(data.rewardWallet, base.rewardWallet, 0),
            withdrawPending: this.normalizeNumber(data.withdrawPending, base.withdrawPending, 0),

            level: this.normalizeNumber(data.level, base.level, 1),
            xp: this.normalizeNumber(data.xp, base.xp, 0),

            coinsPerClick: this.normalizeNumber(data.coinsPerClick, base.coinsPerClick, 0),
            zooIncome: this.normalizeNumber(data.zooIncome, base.zooIncome, 0),

            expeditionBoost: this.normalizeNumber(data.expeditionBoost, base.expeditionBoost, 0),

            dailyExpeditionBoost: {
                activeUntil: this.normalizeNumber(
                    data.dailyExpeditionBoost?.activeUntil,
                    base.dailyExpeditionBoost.activeUntil,
                    0
                ),
                lastPurchaseAt: this.normalizeNumber(
                    data.dailyExpeditionBoost?.lastPurchaseAt,
                    base.dailyExpeditionBoost.lastPurchaseAt,
                    0
                )
            },

            expeditionStats: {
                rareChanceBonus: this.normalizeNumber(
                    data.expeditionStats?.rareChanceBonus,
                    base.expeditionStats.rareChanceBonus,
                    0
                ),
                epicChanceBonus: this.normalizeNumber(
                    data.expeditionStats?.epicChanceBonus,
                    base.expeditionStats.epicChanceBonus,
                    0
                ),
                timeReductionSeconds: this.normalizeNumber(
                    data.expeditionStats?.timeReductionSeconds,
                    base.expeditionStats.timeReductionSeconds,
                    0
                ),
                timeBoostCharges: this.normalizeArray(data.expeditionStats?.timeBoostCharges)
            },

            shopPurchases: this.normalizeObject(data.shopPurchases),
            animals: this.normalizeObject(data.animals),
            boxes: this.normalizeObject(data.boxes),
            expedition: data.expedition || null,

            depositHistory: this.normalizeArray(
                data.depositHistory || data.depositsHistory || data.paymentHistory
            ),
            deposits: this.normalizeArray(data.deposits),
            transactions: this.normalizeArray(data.transactions),
            withdrawHistory: this.normalizeArray(data.withdrawHistory),
            payoutHistory: this.normalizeArray(data.payoutHistory),
            referrals: this.normalizeArray(data.referrals),
            referralHistory: this.normalizeArray(data.referralHistory),

            missions: this.normalizeObject(data.missions),
            dailyMissions: this.normalizeObject(data.dailyMissions),
            boosts: this.normalizeObject(data.boosts),
            settings: this.normalizeObject(data.settings),
            profile: this.normalizeObject(data.profile),
            stats: this.normalizeObject(data.stats),

            lastLogin: this.normalizeNumber(data.lastLogin, Date.now(), 0),
            updatedAt: this.normalizeNumber(data.updatedAt, Date.now(), 0)
        };
    },

    readLocalState() {
        try {
            const raw = localStorage.getItem("cryptozoo_save");
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        } catch (error) {
            console.warn("Local save read failed:", error);
            return null;
        }
    },

    writeLocalState(state) {
        try {
            localStorage.setItem("cryptozoo_save", JSON.stringify(this.normalizeState(state)));
        } catch (error) {
            console.warn("Local save write failed:", error);
        }
    },

    getProgressScore(state) {
        const s = this.normalizeState(state);

        const animalsCount = Object.keys(s.animals || {}).length;
        const boxesCount = Object.keys(s.boxes || {}).length;
        const purchasesCount = Object.keys(s.shopPurchases || {}).length;

        return (
            s.coins +
            s.gems * 1000 +
            s.rewardBalance * 100 +
            s.rewardWallet * 100 +
            s.level * 10000 +
            s.xp +
            animalsCount * 5000 +
            boxesCount * 2500 +
            purchasesCount * 3000 +
            (s.depositHistory?.length || 0) * 2000 +
            (s.deposits?.length || 0) * 2000 +
            (s.transactions?.length || 0) * 1000 +
            (s.withdrawHistory?.length || 0) * 1500 +
            (s.referrals?.length || 0) * 800
        );
    },

    mergeUniqueByKey(primaryArr, secondaryArr) {
        const a = this.normalizeArray(primaryArr);
        const b = this.normalizeArray(secondaryArr);
        const map = new Map();

        [...b, ...a].forEach((item, index) => {
            if (item && typeof item === "object") {
                const key =
                    item.id ||
                    item._id ||
                    item.txId ||
                    item.hash ||
                    item.paymentId ||
                    item.depositId ||
                    item.createdAt ||
                    item.timestamp ||
                    `obj-${index}-${JSON.stringify(item)}`;

                if (!map.has(String(key))) {
                    map.set(String(key), item);
                }
            } else {
                const key = `primitive-${index}-${String(item)}`;
                if (!map.has(key)) {
                    map.set(key, item);
                }
            }
        });

        return Array.from(map.values());
    },

    mergeStates(serverRaw, localRaw) {
        const server = this.normalizeState(serverRaw);
        const local = this.normalizeState(localRaw);

        const serverScore = this.getProgressScore(server);
        const localScore = this.getProgressScore(local);

        const preferred = localScore > serverScore ? local : server;
        const fallback = localScore > serverScore ? server : local;

        const merged = {
            ...fallback,
            ...preferred,

            telegramUser: {
                ...fallback.telegramUser,
                ...preferred.telegramUser
            },

            coins: Math.max(server.coins, local.coins),
            gems: Math.max(server.gems, local.gems),
            rewardBalance: Math.max(server.rewardBalance, local.rewardBalance),
            rewardWallet: Math.max(server.rewardWallet, local.rewardWallet),
            withdrawPending: Math.max(server.withdrawPending, local.withdrawPending),

            level: Math.max(server.level, local.level),
            xp: Math.max(server.xp, local.xp),

            coinsPerClick: Math.max(server.coinsPerClick, local.coinsPerClick),
            zooIncome: Math.max(server.zooIncome, local.zooIncome),

            expeditionBoost: Math.max(server.expeditionBoost, local.expeditionBoost),

            dailyExpeditionBoost: {
                activeUntil: Math.max(
                    server.dailyExpeditionBoost?.activeUntil || 0,
                    local.dailyExpeditionBoost?.activeUntil || 0
                ),
                lastPurchaseAt: Math.max(
                    server.dailyExpeditionBoost?.lastPurchaseAt || 0,
                    local.dailyExpeditionBoost?.lastPurchaseAt || 0
                )
            },

            expeditionStats: {
                rareChanceBonus: Math.max(
                    server.expeditionStats?.rareChanceBonus || 0,
                    local.expeditionStats?.rareChanceBonus || 0
                ),
                epicChanceBonus: Math.max(
                    server.expeditionStats?.epicChanceBonus || 0,
                    local.expeditionStats?.epicChanceBonus || 0
                ),
                timeReductionSeconds: Math.max(
                    server.expeditionStats?.timeReductionSeconds || 0,
                    local.expeditionStats?.timeReductionSeconds || 0
                ),
                timeBoostCharges: this.mergeUniqueByKey(
                    preferred.expeditionStats?.timeBoostCharges,
                    fallback.expeditionStats?.timeBoostCharges
                )
            },

            shopPurchases: {
                ...fallback.shopPurchases,
                ...preferred.shopPurchases
            },

            animals: {
                ...fallback.animals,
                ...preferred.animals
            },

            boxes: {
                ...fallback.boxes,
                ...preferred.boxes
            },

            missions: {
                ...fallback.missions,
                ...preferred.missions
            },

            dailyMissions: {
                ...fallback.dailyMissions,
                ...preferred.dailyMissions
            },

            boosts: {
                ...fallback.boosts,
                ...preferred.boosts
            },

            settings: {
                ...fallback.settings,
                ...preferred.settings
            },

            profile: {
                ...fallback.profile,
                ...preferred.profile
            },

            stats: {
                ...fallback.stats,
                ...preferred.stats
            },

            expedition: preferred.expedition || fallback.expedition || null,

            depositHistory: this.mergeUniqueByKey(
                preferred.depositHistory,
                fallback.depositHistory
            ),
            deposits: this.mergeUniqueByKey(preferred.deposits, fallback.deposits),
            transactions: this.mergeUniqueByKey(preferred.transactions, fallback.transactions),
            withdrawHistory: this.mergeUniqueByKey(
                preferred.withdrawHistory,
                fallback.withdrawHistory
            ),
            payoutHistory: this.mergeUniqueByKey(
                preferred.payoutHistory,
                fallback.payoutHistory
            ),
            referrals: this.mergeUniqueByKey(preferred.referrals, fallback.referrals),
            referralHistory: this.mergeUniqueByKey(
                preferred.referralHistory,
                fallback.referralHistory
            ),

            lastLogin: Math.max(server.lastLogin || 0, local.lastLogin || 0, Date.now()),
            updatedAt: Math.max(server.updatedAt || 0, local.updatedAt || 0, Date.now())
        };

        return this.normalizeState(merged);
    },

    getSavePayload() {
        const state = this.normalizeState(CryptoZoo.state || {});
        state.telegramUser = this.getTelegramUser();
        state.updatedAt = Date.now();
        state.lastLogin = Date.now();

        return {
            telegramId: this.getPlayerId(),
            username: this.getUsername(),
            telegramUser: state.telegramUser,

            coins: state.coins,
            gems: state.gems,
            rewardBalance: state.rewardBalance,
            rewardWallet: state.rewardWallet,
            withdrawPending: state.withdrawPending,

            level: state.level,
            xp: state.xp,

            coinsPerClick: state.coinsPerClick,
            zooIncome: state.zooIncome,

            expeditionBoost: state.expeditionBoost,
            dailyExpeditionBoost: state.dailyExpeditionBoost,
            expeditionStats: state.expeditionStats,

            shopPurchases: state.shopPurchases,
            animals: state.animals,
            boxes: state.boxes,
            expedition: state.expedition,

            depositHistory: state.depositHistory,
            deposits: state.deposits,
            transactions: state.transactions,
            withdrawHistory: state.withdrawHistory,
            payoutHistory: state.payoutHistory,
            referrals: state.referrals,
            referralHistory: state.referralHistory,

            missions: state.missions,
            dailyMissions: state.dailyMissions,
            boosts: state.boosts,
            settings: state.settings,
            profile: state.profile,
            stats: state.stats,

            lastLogin: state.lastLogin,
            updatedAt: state.updatedAt
        };
    },

    async request(path, options = {}) {
        const config = {
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        };

        const response = await fetch(`${this.getApiBase()}${path}`, config);

        if (!response.ok) {
            let errorText = "";
            try {
                errorText = await response.text();
            } catch (_) {
                errorText = "";
            }

            throw new Error(`HTTP ${response.status}${errorText ? ` - ${errorText}` : ""}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return response.json();
        }

        return null;
    },

    async loadPlayer() {
        const localRaw = this.readLocalState();
        let serverRaw = null;

        try {
            serverRaw = await this.request(`/player/${this.getPlayerId()}`);
        } catch (error) {
            console.warn("LOAD FAIL → local fallback", error);
        }

        if (serverRaw) {
            CryptoZoo.state = this.mergeStates(serverRaw, localRaw || {});
        } else if (localRaw) {
            CryptoZoo.state = this.normalizeState(localRaw);
        } else {
            CryptoZoo.state = this.getDefaultState();
        }

        CryptoZoo.state.telegramUser = this.getTelegramUser();
        CryptoZoo.state.lastLogin = Date.now();
        CryptoZoo.state.updatedAt = Date.now();

        this.writeLocalState(CryptoZoo.state);
        return CryptoZoo.state;
    },

    async savePlayer() {
        if (this.saveInProgress) {
            return this.getSavePayload();
        }

        this.saveInProgress = true;

        try {
            const payload = this.getSavePayload();

            CryptoZoo.state = this.mergeStates(payload, CryptoZoo.state || {});
            this.writeLocalState(CryptoZoo.state);

            try {
                const response = await this.request("/player/save", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                if (response && typeof response === "object") {
                    CryptoZoo.state = this.mergeStates(response, CryptoZoo.state);
                    this.writeLocalState(CryptoZoo.state);
                }
            } catch (error) {
                console.warn("SAVE FAIL → local only", error);
            }

            return CryptoZoo.state;
        } finally {
            this.saveInProgress = false;
        }
    },

    async syncPendingDeposits(forceReload = false) {
        try {
            const response = await this.request("/deposit/verify-player", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: this.getPlayerId()
                })
            });

            if (response && typeof response === "object") {
                CryptoZoo.state = this.mergeStates(response, CryptoZoo.state || {});
                this.writeLocalState(CryptoZoo.state);
            }

            if (forceReload) {
                await this.loadPlayer();
            }

            return CryptoZoo.state;
        } catch (error) {
            console.warn("Deposit sync failed", error);
            return this.normalizeState(CryptoZoo.state || this.readLocalState() || {});
        }
    }
};