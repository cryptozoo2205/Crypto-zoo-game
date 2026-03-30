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

    safePlayer.withdrawPending = oldSafe.withdrawPending;

    return safePlayer;
}

function validateProgress(oldPlayer, newPlayer) {
    if (!oldPlayer) {
        newPlayer.coins = clamp(newPlayer.coins, 0, LIMITS.MAX_COINS);
        newPlayer.gems = clamp(newPlayer.gems, 0, LIMITS.MAX_GEMS);
        newPlayer.level = clamp(newPlayer.level, 1, LIMITS.MAX_LEVEL);
        return newPlayer;
    }

    const oldSafe = normalizePlayer(oldPlayer);

    const coinsDiff = Number(newPlayer.coins || 0) - Number(oldSafe.coins || 0);
    const gemsDiff = Number(newPlayer.gems || 0) - Number(oldSafe.gems || 0);
    const levelDiff = Number(newPlayer.level || 1) - Number(oldSafe.level || 1);

    if (coinsDiff > LIMITS.MAX_COINS_GAIN_PER_SAVE) {
        newPlayer.coins = oldSafe.coins;
    }

    if (gemsDiff > LIMITS.MAX_GEMS_GAIN_PER_SAVE) {
        newPlayer.gems = oldSafe.gems;
    }

    if (levelDiff > LIMITS.MAX_LEVEL_GAIN_PER_SAVE) {
        newPlayer.level = oldSafe.level;
    }

    newPlayer.coins = clamp(Number(newPlayer.coins || 0), 0, LIMITS.MAX_COINS);
    newPlayer.gems = clamp(Number(newPlayer.gems || 0), 0, LIMITS.MAX_GEMS);
    newPlayer.level = clamp(Number(newPlayer.level || 1), 1, LIMITS.MAX_LEVEL);

    return newPlayer;
}

function buildSafePlayerState(oldPlayer, incomingRaw, normalizeTelegramUser) {
    const oldSafe = oldPlayer ? normalizePlayer(oldPlayer) : null;
    const incoming = normalizePlayer(incomingRaw);
    const incomingObj = normalizeObject(incomingRaw);
    const hasIncomingExpeditionField = Object.prototype.hasOwnProperty.call(incomingObj, "expedition");

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

        dailyExpeditionBoost: {
            ...normalizeObject(oldSafe?.dailyExpeditionBoost),
            ...normalizeObject(incoming.dailyExpeditionBoost)
        },

        expeditionStats: {
            ...normalizeObject(oldSafe?.expeditionStats),
            ...normalizeObject(incoming.expeditionStats),
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
            ...normalizeObject(oldSafe?.boxes),
            ...normalizeObject(incoming.boxes)
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

        lastLogin: Math.max(
            Number(oldSafe?.lastLogin || 0),
            Number(incoming.lastLogin || 0),
            Date.now()
        )
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