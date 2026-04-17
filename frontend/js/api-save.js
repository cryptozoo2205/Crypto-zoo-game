window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
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

    async getSavePayload() {
        const telegramUser = await this.getTelegramUser();
        const state = this.normalizeState(CryptoZoo.state || {});

        state.telegramUser = telegramUser;
        state.updatedAt = Date.now();

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

    async markDirty() {
        const telegramUser = await this.getTelegramUser();

        CryptoZoo.state = CryptoZoo.state || {};
        CryptoZoo.state.telegramUser = telegramUser;
        CryptoZoo.state.updatedAt = Date.now();

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
    }
});