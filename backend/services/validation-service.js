const { LIMITS } = require("../config/game-config");
const { clamp } = require("../utils/helpers");
const { normalizePlayer } = require("./player-service");

function normalizeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function uniqueMergeArrays(primary, fallback) {
    const result = [];
    const seen = new Set();

    [...normalizeArray(fallback), ...normalizeArray(primary)].forEach((item, index) => {
        let key;

        if (item && typeof item === "object") {
            key =
                item.id ||
                item._id ||
                item.txId ||
                item.txHash ||
                item.hash ||
                item.paymentId ||
                item.depositId ||
                item.createdAt ||
                item.timestamp ||
                `obj-${index}-${JSON.stringify(item)}`;
        } else {
            key = `primitive-${index}-${String(item)}`;
        }

        key = String(key);

        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    });

    return result;
}

function sanitizeRewardState(oldPlayer, newPlayer) {
    const safePlayer = normalizePlayer(newPlayer);

    if (!oldPlayer) {
        return safePlayer;
    }

    const oldSafe = normalizePlayer(oldPlayer);

    safePlayer.withdrawPending = Math.max(
        0,
        Number(oldSafe.withdrawPending || 0),
        Number(safePlayer.withdrawPending || 0)
    );

    return safePlayer;
}

function validateProgress(oldPlayer, newPlayer) {
    if (!oldPlayer) {
        newPlayer.coins = clamp(Number(newPlayer.coins || 0), 0, LIMITS.MAX_COINS);
        newPlayer.gems = clamp(Number(newPlayer.gems || 0), 0, LIMITS.MAX_GEMS);
        newPlayer.level = clamp(Number(newPlayer.level || 1), 1, LIMITS.MAX_LEVEL);
        newPlayer.xp = clamp(Number(newPlayer.xp || 0), 0, LIMITS.MAX_XP);
        return newPlayer;
    }

    const oldSafe = normalizePlayer(oldPlayer);

    const coinsDiff = Number(newPlayer.coins || 0) - Number(oldSafe.coins || 0);
    const gemsDiff = Number(newPlayer.gems || 0) - Number(oldSafe.gems || 0);
    const levelDiff = Number(newPlayer.level || 1) - Number(oldSafe.level || 1);
    const xpDiff = Number(newPlayer.xp || 0) - Number(oldSafe.xp || 0);

    const maxCoinsGain = Math.max(
        Number(LIMITS.MAX_COINS_GAIN_PER_SAVE) || 0,
        1000000000
    );

    const maxGemsGain = Math.max(
        Number(LIMITS.MAX_GEMS_GAIN_PER_SAVE) || 0,
        10000
    );

    const maxLevelGain = Math.max(
        Number(LIMITS.MAX_LEVEL_GAIN_PER_SAVE) || 0,
        100
    );

    const maxXpGain = Math.max(
        Number(LIMITS.MAX_XP_GAIN_PER_SAVE) || 0,
        1000000000
    );

    if (coinsDiff > maxCoinsGain) {
        newPlayer.coins = oldSafe.coins;
    }

    if (gemsDiff > maxGemsGain) {
        newPlayer.gems = oldSafe.gems;
    }

    if (levelDiff > maxLevelGain) {
        newPlayer.level = oldSafe.level;
    }

    if (xpDiff > maxXpGain) {
        newPlayer.xp = oldSafe.xp;
    }

    newPlayer.coins = clamp(Number(newPlayer.coins || 0), 0, LIMITS.MAX_COINS);
    newPlayer.gems = clamp(Number(newPlayer.gems || 0), 0, LIMITS.MAX_GEMS);
    newPlayer.level = clamp(Number(newPlayer.level || 1), 1, LIMITS.MAX_LEVEL);
    newPlayer.xp = clamp(Number(newPlayer.xp || 0), 0, LIMITS.MAX_XP);

    return newPlayer;
}

