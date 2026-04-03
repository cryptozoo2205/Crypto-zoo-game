window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    testResetMode: false,
    initialized: false,
    initPromise: null,
    lifecycleBound: false,

    saveInProgress: false,
    saveQueued: false,
    saveTimer: null,
    lastSaveStartedAt: 0,
    lastSavedSnapshot: "",
    pendingDirty: false,

    requestTimeoutMs: 8000,
    minSaveIntervalMs: 30000,
    saveDebounceMs: 4000,
    saveFailCooldownMs: 15000,

    async init() {
        if (this.initialized) {
            this.bindLifecycleSave();
            return CryptoZoo.state;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                await this.loadPlayer();

                this.syncPendingDeposits(false).catch((error) => {
                    console.warn("Background deposit sync failed:", error);
                });
            } catch (error) {
                console.error("API init load failed:", error);

                const localState = this.readLocalState();
                CryptoZoo.state = this.normalizeState(
                    localState || CryptoZoo.state || this.getDefaultState()
                );
                CryptoZoo.state.telegramUser = this.getTelegramUser();
                CryptoZoo.state.updatedAt = Date.now();

                this.writeLocalState(CryptoZoo.state);
            }

            this.bindLifecycleSave();
            this.initialized = true;
            return CryptoZoo.state;
        })();

        try {
            return await this.initPromise;
        } finally {
            this.initPromise = null;
        }
    },

    bindLifecycleSave() {
        if (this.lifecycleBound) return;
        this.lifecycleBound = true;

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                this.flushSave(true).catch((error) => {
                    console.warn("flushSave on hidden failed", error);
                });
            }
        });

        window.addEventListener("beforeunload", () => {
            this.flushSave(true).catch((error) => {
                console.warn("flushSave beforeunload failed", error);
            });
        });
    },

    getApiBase() {
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

            try {
                localStorage.setItem("telegramId", safeUser.id);
                localStorage.setItem("telegramUsername", safeUser.username);
                localStorage.setItem("telegramFirstName", safeUser.first_name);
            } catch (error) {
                console.warn("telegram user localStorage failed:", error);
            }

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

            offlineBaseHours: 1,
            offlineBoostHours: 0,
            offlineAdsHours: 0,
            offlineAdsResetAt: 0,
            offlineMaxSeconds: 3600,
            offlineBoostMultiplier: 1,
            offlineBoostActiveUntil: 0,
            offlineBoost: 1,

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

            lastDailyRewardAt: 0,
            dailyRewardStreak: 0,
            dailyRewardClaimDayKey: "",

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

        const offlineBaseHours = this.normalizeNumber(
            data.offlineBaseHours,
            base.offlineBaseHours,
            1
        );

        const offlineBoostHours = Math.max(
            0,
            Math.floor(this.normalizeNumber(data.offlineBoostHours, base.offlineBoostHours, 0))
        );

        const offlineAdsHours = Math.max(
            0,
            Math.floor(this.normalizeNumber(data.offlineAdsHours, base.offlineAdsHours, 0))
        );

        const offlineMaxSeconds = Math.max(
            3600,
            this.normalizeNumber(
                data.offlineMaxSeconds,
                (offlineBaseHours + offlineBoostHours + offlineAdsHours) * 3600,
                0
            )
        );

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

            offlineBaseHours,
            offlineBoostHours,
            offlineAdsHours,
            offlineAdsResetAt: this.normalizeNumber(data.offlineAdsResetAt, base.offlineAdsResetAt, 0),
            offlineMaxSeconds,
            offlineBoostMultiplier: this.normalizeNumber(data.offlineBoostMultiplier, base.offlineBoostMultiplier, 1),
            offlineBoostActiveUntil: this.normalizeNumber(data.offlineBoostActiveUntil, base.offlineBoostActiveUntil, 0),
            offlineBoost: this.normalizeNumber(data.offlineBoost, base.offlineBoost, 1),

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

            lastDailyRewardAt: this.normalizeNumber(data.lastDailyRewardAt, base.lastDailyRewardAt, 0),
            dailyRewardStreak: Math.max(
                0,
                Math.floor(this.normalizeNumber(data.dailyRewardStreak, base.dailyRewardStreak, 0))
            ),
            dailyRewardClaimDayKey: String(data.dailyRewardClaimDayKey || base.dailyRewardClaimDayKey || ""),

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

        return this.normalizeState({
            ...server,
            ...local,

            telegramUser: {
                ...server.telegramUser,
                ...local.telegramUser
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
                    local.expeditionStats?.timeBoostCharges,
                    server.expeditionStats?.timeBoostCharges
                )
            },

            shopPurchases: {
                ...server.shopPurchases,
                ...local.shopPurchases
            },

            animals: {
                ...server.animals,
                ...local.animals
            },

            boxes: {
                ...server.boxes,
                ...local.boxes
            },

            missions: {
                ...server.missions,
                ...local.missions
            },

            dailyMissions: {
                ...server.dailyMissions,
                ...local.dailyMissions
            },

            boosts: {
                ...server.boosts,
                ...local.boosts
            },

            settings: {
                ...server.settings,
                ...local.settings
            },

            profile: {
                ...server.profile,
                ...local.profile
            },

            stats: {
                ...server.stats,
                ...local.stats
            },

            expedition: local.expedition || server.expedition || null,

            offlineBaseHours: Math.max(server.offlineBaseHours || 1, local.offlineBaseHours || 1),
            offlineBoostHours: Math.max(server.offlineBoostHours || 0, local.offlineBoostHours || 0),
            offlineAdsHours: Math.max(server.offlineAdsHours || 0, local.offlineAdsHours || 0),
            offlineAdsResetAt: Math.max(server.offlineAdsResetAt || 0, local.offlineAdsResetAt || 0),
            offlineMaxSeconds: Math.max(server.offlineMaxSeconds || 3600, local.offlineMaxSeconds || 3600),
            offlineBoostMultiplier: Math.max(server.offlineBoostMultiplier || 1, local.offlineBoostMultiplier || 1),
            offlineBoostActiveUntil: Math.max(server.offlineBoostActiveUntil || 0, local.offlineBoostActiveUntil || 0),
            offlineBoost: Math.max(server.offlineBoost || 1, local.offlineBoost || 1),

            depositHistory: this.mergeUniqueByKey(local.depositHistory, server.depositHistory),
            deposits: this.mergeUniqueByKey(local.deposits, server.deposits),
            transactions: this.mergeUniqueByKey(local.transactions, server.transactions),
            withdrawHistory: this.mergeUniqueByKey(local.withdrawHistory, server.withdrawHistory),
            payoutHistory: this.mergeUniqueByKey(local.payoutHistory, server.payoutHistory),
            referrals: this.mergeUniqueByKey(local.referrals, server.referrals),
            referralHistory: this.mergeUniqueByKey(local.referralHistory, server.referralHistory),

            lastDailyRewardAt: Math.max(server.lastDailyRewardAt || 0, local.lastDailyRewardAt || 0),
            dailyRewardStreak: Math.max(server.dailyRewardStreak || 0, local.dailyRewardStreak || 0),
            dailyRewardClaimDayKey:
                String(local.dailyRewardClaimDayKey || "") ||
                String(server.dailyRewardClaimDayKey || ""),

            lastLogin: Math.max(server.lastLogin || 0, local.lastLogin || 0),
            updatedAt: Date.now()
        });
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

            offlineBaseHours: state.offlineBaseHours,
            offlineBoostHours: state.offlineBoostHours,
            offlineAdsHours: state.offlineAdsHours,
            offlineAdsResetAt: state.offlineAdsResetAt,
            offlineMaxSeconds: state.offlineMaxSeconds,
            offlineBoostMultiplier: state.offlineBoostMultiplier,
            offlineBoostActiveUntil: state.offlineBoostActiveUntil,
            offlineBoost: state.offlineBoost,

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

            lastDailyRewardAt: state.lastDailyRewardAt,
            dailyRewardStreak: state.dailyRewardStreak,
            dailyRewardClaimDayKey: state.dailyRewardClaimDayKey,

            lastLogin: state.lastLogin,
            updatedAt: state.updatedAt
        };
    },

    getSaveFingerprintFromPayload(payload) {
        return JSON.stringify({
            telegramId: payload.telegramId,
            coins: payload.coins,
            gems: payload.gems,
            rewardBalance: payload.rewardBalance,
            rewardWallet: payload.rewardWallet,
            withdrawPending: payload.withdrawPending,
            level: payload.level,
            xp: payload.xp,
            coinsPerClick: payload.coinsPerClick,
            zooIncome: payload.zooIncome,
            expeditionBoost: payload.expeditionBoost,
            dailyExpeditionBoost: payload.dailyExpeditionBoost,
            expeditionStats: payload.expeditionStats,
            shopPurchases: payload.shopPurchases,
            animals: payload.animals,
            boxes: payload.boxes,
            expedition: payload.expedition,
            offlineBaseHours: payload.offlineBaseHours,
            offlineBoostHours: payload.offlineBoostHours,
            offlineAdsHours: payload.offlineAdsHours,
            offlineAdsResetAt: payload.offlineAdsResetAt,
            offlineMaxSeconds: payload.offlineMaxSeconds,
            offlineBoostMultiplier: payload.offlineBoostMultiplier,
            offlineBoostActiveUntil: payload.offlineBoostActiveUntil,
            offlineBoost: payload.offlineBoost,
            depositHistory: payload.depositHistory,
            deposits: payload.deposits,
            transactions: payload.transactions,
            withdrawHistory: payload.withdrawHistory,
            payoutHistory: payload.payoutHistory,
            referrals: payload.referrals,
            referralHistory: payload.referralHistory,
            missions: payload.missions,
            dailyMissions: payload.dailyMissions,
            boosts: payload.boosts,
            settings: payload.settings,
            profile: payload.profile,
            stats: payload.stats,
            lastDailyRewardAt: payload.lastDailyRewardAt,
            dailyRewardStreak: payload.dailyRewardStreak,
            dailyRewardClaimDayKey: payload.dailyRewardClaimDayKey
        });
    },

    async request(path, options = {}) {
        const controller = new AbortController();
        const timeoutMs = Math.max(1000, Number(options.timeoutMs) || this.requestTimeoutMs);
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);

        try {
            const config = {
                method: options.method || "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },
                ...options,
                signal: controller.signal
            };

            delete config.timeoutMs;

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
        } catch (error) {
            if (error?.name === "AbortError") {
                throw new Error(`Request timeout after ${timeoutMs}ms: ${path}`);
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    },

    unwrapPlayerResponse(data) {
        if (data && typeof data === "object" && data.player && typeof data.player === "object") {
            return data.player;
        }
        return data;
    },

    async loadPlayer() {
        const localRaw = this.readLocalState();
        let serverRaw = null;

        try {
            console.log("LOAD PLAYER ID:", this.getPlayerId());
            console.log("API BASE:", this.getApiBase());

            serverRaw = await this.request(`/player/${this.getPlayerId()}`, {
                timeoutMs: 4000
            });
            serverRaw = this.unwrapPlayerResponse(serverRaw);
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

        this.writeLocalState(CryptoZoo.state);

        try {
            const payload = this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
            this.pendingDirty = false;
        } catch (error) {
            console.warn("Snapshot init failed:", error);
        }

        return CryptoZoo.state;
    },

    markDirty() {
        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.telegramUser = this.getTelegramUser();
        CryptoZoo.state.updatedAt = Date.now();
        CryptoZoo.state.lastLogin = Date.now();

        this.pendingDirty = true;
        this.writeLocalState(CryptoZoo.state);
        this.scheduleSave(this.saveDebounceMs);
    },

    scheduleSave(delayMs = 0) {
        clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            this.flushSave(false).catch((error) => {
                console.warn("flushSave failed", error);
            });
        }, Math.max(0, Number(delayMs) || 0));
    },

    async flushSave(force = false) {
        const payload = this.getSavePayload();
        const nextSnapshot = this.getSaveFingerprintFromPayload(payload);

        this.writeLocalState(payload);

        if (!force && !this.pendingDirty && this.lastSavedSnapshot === nextSnapshot) {
            return CryptoZoo.state;
        }

        if (this.saveInProgress) {
            this.saveQueued = true;
            return CryptoZoo.state;
        }

        const now = Date.now();
        const elapsed = now - this.lastSaveStartedAt;

        if (!force && elapsed < this.minSaveIntervalMs) {
            this.saveQueued = true;
            this.scheduleSave(this.minSaveIntervalMs - elapsed);
            return CryptoZoo.state;
        }

        this.saveInProgress = true;
        this.saveQueued = false;
        this.lastSaveStartedAt = Date.now();

        try {
            try {
                const response = await this.request("/player/save", {
                    method: "POST",
                    body: JSON.stringify(payload),
                    timeoutMs: 3500
                });

                const safeResponse = this.unwrapPlayerResponse(response);

                if (safeResponse && typeof safeResponse === "object") {
                    CryptoZoo.state = this.mergeStates(safeResponse, CryptoZoo.state || payload);
                    this.writeLocalState(CryptoZoo.state);
                } else {
                    CryptoZoo.state = this.normalizeState(CryptoZoo.state || payload);
                    this.writeLocalState(CryptoZoo.state);
                }

                this.lastSavedSnapshot = nextSnapshot;
                this.pendingDirty = false;
            } catch (error) {
                console.warn("SAVE FAIL → local only", error);

                CryptoZoo.state = this.normalizeState(CryptoZoo.state || payload);
                this.writeLocalState(CryptoZoo.state);

                this.lastSavedSnapshot = nextSnapshot;
                this.pendingDirty = false;
                this.lastSaveStartedAt = Date.now() + this.saveFailCooldownMs;
            }

            return CryptoZoo.state;
        } finally {
            this.saveInProgress = false;

            if (this.saveQueued) {
                this.saveQueued = false;
                this.scheduleSave(this.minSaveIntervalMs);
            }
        }
    },

    async savePlayer() {
        this.markDirty();
        return CryptoZoo.state;
    },

    async expeditionStart(expeditionId) {
        const response = await this.request("/expedition/start", {
            method: "POST",
            body: JSON.stringify({
                telegramId: this.getPlayerId(),
                username: this.getUsername(),
                expeditionId
            }),
            timeoutMs: 4000
        });

        const playerPart = this.unwrapPlayerResponse(response?.player || response);

        if (playerPart && typeof playerPart === "object") {
            CryptoZoo.state = this.mergeStates(playerPart, CryptoZoo.state || {});
            this.writeLocalState(CryptoZoo.state);

            const payload = this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
            this.pendingDirty = false;
        }

        return response;
    },

    async expeditionCollect() {
        const response = await this.request("/expedition/collect", {
            method: "POST",
            body: JSON.stringify({
                telegramId: this.getPlayerId(),
                username: this.getUsername()
            }),
            timeoutMs: 5000
        });

        const playerPart = this.unwrapPlayerResponse(response?.player || response);

        if (playerPart && typeof playerPart === "object") {
            CryptoZoo.state = this.mergeStates(playerPart, CryptoZoo.state || {});
            this.writeLocalState(CryptoZoo.state);

            const payload = this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
            this.pendingDirty = false;
        }

        return response;
    },

    async expeditionUseTimeReduction(seconds = 0) {
        const response = await this.request("/expedition/use-time-reduction", {
            method: "POST",
            body: JSON.stringify({
                telegramId: this.getPlayerId(),
                username: this.getUsername(),
                seconds: Math.max(0, Number(seconds) || 0)
            }),
            timeoutMs: 4000
        });

        const playerPart = this.unwrapPlayerResponse(response?.player || response);

        if (playerPart && typeof playerPart === "object") {
            CryptoZoo.state = this.mergeStates(playerPart, CryptoZoo.state || {});
            this.writeLocalState(CryptoZoo.state);

            const payload = this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
            this.pendingDirty = false;
        }

        return response;
    },

    async syncPendingDeposits(forceReload = false) {
        try {
            const response = await this.request("/deposit/verify-player", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: this.getPlayerId()
                }),
                timeoutMs: 3000
            });

            if (response && typeof response === "object") {
                const playerPart = this.unwrapPlayerResponse(response.player || response);

                if (playerPart && typeof playerPart === "object") {
                    CryptoZoo.state = this.mergeStates(playerPart, CryptoZoo.state || {});
                    this.writeLocalState(CryptoZoo.state);

                    const payload = this.getSavePayload();
                    this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
                    this.pendingDirty = false;
                }
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