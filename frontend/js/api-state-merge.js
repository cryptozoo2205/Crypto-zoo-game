window.CryptoZoo = window.CryptoZoo || {};
window.CryptoZoo.api = window.CryptoZoo.api || {};

Object.assign(window.CryptoZoo.api, {
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

        const serverOfflineAdsResetAt = Math.max(
            0,
            Number(server.offlineAdsResetAt || 0)
        );

        const localOfflineAdsResetAt = Math.max(
            0,
            Number(local.offlineAdsResetAt || 0)
        );

        const useServerOfflineAds =
            serverOfflineAdsResetAt >= localOfflineAdsResetAt;

        const mergedOfflineAdsHours = useServerOfflineAds
            ? Math.max(0, Number(server.offlineAdsHours || 0))
            : Math.max(0, Number(local.offlineAdsHours || 0));

        const mergedOfflineAdsResetAt = useServerOfflineAds
            ? serverOfflineAdsResetAt
            : localOfflineAdsResetAt;

        const mergedOfflineAdsEnabled =
            mergedOfflineAdsResetAt > Date.now() && mergedOfflineAdsHours > 0;

        const mergedOfflineBaseHours = Math.max(
            Number(server.offlineBaseHours || 0),
            Number(local.offlineBaseHours || 0)
        );

        const mergedOfflineBoostHours = Math.max(
            Number(server.offlineBoostHours || 0),
            Number(local.offlineBoostHours || 0)
        );

        const mergedOfflineMaxSeconds = Math.max(
            Number(server.offlineMaxSeconds || 0),
            Number(local.offlineMaxSeconds || 0),
            (mergedOfflineBaseHours + mergedOfflineBoostHours + mergedOfflineAdsHours) * 3600
        );

        return this.normalizeState({
            ...server,
            ...local,

            telegramUser: {
                ...server.telegramUser,
                ...local.telegramUser
            },

            coins: Math.max(server.coins, local.coins),
            gems: Number(local.gems ?? server.gems ?? 0),

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

            shopItemCharges: {
                ...server.shopItemCharges,
                ...local.shopItemCharges
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

            offlineBaseHours: mergedOfflineBaseHours,
            offlineBoostHours: mergedOfflineBoostHours,
            offlineAdsHours: mergedOfflineAdsHours,
            offlineAdsResetAt: mergedOfflineAdsResetAt,
            offlineAdsEnabled: mergedOfflineAdsEnabled,
            offlineMaxSeconds: mergedOfflineMaxSeconds,
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
            deposits: this.mergeDeposits(
                local.deposits,
                server.deposits
            ),
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
            referrals: this.mergeUniqueByKey(
                local.referrals,
                server.referrals
            ),
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
    }
});