function buildSafePlayerState(oldPlayer, incomingRaw, normalizeTelegramUser) {
    const oldSafe = oldPlayer ? normalizePlayer(oldPlayer) : null;
    const incoming = normalizePlayer(incomingRaw);
    const incomingObj = normalizeObject(incomingRaw);
    const hasIncomingExpeditionField = Object.prototype.hasOwnProperty.call(incomingObj, "expedition");

    const resolvedLastLogin = Math.max(
        0,
        Number(incoming.lastLogin || 0) || Number(oldSafe?.lastLogin || 0) || 0
    );

    const merged = {
        ...(oldSafe || {}),
        ...incoming,

        telegramUser: normalizeTelegramUser
            ? normalizeTelegramUser(
                  {
                      ...normalizeObject(oldSafe?.telegramUser),
                      ...normalizeObject(incoming.telegramUser)
                  },
                  incoming.telegramId || oldSafe?.telegramId,
                  incoming.username || oldSafe?.username
              )
            : {
                  ...normalizeObject(oldSafe?.telegramUser),
                  ...normalizeObject(incoming.telegramUser)
              },

        // NEVER ROLLBACK CORE PROGRESS
        coins: Math.max(
            Number(oldSafe?.coins || 0),
            Number(incoming.coins || 0)
        ),
        gems: Math.max(
            Number(oldSafe?.gems || 0),
            Number(incoming.gems || 0)
        ),
        rewardBalance: Math.max(
            Number(oldSafe?.rewardBalance || 0),
            Number(incoming.rewardBalance || 0)
        ),
        rewardWallet: Math.max(
            Number(oldSafe?.rewardWallet || 0),
            Number(incoming.rewardWallet || 0)
        ),
        withdrawPending: Math.max(
            Number(oldSafe?.withdrawPending || 0),
            Number(incoming.withdrawPending || 0)
        ),
        level: Math.max(
            Number(oldSafe?.level || 1),
            Number(incoming.level || 1)
        ),
        xp: Math.max(
            Number(oldSafe?.xp || 0),
            Number(incoming.xp || 0)
        ),
        coinsPerClick: Math.max(
            Number(oldSafe?.coinsPerClick || 1),
            Number(incoming.coinsPerClick || 1)
        ),
        upgradeCost: Math.max(
            Number(oldSafe?.upgradeCost || 0),
            Number(incoming.upgradeCost || 0)
        ),
        zooIncome: Math.max(
            Number(oldSafe?.zooIncome || 0),
            Number(incoming.zooIncome || 0)
        ),
        expeditionBoost: Math.max(
            Number(oldSafe?.expeditionBoost || 0),
            Number(incoming.expeditionBoost || 0)
        ),

        dailyExpeditionBoost: {
            activeUntil: Math.max(
                Number(oldSafe?.dailyExpeditionBoost?.activeUntil || 0),
                Number(incoming.dailyExpeditionBoost?.activeUntil || 0)
            ),
            lastPurchaseAt: Math.max(
                Number(oldSafe?.dailyExpeditionBoost?.lastPurchaseAt || 0),
                Number(incoming.dailyExpeditionBoost?.lastPurchaseAt || 0)
            )
        },

        expeditionStats: {
            rareChanceBonus: Math.max(
                Number(oldSafe?.expeditionStats?.rareChanceBonus || 0),
                Number(incoming.expeditionStats?.rareChanceBonus || 0)
            ),
            epicChanceBonus: Math.max(
                Number(oldSafe?.expeditionStats?.epicChanceBonus || 0),
                Number(incoming.expeditionStats?.epicChanceBonus || 0)
            ),
            timeReductionSeconds: Math.max(
                Number(oldSafe?.expeditionStats?.timeReductionSeconds || 0),
                Number(incoming.expeditionStats?.timeReductionSeconds || 0)
            ),
            timeBoostCharges: uniqueMergeArrays(
                incoming.expeditionStats?.timeBoostCharges,
                oldSafe?.expeditionStats?.timeBoostCharges
            )
        },

        shopPurchases: {
            ...normalizeObject(oldSafe?.shopPurchases),
            ...normalizeObject(incoming.shopPurchases)
        },

        animals: {
            ...normalizeObject(oldSafe?.animals),
            ...normalizeObject(incoming.animals)
        },

        boxes: {
            common: Math.max(
                Number(oldSafe?.boxes?.common || 0),
                Number(incoming.boxes?.common || 0)
            ),
            rare: Math.max(
                Number(oldSafe?.boxes?.rare || 0),
                Number(incoming.boxes?.rare || 0)
            ),
            epic: Math.max(
                Number(oldSafe?.boxes?.epic || 0),
                Number(incoming.boxes?.epic || 0)
            ),
            legendary: Math.max(
                Number(oldSafe?.boxes?.legendary || 0),
                Number(incoming.boxes?.legendary || 0)
            )
        },

        missions: {
            ...normalizeObject(oldSafe?.missions),
            ...normalizeObject(incoming.missions)
        },

        dailyMissions: {
            ...normalizeObject(oldSafe?.dailyMissions),
            ...normalizeObject(incoming.dailyMissions)
        },

        boosts: {
            ...normalizeObject(oldSafe?.boosts),
            ...normalizeObject(incoming.boosts)
        },

        settings: {
            ...normalizeObject(oldSafe?.settings),
            ...normalizeObject(incoming.settings)
        },

        profile: {
            ...normalizeObject(oldSafe?.profile),
            ...normalizeObject(incoming.profile)
        },

        stats: {
            ...normalizeObject(oldSafe?.stats),
            ...normalizeObject(incoming.stats)
        },

        expedition: hasIncomingExpeditionField
            ? (incomingObj.expedition ?? null)
            : (oldSafe?.expedition ?? null),

        offlineBaseHours: Math.max(
            Number(oldSafe?.offlineBaseHours || 1),
            Number(incoming.offlineBaseHours || 1)
        ),
        offlineBoostHours: Math.max(
            Number(oldSafe?.offlineBoostHours || 0),
            Number(incoming.offlineBoostHours || 0)
        ),
        offlineAdsHours: Math.max(
            Number(oldSafe?.offlineAdsHours || 0),
            Number(incoming.offlineAdsHours || 0)
        ),
        offlineMaxSeconds: Math.max(
            Number(oldSafe?.offlineMaxSeconds || 3600),
            Number(incoming.offlineMaxSeconds || 3600)
        ),
        offlineBoostMultiplier: Math.max(
            Number(oldSafe?.offlineBoostMultiplier || 1),
            Number(incoming.offlineBoostMultiplier || 1)
        ),
        offlineBoostActiveUntil: Math.max(
            Number(oldSafe?.offlineBoostActiveUntil || 0),
            Number(incoming.offlineBoostActiveUntil || 0)
        ),
        offlineBoost: Math.max(
            Number(oldSafe?.offlineBoost || 1),
            Number(incoming.offlineBoost || 1)
        ),

        depositHistory: uniqueMergeArrays(
            incoming.depositHistory || incoming.depositsHistory || incoming.paymentHistory,
            oldSafe?.depositHistory || oldSafe?.depositsHistory || oldSafe?.paymentHistory
        ),

        deposits: uniqueMergeArrays(incoming.deposits, oldSafe?.deposits),
        transactions: uniqueMergeArrays(incoming.transactions, oldSafe?.transactions),
        withdrawHistory: uniqueMergeArrays(incoming.withdrawHistory, oldSafe?.withdrawHistory),
        payoutHistory: uniqueMergeArrays(incoming.payoutHistory, oldSafe?.payoutHistory),
        referrals: uniqueMergeArrays(incoming.referrals, oldSafe?.referrals),
        referralHistory: uniqueMergeArrays(
            incoming.referralHistory,
            oldSafe?.referralHistory
        ),

        updatedAt: Math.max(
            Number(oldSafe?.updatedAt || 0),
            Number(incoming.updatedAt || 0),
            Date.now()
        ),

        lastLogin: resolvedLastLogin
    };

    const safe1 = sanitizeRewardState(oldSafe, merged);
    const safe2 = validateProgress(oldSafe, safe1);

    return normalizePlayer(safe2);
}

module.exports = {
    sanitizeRewardState,
    validateProgress,
    buildSafePlayerState
};