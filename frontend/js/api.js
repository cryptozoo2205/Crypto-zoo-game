window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.api = {
    testResetMode: false,
    localSaveKeyPrefix: "cryptozoo_save_",
    legacyLocalSaveKey: "cryptozoo_save",
    testLocalSaveKeyPrefix: "cryptozoo_test_save_",
    legacyTestLocalSaveKey: "cryptozoo_test_save",

    initialized: false,
    initPromise: null,
    lifecycleBound: false,
    ensurePlayerPromise: null,

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

                if (!this.testResetMode) {
                    this.syncPendingDeposits(false).catch((error) => {
                        console.warn("Background deposit sync failed:", error);
                    });
                }
            } catch (error) {
                console.error("API init load failed:", error);

                const telegramUser = await this.getTelegramUser();
                const localState = this.readLocalState(telegramUser.id);

                CryptoZoo.state = this.normalizeState(
                    localState || CryptoZoo.state || this.getDefaultState(telegramUser)
                );
                CryptoZoo.state.telegramUser = telegramUser;
                CryptoZoo.state.updatedAt = Date.now();
                CryptoZoo.state.lastLogin = Date.now();

                this.writeLocalState(CryptoZoo.state, telegramUser.id);

                try {
                    const payload = await this.getSavePayload();
                    this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
                    this.pendingDirty = false;
                } catch (snapshotError) {
                    console.warn("Snapshot init after fallback failed:", snapshotError);
                }
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

    getLocalSaveKeyById(telegramId) {
        const safeId = String(telegramId || "").trim();
        if (!safeId) {
            return this.testResetMode ? this.legacyTestLocalSaveKey : this.legacyLocalSaveKey;
        }

        return this.testResetMode
            ? `${this.testLocalSaveKeyPrefix}${safeId}`
            : `${this.localSaveKeyPrefix}${safeId}`;
    },

    async getStorageKey() {
        const telegramUser = await this.getTelegramUser();
        return this.getLocalSaveKeyById(telegramUser.id);
    },

    getApiBase() {
        const fromConfig =
            window.CryptoZoo?.config?.apiBase ||
            window.CryptoZoo?.config?.API_BASE ||
            window.CryptoZoo?.config?.backendUrl ||
            window.CryptoZoo?.config?.serverUrl ||
            window.CRYPTOZOO_API_BASE ||
            "";

        const pageOrigin = String(window.location?.origin || "").replace(/\/+$/, "");
        const isLocalHost =
            /localhost|127\.0\.0\.1/i.test(pageOrigin) ||
            /^file:/i.test(String(window.location?.protocol || ""));

        if (fromConfig) {
            const cleaned = String(fromConfig).replace(/\/+$/, "");

            if (!isLocalHost && pageOrigin) {
                if (/^https?:\/\/[^/]+:\d+$/i.test(cleaned)) {
                    return `${pageOrigin}/api`;
                }

                if (/^https?:\/\/[^/]+$/i.test(cleaned)) {
                    return `${cleaned}/api`;
                }

                return cleaned;
            }

            return cleaned;
        }

        if (!isLocalHost && pageOrigin) {
            return `${pageOrigin}/api`;
        }

        return "/api";
    },

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    readTelegramUserOnce() {
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

        return null;
    },

    async getTelegramUser() {
        try {
            if (window.Telegram?.WebApp?.ready) {
                window.Telegram.WebApp.ready();
            }

            if (window.Telegram?.WebApp?.expand) {
                window.Telegram.WebApp.expand();
            }
        } catch (error) {
            console.warn("Telegram WebApp ready/expand failed:", error);
        }

        for (let i = 0; i < 10; i += 1) {
            const user = this.readTelegramUserOnce();
            if (user && user.id) {
                return user;
            }

            await this.sleep(150);
        }

        const cachedId = String(localStorage.getItem("telegramId") || "").trim();
        const cachedUsername = String(localStorage.getItem("telegramUsername") || "").trim();
        const cachedFirstName = String(localStorage.getItem("telegramFirstName") || "").trim();

        if (cachedId) {
            return {
                id: cachedId,
                username: cachedUsername,
                first_name: cachedFirstName || "Gracz",
                last_name: "",
                language_code: "pl",
                isMock: false,
                isTelegramWebApp: false,
                isCached: true
            };
        }

        throw new Error("Missing Telegram user id");
    },

    async getPlayerId() {
        const user = await this.getTelegramUser();
        return String(user.id);
    },

    async getUsername() {
        const tg = await this.getTelegramUser();
        return String(tg.username || tg.first_name || "Gracz");
    },

    getTelegramStartParam() {
        try {
            return String(window.Telegram?.WebApp?.initDataUnsafe?.start_param || "").trim();
        } catch (error) {
            console.warn("getTelegramStartParam failed:", error);
            return "";
        }
    },

    getUrlStartParam() {
        try {
            const params = new URLSearchParams(window.location.search || "");
            return String(
                params.get("start") ||
                params.get("startapp") ||
                params.get("ref") ||
                ""
            ).trim();
        } catch (error) {
            console.warn("getUrlStartParam failed:", error);
            return "";
        }
    },

    getReferralCodeFromRaw(rawValue) {
        const safe = String(rawValue || "").trim();
        if (!safe) return "";

        if (safe.startsWith("ref_")) {
            return safe.slice(4).trim();
        }

        return safe;
    },

    getReferralCode() {
        const telegramStart = this.getTelegramStartParam();
        const urlStart = this.getUrlStartParam();

        return this.getReferralCodeFromRaw(telegramStart || urlStart);
    },

    async applyReferralIfNeeded() {
        const telegramId = await this.getPlayerId();
        const username = await this.getUsername();
        const referralCode = this.getReferralCode();

        if (!telegramId || !referralCode) {
            return null;
        }

        if (String(telegramId) === String(referralCode)) {
            return null;
        }

        const localKey = `cryptozoo_ref_applied_${telegramId}`;
        const alreadyApplied = String(localStorage.getItem(localKey) || "").trim();

        if (alreadyApplied === referralCode) {
            return null;
        }

        try {
            const response = await this.request("/referrals/apply", {
                method: "POST",
                body: JSON.stringify({
                    telegramId,
                    username,
                    referralCode
                }),
                timeoutMs: 5000,
                retryCount: 1
            });

            localStorage.setItem(localKey, referralCode);
            return response;
        } catch (error) {
            console.warn("Referral apply failed:", error);
            return null;
        }
    },

    getDefaultState(telegramUser = null) {
        const now = Date.now();
        const safeTelegramUser =
            telegramUser && telegramUser.id
                ? telegramUser
                : {
                      id: "",
                      username: "",
                      first_name: "Gracz",
                      last_name: "",
                      language_code: "pl",
                      isMock: false,
                      isTelegramWebApp: false
                  };

        return {
            telegramUser: safeTelegramUser,

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
            expeditionBoostActiveUntil: 0,

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

            minigames: {
                wheelCooldownUntil: 0,
                memoryCooldownUntil: 0,
                tapChallengeCooldownUntil: 0,
                animalHuntCooldownUntil: 0,
                extraWheelSpins: 0
            },

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

            referredBy: "",
            referralCode: "",
            referralsCount: 0,
            referrals: [],
            referralHistory: [],
            referralWelcomeBonusClaimed: false,
            referralActivated: false,
            referralActivationBonusClaimed: false,

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

    normalizeReferralEntry(raw) {
        const item = this.normalizeObject(raw);

        return {
            telegramId: String(item.telegramId || ""),
            username: String(item.username || "Gracz"),
            firstName: String(item.firstName || ""),
            createdAt: this.normalizeNumber(item.createdAt, 0, 0),
            activated: Boolean(item.activated),
            activatedAt: this.normalizeNumber(item.activatedAt, 0, 0)
        };
    },

    normalizeReferralsList(value) {
        return this.normalizeArray(value)
            .map((item) => this.normalizeReferralEntry(item))
            .filter((item) => !!item.telegramId);
    },

    normalizeDepositItem(raw) {
        const item = this.normalizeObject(raw);

        return {
            ...item,
            id: String(item.id || item._id || item.depositId || ""),
            depositId: String(item.depositId || item.id || item._id || ""),
            txHash: String(item.txHash || item.hash || ""),
            telegramId: String(item.telegramId || ""),
            username: String(item.username || ""),
            amount: this.normalizeNumber(item.amount, 0, 0),
            gemsAmount: this.normalizeNumber(item.gemsAmount, 0, 0),
            expeditionBoostAmount: this.normalizeNumber(item.expeditionBoostAmount, 0, 0),
            expeditionBoostDurationMs: this.normalizeNumber(item.expeditionBoostDurationMs, 0, 0),
            paymentComment: String(item.paymentComment || ""),
            walletAddress: String(item.walletAddress || ""),
            source: String(item.source || ""),
            asset: String(item.asset || item.currency || "TON"),
            currency: String(item.currency || item.asset || "TON"),
            network: String(item.network || "TON"),
            status: String(item.status || "").toLowerCase() || "created",
            note: String(item.note || ""),
            createdAt: this.normalizeNumber(item.createdAt, 0, 0),
            updatedAt: this.normalizeNumber(item.updatedAt, 0, 0),
            approvedAt: this.normalizeNumber(item.approvedAt, 0, 0),
            expiresAt: this.normalizeNumber(item.expiresAt, 0, 0)
        };
    },

    normalizeDepositsList(value) {
        return this.normalizeArray(value)
            .map((item) => this.normalizeDepositItem(item))
            .sort((a, b) => {
                const timeA = Math.max(
                    Number(a.updatedAt || 0),
                    Number(a.createdAt || 0),
                    Number(a.approvedAt || 0)
                );
                const timeB = Math.max(
                    Number(b.updatedAt || 0),
                    Number(b.createdAt || 0),
                    Number(b.approvedAt || 0)
                );
                return timeB - timeA;
            });
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
            expeditionBoostActiveUntil: this.normalizeNumber(
                data.expeditionBoostActiveUntil,
                base.expeditionBoostActiveUntil,
                0
            ),

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

            minigames: {
                wheelCooldownUntil: this.normalizeNumber(
                    data.minigames?.wheelCooldownUntil,
                    base.minigames.wheelCooldownUntil,
                    0
                ),
                memoryCooldownUntil: this.normalizeNumber(
                    data.minigames?.memoryCooldownUntil,
                    base.minigames.memoryCooldownUntil,
                    0
                ),
                tapChallengeCooldownUntil: this.normalizeNumber(
                    data.minigames?.tapChallengeCooldownUntil,
                    base.minigames.tapChallengeCooldownUntil,
                    0
                ),
                animalHuntCooldownUntil: this.normalizeNumber(
                    data.minigames?.animalHuntCooldownUntil,
                    base.minigames.animalHuntCooldownUntil,
                    0
                ),
                extraWheelSpins: this.normalizeNumber(
                    data.minigames?.extraWheelSpins,
                    base.minigames.extraWheelSpins,
                    0
                )
            },

            offlineBaseHours,
            offlineBoostHours,
            offlineAdsHours,
            offlineAdsResetAt: this.normalizeNumber(
                data.offlineAdsResetAt,
                base.offlineAdsResetAt,
                0
            ),
            offlineMaxSeconds,
            offlineBoostMultiplier: this.normalizeNumber(
                data.offlineBoostMultiplier,
                base.offlineBoostMultiplier,
                1
            ),
            offlineBoostActiveUntil: this.normalizeNumber(
                data.offlineBoostActiveUntil,
                base.offlineBoostActiveUntil,
                0
            ),
            offlineBoost: this.normalizeNumber(data.offlineBoost, base.offlineBoost, 1),

            depositHistory: this.normalizeDepositsList(
                data.depositHistory || data.depositsHistory || data.paymentHistory
            ),
            deposits: this.normalizeDepositsList(data.deposits),
            transactions: this.normalizeArray(data.transactions),
            withdrawHistory: this.normalizeArray(data.withdrawHistory),
            payoutHistory: this.normalizeArray(data.payoutHistory),

            referredBy: String(data.referredBy || base.referredBy || ""),
            referralCode: String(data.referralCode || base.referralCode || ""),
            referralsCount: this.normalizeNumber(
                data.referralsCount,
                base.referralsCount,
                0
            ),
            referrals: this.normalizeReferralsList(data.referrals),
            referralHistory: this.normalizeArray(data.referralHistory),
            referralWelcomeBonusClaimed: Boolean(data.referralWelcomeBonusClaimed),
            referralActivated: Boolean(data.referralActivated),
            referralActivationBonusClaimed: Boolean(data.referralActivationBonusClaimed),

            missions: this.normalizeObject(data.missions),
            dailyMissions: this.normalizeObject(data.dailyMissions),
            boosts: this.normalizeObject(data.boosts),
            settings: this.normalizeObject(data.settings),
            profile: this.normalizeObject(data.profile),
            stats: this.normalizeObject(data.stats),

            lastDailyRewardAt: this.normalizeNumber(
                data.lastDailyRewardAt,
                base.lastDailyRewardAt,
                0
            ),
            dailyRewardStreak: Math.max(
                0,
                Math.floor(
                    this.normalizeNumber(
                        data.dailyRewardStreak,
                        base.dailyRewardStreak,
                        0
                    )
                )
            ),
            dailyRewardClaimDayKey: String(
                data.dailyRewardClaimDayKey || base.dailyRewardClaimDayKey || ""
            ),

            lastLogin: this.normalizeNumber(data.lastLogin, Date.now(), 0),
            updatedAt: this.normalizeNumber(data.updatedAt, Date.now(), 0)
        };
    },

    readLocalStateByKey(storageKey) {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        } catch (error) {
            console.warn("Local save read failed:", error);
            return null;
        }
    },

    readLocalState(telegramId = "") {
        const key = this.getLocalSaveKeyById(telegramId);
        return this.readLocalStateByKey(key);
    },

    writeLocalState(state, telegramId = "") {
        try {
            const key = this.getLocalSaveKeyById(
                telegramId || state?.telegramUser?.id || ""
            );

            localStorage.setItem(
                key,
                JSON.stringify(this.normalizeState(state))
            );
        } catch (error) {
            console.warn("Local save write failed:", error);
        }
    },

    async clearCurrentModeLocalState() {
        try {
            const key = await this.getStorageKey();
            localStorage.removeItem(key);
        } catch (error) {
            console.warn("Local save remove failed:", error);
        }
    },

    getItemIdentity(item, index = 0) {
        if (item && typeof item === "object") {
            return String(
                item.id ||
                    item._id ||
                    item.txId ||
                    item.hash ||
                    item.paymentId ||
                    item.depositId ||
                    item.txHash ||
                    item.telegramId ||
                    item.createdAt ||
                    `obj-${index}-${JSON.stringify(item)}`
            );
        }

        return `primitive-${index}-${String(item)}`;
    },

    mergeUniqueByKey(primaryArr, secondaryArr) {
        const a = this.normalizeArray(primaryArr);
        const b = this.normalizeArray(secondaryArr);
        const map = new Map();

        [...b, ...a].forEach((item, index) => {
            const key = this.getItemIdentity(item, index);

            if (!map.has(key)) {
                map.set(key, item);
            }
        });

        return Array.from(map.values());
    },

    mergeDeposits(primaryArr, secondaryArr) {
        const a = this.normalizeDepositsList(primaryArr);
        const b = this.normalizeDepositsList(secondaryArr);
        const map = new Map();

        [...b, ...a].forEach((item, index) => {
            const key = this.getItemIdentity(item, index);
            const existing = map.get(key);

            if (!existing) {
                map.set(key, item);
                return;
            }

            const existingUpdatedAt = Math.max(
                Number(existing.updatedAt || 0),
                Number(existing.createdAt || 0),
                Number(existing.approvedAt || 0)
            );
            const nextUpdatedAt = Math.max(
                Number(item.updatedAt || 0),
                Number(item.createdAt || 0),
                Number(item.approvedAt || 0)
            );

            if (nextUpdatedAt >= existingUpdatedAt) {
                map.set(key, item);
            }
        });

        return Array.from(map.values()).sort((x, y) => {
            const timeX = Math.max(
                Number(x.updatedAt || 0),
                Number(x.createdAt || 0),
                Number(x.approvedAt || 0)
            );
            const timeY = Math.max(
                Number(y.updatedAt || 0),
                Number(y.createdAt || 0),
                Number(y.approvedAt || 0)
            );
            return timeY - timeX;
        });
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

            rewardBalance: server.rewardBalance,
            rewardWallet: server.rewardWallet,
            withdrawPending: server.withdrawPending,

            level: Math.max(server.level, local.level),
            xp: Math.max(server.xp, local.xp),

            coinsPerClick: Math.max(server.coinsPerClick, local.coinsPerClick),
            zooIncome: Math.max(server.zooIncome, local.zooIncome),
            expeditionBoost: Math.max(server.expeditionBoost, local.expeditionBoost),
            expeditionBoostActiveUntil: Math.max(
                server.expeditionBoostActiveUntil || 0,
                local.expeditionBoostActiveUntil || 0
            ),

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

            expedition: server.expedition || null,

            minigames: {
                wheelCooldownUntil: Math.max(
                    server.minigames?.wheelCooldownUntil || 0,
                    local.minigames?.wheelCooldownUntil || 0
                ),
                memoryCooldownUntil: Math.max(
                    server.minigames?.memoryCooldownUntil || 0,
                    local.minigames?.memoryCooldownUntil || 0
                ),
                tapChallengeCooldownUntil: Math.max(
                    server.minigames?.tapChallengeCooldownUntil || 0,
                    local.minigames?.tapChallengeCooldownUntil || 0
                ),
                animalHuntCooldownUntil: Math.max(
                    server.minigames?.animalHuntCooldownUntil || 0,
                    local.minigames?.animalHuntCooldownUntil || 0
                ),
                extraWheelSpins: Math.max(
                    server.minigames?.extraWheelSpins || 0,
                    local.minigames?.extraWheelSpins || 0
                )
            },

            offlineBaseHours: Math.max(
                server.offlineBaseHours || 1,
                local.offlineBaseHours || 1
            ),
            offlineBoostHours: Math.max(
                server.offlineBoostHours || 0,
                local.offlineBoostHours || 0
            ),
            offlineAdsHours: Math.max(
                server.offlineAdsHours || 0,
                local.offlineAdsHours || 0
            ),
            offlineAdsResetAt: Math.max(
                server.offlineAdsResetAt || 0,
                local.offlineAdsResetAt || 0
            ),
            offlineMaxSeconds: Math.max(
                server.offlineMaxSeconds || 3600,
                local.offlineMaxSeconds || 3600
            ),
            offlineBoostMultiplier: Math.max(
                server.offlineBoostMultiplier || 1,
                local.offlineBoostMultiplier || 1
            ),
            offlineBoostActiveUntil: Math.max(
                server.offlineBoostActiveUntil || 0,
                local.offlineBoostActiveUntil || 0
            ),
            offlineBoost: Math.max(server.offlineBoost || 1, local.offlineBoost || 1),

            depositHistory: this.mergeDeposits(
                local.depositHistory,
                server.depositHistory
            ),
            deposits: this.mergeDeposits(local.deposits, server.deposits),
            transactions: this.mergeUniqueByKey(
                local.transactions,
                server.transactions
            ),
            withdrawHistory: this.mergeUniqueByKey(
                local.withdrawHistory,
                server.withdrawHistory
            ),
            payoutHistory: this.mergeUniqueByKey(
                local.payoutHistory,
                server.payoutHistory
            ),

            referredBy: String(server.referredBy || local.referredBy || ""),
            referralCode: String(server.referralCode || local.referralCode || ""),
            referralsCount: Math.max(
                Number(server.referralsCount || 0),
                Number(local.referralsCount || 0)
            ),
            referrals: this.mergeUniqueByKey(local.referrals, server.referrals),
            referralHistory: this.mergeUniqueByKey(
                local.referralHistory,
                server.referralHistory
            ),
            referralWelcomeBonusClaimed:
                Boolean(server.referralWelcomeBonusClaimed) ||
                Boolean(local.referralWelcomeBonusClaimed),
            referralActivated:
                Boolean(server.referralActivated) ||
                Boolean(local.referralActivated),
            referralActivationBonusClaimed:
                Boolean(server.referralActivationBonusClaimed) ||
                Boolean(local.referralActivationBonusClaimed),

            lastDailyRewardAt: Math.max(
                server.lastDailyRewardAt || 0,
                local.lastDailyRewardAt || 0
            ),
            dailyRewardStreak: Math.max(
                server.dailyRewardStreak || 0,
                local.dailyRewardStreak || 0
            ),
            dailyRewardClaimDayKey:
                String(local.dailyRewardClaimDayKey || "") ||
                String(server.dailyRewardClaimDayKey || ""),

            lastLogin: Math.max(server.lastLogin || 0, local.lastLogin || 0),
            updatedAt: Date.now()
        });
    },

    async getSavePayload() {
        const telegramUser = await this.getTelegramUser();
        const state = this.normalizeState(CryptoZoo.state || {});
        state.telegramUser = telegramUser;
        state.updatedAt = Date.now();
        state.lastLogin = Date.now();

        return {
            telegramId: String(telegramUser.id),
            username: String(telegramUser.username || telegramUser.first_name || "Gracz"),
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
            expeditionBoostActiveUntil: state.expeditionBoostActiveUntil,
            dailyExpeditionBoost: state.dailyExpeditionBoost,
            expeditionStats: state.expeditionStats,

            shopPurchases: state.shopPurchases,
            animals: state.animals,
            boxes: state.boxes,
            expedition: state.expedition,
            minigames: state.minigames,

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

            referredBy: state.referredBy,
            referralCode: state.referralCode,
            referralsCount: state.referralsCount,
            referrals: state.referrals,
            referralHistory: state.referralHistory,
            referralWelcomeBonusClaimed: state.referralWelcomeBonusClaimed,
            referralActivated: state.referralActivated,
            referralActivationBonusClaimed: state.referralActivationBonusClaimed,

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
            expeditionBoostActiveUntil: payload.expeditionBoostActiveUntil,
            dailyExpeditionBoost: payload.dailyExpeditionBoost,
            expeditionStats: payload.expeditionStats,
            shopPurchases: payload.shopPurchases,
            animals: payload.animals,
            boxes: payload.boxes,
            expedition: payload.expedition,
            minigames: payload.minigames,
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
            referredBy: payload.referredBy,
            referralCode: payload.referralCode,
            referralsCount: payload.referralsCount,
            referrals: payload.referrals,
            referralHistory: payload.referralHistory,
            referralWelcomeBonusClaimed: payload.referralWelcomeBonusClaimed,
            referralActivated: payload.referralActivated,
            referralActivationBonusClaimed: payload.referralActivationBonusClaimed,
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

    isTransientNetworkError(error) {
        const message = String(error?.message || "").toLowerCase();

        return (
            message.includes("failed to fetch") ||
            message.includes("networkerror") ||
            message.includes("load failed") ||
            message.includes("the network connection was lost") ||
            message.includes("network request failed")
        );
    },

    wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async request(path, options = {}) {
        const retryCount = Math.max(0, Number(options.retryCount ?? 1));
        const retryDelayMs = Math.max(0, Number(options.retryDelayMs ?? 700));
        let lastError = null;

        for (let attempt = 0; attempt <= retryCount; attempt += 1) {
            const controller = new AbortController();
            const timeoutMs = Math.max(
                1000,
                Number(options.timeoutMs) || this.requestTimeoutMs
            );
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
                delete config.retryCount;
                delete config.retryDelayMs;

                const response = await fetch(`${this.getApiBase()}${path}`, config);

                if (!response.ok) {
                    let errorText = "";
                    try {
                        errorText = await response.text();
                    } catch (_) {
                        errorText = "";
                    }

                    throw new Error(
                        `HTTP ${response.status}${errorText ? ` - ${errorText}` : ""}`
                    );
                }

                const contentType = response.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    return response.json();
                }

                return null;
            } catch (error) {
                if (error?.name === "AbortError") {
                    lastError = new Error(`Request timeout after ${timeoutMs}ms: ${path}`);
                } else {
                    lastError = error;
                }

                const canRetry =
                    attempt < retryCount && this.isTransientNetworkError(lastError);

                if (!canRetry) {
                    throw lastError;
                }

                console.warn(`Retrying request after transient error: ${path}`, lastError);
                await this.wait(retryDelayMs);
            } finally {
                clearTimeout(timeoutId);
            }
        }

        throw lastError || new Error(`Unknown request failure: ${path}`);
    },

    unwrapPlayerResponse(data) {
        if (!data || typeof data !== "object") {
            return null;
        }

        if (data.player && typeof data.player === "object") {
            return data.player;
        }

        if (
            typeof data.coins === "number" ||
            typeof data.level === "number" ||
            Array.isArray(data.deposits) ||
            Array.isArray(data.depositHistory) ||
            typeof data.referralsCount === "number" ||
            typeof data.referralCode === "string"
        ) {
            return data;
        }

        return null;
    },

    async syncPlayerFromResponse(response, fallbackState = null) {
        const telegramUser = await this.getTelegramUser();

        if (this.testResetMode) {
            const current = this.normalizeState(
                CryptoZoo.state || fallbackState || this.getDefaultState(telegramUser)
            );
            current.telegramUser = telegramUser;
            current.updatedAt = Date.now();
            current.lastLogin = Date.now();

            CryptoZoo.state = current;
            this.writeLocalState(current, telegramUser.id);

            const payload = await this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
            this.pendingDirty = false;

            return response;
        }

        const playerPart = this.unwrapPlayerResponse(response);

        if (playerPart && typeof playerPart === "object") {
            CryptoZoo.state = this.mergeStates(
                playerPart,
                CryptoZoo.state || fallbackState || {}
            );
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramUser.id);

            const payload = await this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
            this.pendingDirty = false;
        }

        return response;
    },

    async ensurePlayerPersistedOnBackend() {
        if (this.testResetMode) {
            const telegramUser = await this.getTelegramUser();
            CryptoZoo.state = this.normalizeState(
                CryptoZoo.state ||
                    this.readLocalState(telegramUser.id) ||
                    this.getDefaultState(telegramUser)
            );
            CryptoZoo.state.telegramUser = telegramUser;
            CryptoZoo.state.updatedAt = Date.now();
            CryptoZoo.state.lastLogin = Date.now();
            this.writeLocalState(CryptoZoo.state, telegramUser.id);
            return CryptoZoo.state;
        }

        if (this.ensurePlayerPromise) {
            return this.ensurePlayerPromise;
        }

        this.ensurePlayerPromise = (async () => {
            const telegramUser = await this.getTelegramUser();
            const telegramId = String(telegramUser.id);
            const localRaw = this.readLocalState(telegramId);

            CryptoZoo.state = this.normalizeState(
                CryptoZoo.state || localRaw || this.getDefaultState(telegramUser)
            );
            CryptoZoo.state.telegramUser = telegramUser;
            CryptoZoo.state.updatedAt = Date.now();
            CryptoZoo.state.lastLogin = Date.now();

            this.writeLocalState(CryptoZoo.state, telegramId);

            const payload = await this.getSavePayload();
            const response = await this.request("/player/save", {
                method: "POST",
                body: JSON.stringify(payload),
                timeoutMs: 5000,
                retryCount: 1
            });

            const playerPart = this.unwrapPlayerResponse(response);

            if (playerPart && typeof playerPart === "object") {
                CryptoZoo.state = this.mergeStates(
                    playerPart,
                    CryptoZoo.state || payload
                );
            } else {
                CryptoZoo.state = this.normalizeState(CryptoZoo.state || payload);
            }

            CryptoZoo.state.telegramUser = telegramUser;
            CryptoZoo.state.updatedAt = Date.now();
            CryptoZoo.state.lastLogin = Date.now();

            this.writeLocalState(CryptoZoo.state, telegramId);

            const freshPayload = await this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(freshPayload);
            this.pendingDirty = false;

            return CryptoZoo.state;
        })();

        try {
            return await this.ensurePlayerPromise;
        } finally {
            this.ensurePlayerPromise = null;
        }
    },

    async loadPlayer() {
        const telegramUser = await this.getTelegramUser();
        const telegramId = String(telegramUser.id);
        const localRaw = this.readLocalState(telegramId);

        if (this.testResetMode) {
            if (localRaw) {
                CryptoZoo.state = this.normalizeState(localRaw);
            } else {
                CryptoZoo.state = this.normalizeState(this.getDefaultState(telegramUser));
            }

            CryptoZoo.state.telegramUser = telegramUser;
            CryptoZoo.state.updatedAt = Date.now();
            CryptoZoo.state.lastLogin = Date.now();

            this.writeLocalState(CryptoZoo.state, telegramId);

            try {
                const payload = await this.getSavePayload();
                this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
                this.pendingDirty = false;
            } catch (error) {
                console.warn("Snapshot init failed:", error);
            }

            return CryptoZoo.state;
        }

        let serverRaw = null;

        try {
            console.log("LOAD PLAYER ID:", telegramId);
            console.log("API BASE:", this.getApiBase());

            serverRaw = await this.request(`/player/${telegramId}`, {
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
            CryptoZoo.state = this.getDefaultState(telegramUser);
        }

        try {
            const referralResponse = await this.applyReferralIfNeeded();
            const referralPlayer = this.unwrapPlayerResponse(referralResponse);

            if (referralPlayer && typeof referralPlayer === "object") {
                CryptoZoo.state = this.mergeStates(referralPlayer, CryptoZoo.state || {});
            }
        } catch (error) {
            console.warn("Referral apply during loadPlayer failed:", error);
        }

        CryptoZoo.state.telegramUser = telegramUser;

        this.writeLocalState(CryptoZoo.state, telegramId);

        try {
            const payload = await this.getSavePayload();
            this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(payload);
            this.pendingDirty = false;
        } catch (error) {
            console.warn("Snapshot init failed:", error);
        }

        return CryptoZoo.state;
    },

    async markDirty() {
        const telegramUser = await this.getTelegramUser();

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.telegramUser = telegramUser;
        CryptoZoo.state.updatedAt = Date.now();
        CryptoZoo.state.lastLogin = Date.now();

        this.pendingDirty = true;
        this.writeLocalState(CryptoZoo.state, telegramUser.id);
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
        const telegramUser = await this.getTelegramUser();
        const payload = await this.getSavePayload();
        const nextSnapshot = this.getSaveFingerprintFromPayload(payload);

        this.writeLocalState(payload, telegramUser.id);

        if (!force && !this.pendingDirty && this.lastSavedSnapshot === nextSnapshot) {
            return CryptoZoo.state;
        }

        if (this.testResetMode) {
            CryptoZoo.state = this.normalizeState(CryptoZoo.state || payload);
            CryptoZoo.state.telegramUser = telegramUser;
            CryptoZoo.state.updatedAt = Date.now();
            CryptoZoo.state.lastLogin = Date.now();

            this.writeLocalState(CryptoZoo.state, telegramUser.id);

            this.lastSavedSnapshot = nextSnapshot;
            this.pendingDirty = false;

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
                    timeoutMs: 3500,
                    retryCount: 1
                });

                const safeResponse = this.unwrapPlayerResponse(response);

                if (safeResponse && typeof safeResponse === "object") {
                    CryptoZoo.state = this.mergeStates(
                        safeResponse,
                        CryptoZoo.state || payload
                    );
                    CryptoZoo.state.telegramUser = telegramUser;
                    this.writeLocalState(CryptoZoo.state, telegramUser.id);
                } else {
                    CryptoZoo.state = this.normalizeState(CryptoZoo.state || payload);
                    CryptoZoo.state.telegramUser = telegramUser;
                    this.writeLocalState(CryptoZoo.state, telegramUser.id);
                }

                this.lastSavedSnapshot = this.getSaveFingerprintFromPayload(
                    await this.getSavePayload()
                );
                this.pendingDirty = false;
            } catch (error) {
                console.warn("SAVE FAIL → local only", error);

                CryptoZoo.state = this.normalizeState(CryptoZoo.state || payload);
                CryptoZoo.state.telegramUser = telegramUser;
                this.writeLocalState(CryptoZoo.state, telegramUser.id);

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
        await this.markDirty();
        return CryptoZoo.state;
    },

    async expeditionStart(expeditionId) {
        const response = await this.request("/expedition/start", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                expeditionId
            }),
            timeoutMs: 4000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async expeditionCollect() {
        const response = await this.request("/expedition/collect", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername()
            }),
            timeoutMs: 5000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async expeditionUseTimeReduction(seconds = 0) {
        const response = await this.request("/expedition/use-time-reduction", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                seconds: Math.max(0, Number(seconds) || 0)
            }),
            timeoutMs: 4000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async createDepositWithPayment(amount) {
        await this.ensurePlayerPersistedOnBackend();

        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

        if (safeAmount <= 0) {
            throw new Error("Invalid deposit amount");
        }

        const response = await this.request("/deposit/create", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                amount: safeAmount,
                source: "ton"
            }),
            timeoutMs: 5000,
            retryCount: 1
        });

        const createdDeposit = this.normalizeDepositItem(response?.deposit || {});
        const currentState = this.normalizeState(CryptoZoo.state || {});

        if (createdDeposit.id) {
            currentState.deposits = this.mergeDeposits(
                [createdDeposit],
                currentState.deposits
            );

            const historyEntry = {
                ...createdDeposit,
                depositId: createdDeposit.depositId || createdDeposit.id
            };

            currentState.depositHistory = this.mergeDeposits(
                [historyEntry],
                currentState.depositHistory
            );

            currentState.updatedAt = Date.now();
            CryptoZoo.state = this.normalizeState(currentState);

            const telegramUser = await this.getTelegramUser();
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramUser.id);
        }

        return response;
    },

    async verifyDepositById(depositId) {
        const safeDepositId = String(depositId || "").trim();

        if (!safeDepositId) {
            throw new Error("Missing depositId");
        }

        const response = await this.request("/deposit/verify", {
            method: "POST",
            body: JSON.stringify({
                depositId: safeDepositId
            }),
            timeoutMs: 12000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async verifyPendingDepositsForPlayer() {
        await this.ensurePlayerPersistedOnBackend();

        const response = await this.request("/deposit/verify-player", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId()
            }),
            timeoutMs: 12000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async getPlayerDeposits() {
        await this.ensurePlayerPersistedOnBackend();

        return this.request(`/deposit/${await this.getPlayerId()}`, {
            method: "GET",
            timeoutMs: 5000,
            retryCount: 1
        });
    },

    async loadDepositsHistory() {
        const response = await this.getPlayerDeposits();
        const deposits = this.normalizeDepositsList(response?.deposits);

        if (deposits.length) {
            const currentState = this.normalizeState(CryptoZoo.state || {});
            currentState.deposits = this.mergeDeposits(
                deposits,
                currentState.deposits
            );
            currentState.depositHistory = this.mergeDeposits(
                deposits,
                currentState.depositHistory
            );
            currentState.updatedAt = Date.now();
            CryptoZoo.state = this.normalizeState(currentState);

            const telegramUser = await this.getTelegramUser();
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramUser.id);
        }

        return deposits;
    },

    async setWithdrawWallet(tonAddress) {
        await this.ensurePlayerPersistedOnBackend();

        const safeAddress = String(tonAddress || "").trim();

        if (!safeAddress) {
            throw new Error("Missing TON wallet address");
        }

        const response = await this.request("/withdraw/set-wallet", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                tonAddress: safeAddress
            }),
            timeoutMs: 5000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async getWithdrawWallet() {
        await this.ensurePlayerPersistedOnBackend();

        return this.request(`/withdraw/wallet/${await this.getPlayerId()}`, {
            method: "GET",
            timeoutMs: 5000,
            retryCount: 1
        });
    },

    async createWithdrawRequest(amount) {
        await this.ensurePlayerPersistedOnBackend();

        const safeAmount = Number((Math.max(0, Number(amount) || 0)).toFixed(3));

        if (safeAmount <= 0) {
            throw new Error("Invalid withdraw amount");
        }

        const response = await this.request("/withdraw/request", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername(),
                amount: safeAmount
            }),
            timeoutMs: 8000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async loadWithdrawHistory() {
        await this.ensurePlayerPersistedOnBackend();

        const response = await this.request(`/withdraw/${await this.getPlayerId()}`, {
            method: "GET",
            timeoutMs: 5000,
            retryCount: 1
        });

        return Array.isArray(response?.requests) ? response.requests : [];
    },

    async transferRewardToWallet() {
        await this.ensurePlayerPersistedOnBackend();

        const response = await this.request("/reward/transfer-to-wallet", {
            method: "POST",
            body: JSON.stringify({
                telegramId: await this.getPlayerId(),
                username: await this.getUsername()
            }),
            timeoutMs: 5000,
            retryCount: 1
        });

        return this.syncPlayerFromResponse(response);
    },

    async syncPendingDeposits(forceReload = false) {
        if (this.testResetMode) {
            const telegramUser = await this.getTelegramUser();
            return this.normalizeState(
                CryptoZoo.state || this.readLocalState(telegramUser.id) || this.getDefaultState(telegramUser)
            );
        }

        try {
            await this.ensurePlayerPersistedOnBackend();

            const response = await this.request("/deposit/verify-player", {
                method: "POST",
                body: JSON.stringify({
                    telegramId: await this.getPlayerId()
                }),
                timeoutMs: 3000,
                retryCount: 1
            });

            const playerPart = this.unwrapPlayerResponse(response);
            if (playerPart && typeof playerPart === "object") {
                await this.syncPlayerFromResponse(response);
            }

            const depositsResponse = await this.getPlayerDeposits();
            const deposits = this.normalizeDepositsList(depositsResponse?.deposits);

            const currentState = this.normalizeState(CryptoZoo.state || {});
            currentState.deposits = this.mergeDeposits(
                deposits,
                currentState.deposits
            );
            currentState.depositHistory = this.mergeDeposits(
                deposits,
                currentState.depositHistory
            );

            CryptoZoo.state = this.normalizeState(currentState);

            const telegramUser = await this.getTelegramUser();
            CryptoZoo.state.telegramUser = telegramUser;
            this.writeLocalState(CryptoZoo.state, telegramUser.id);

            if (forceReload) {
                await this.loadPlayer();
            }

            return CryptoZoo.state;
        } catch (error) {
            console.warn("Deposit sync failed", error);

            const telegramUser = await this.getTelegramUser();
            return this.normalizeState(
                CryptoZoo.state || this.readLocalState(telegramUser.id) || this.getDefaultState(telegramUser)
            );
        }
    }
};