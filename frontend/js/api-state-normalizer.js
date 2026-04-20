window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
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
            shopItemCharges: {},
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

            offlineBaseHours: 0,
            offlineBoostHours: 0,
            offlineAdsHours: 0,
            offlineAdsResetAt: 0,
            offlineAdsEnabled: false,
            offlineMaxSeconds: 0,
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
            0
        );

        const offlineBoostHours = Math.max(
            0,
            Math.floor(this.normalizeNumber(data.offlineBoostHours, base.offlineBoostHours, 0))
        );

        const offlineAdsHours = Math.max(
            0,
            this.normalizeNumber(data.offlineAdsHours, base.offlineAdsHours, 0)
        );

        const offlineAdsResetAt = this.normalizeNumber(
            data.offlineAdsResetAt,
            base.offlineAdsResetAt,
            0
        );

        const offlineAdsEnabled =
            offlineAdsHours > 0 && offlineAdsResetAt > Date.now();

        const offlineMaxSeconds = Math.max(
            0,
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
            offlineAdsEnabled,
            offlineAdsResetAt,
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
    }
});