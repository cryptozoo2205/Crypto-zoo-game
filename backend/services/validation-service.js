const { LIMITS, EXPEDITIONS_CONFIG } = require("../config/game-config");
const { clamp, normalizeRewardNumber, safeString } = require("../utils/helpers");
const { getDefaultPlayer, normalizePlayer, normalizeExpedition } = require("./player-service");

function sanitizeRewardState(oldPlayer, newPlayer) {
    const safePlayer = normalizePlayer(newPlayer);

    if (!oldPlayer) {
        return safePlayer;
    }

    const oldSafe = normalizePlayer(oldPlayer);

    safePlayer.withdrawPending = oldSafe.withdrawPending;

    const rewardBalanceDiff = safePlayer.rewardBalance - oldSafe.rewardBalance;
    const rewardWalletDiff = safePlayer.rewardWallet - oldSafe.rewardWallet;

    const oldTotalReward =
        oldSafe.rewardBalance +
        oldSafe.rewardWallet +
        oldSafe.withdrawPending;

    const newTotalReward =
        safePlayer.rewardBalance +
        safePlayer.rewardWallet +
        safePlayer.withdrawPending;

    const totalRewardDiff = newTotalReward - oldTotalReward;

    if (rewardBalanceDiff > LIMITS.MAX_REWARD_BALANCE_GAIN_PER_SAVE) {
        safePlayer.rewardBalance = oldSafe.rewardBalance;
    }

    if (rewardWalletDiff > LIMITS.MAX_REWARD_WALLET_GAIN_PER_SAVE) {
        safePlayer.rewardWallet = oldSafe.rewardWallet;
    }

    if (totalRewardDiff > LIMITS.MAX_REWARD_TOTAL_GAIN_PER_SAVE) {
        safePlayer.rewardBalance = oldSafe.rewardBalance;
        safePlayer.rewardWallet = oldSafe.rewardWallet;
        safePlayer.withdrawPending = oldSafe.withdrawPending;
    }

    safePlayer.rewardBalance = clamp(
        normalizeRewardNumber(safePlayer.rewardBalance, oldSafe.rewardBalance),
        0,
        LIMITS.MAX_REWARD_BALANCE
    );

    safePlayer.rewardWallet = clamp(
        normalizeRewardNumber(safePlayer.rewardWallet, oldSafe.rewardWallet),
        0,
        LIMITS.MAX_REWARD_WALLET
    );

    safePlayer.withdrawPending = clamp(
        normalizeRewardNumber(oldSafe.withdrawPending, oldSafe.withdrawPending),
        0,
        LIMITS.MAX_WITHDRAW_PENDING
    );

    return safePlayer;
}

function validateExpeditionIntegrity(oldPlayer, newPlayer) {
    const oldExpedition = oldPlayer?.expedition ? normalizeExpedition(oldPlayer.expedition) : null;
    const newExpedition = newPlayer?.expedition ? normalizeExpedition(newPlayer.expedition) : null;

    if (!oldExpedition && !newExpedition) {
        return newPlayer;
    }

    if (!oldExpedition && newExpedition) {
        const allowed = EXPEDITIONS_CONFIG[newExpedition.id];
        if (!allowed) {
            newPlayer.expedition = null;
            return newPlayer;
        }

        const expectedCost = Math.max(0, Number(allowed.startCostCoins) || 0);
        const actualCost = Math.max(0, Number(newExpedition.startCostCoins) || 0);

        if (actualCost !== expectedCost) {
            newPlayer.expedition = null;
            return newPlayer;
        }

        return newPlayer;
    }

    if (oldExpedition && newExpedition) {
        if (oldExpedition.id !== newExpedition.id) {
            newPlayer.expedition = oldExpedition;
            return newPlayer;
        }

        if (newExpedition.startTime !== oldExpedition.startTime) {
            newPlayer.expedition = oldExpedition;
            return newPlayer;
        }

        return newPlayer;
    }

    return newPlayer;
}

function validateProgress(oldPlayer, newPlayer) {
    if (!oldPlayer) return newPlayer;

    const oldSafe = normalizePlayer(oldPlayer);

    const coinsDiff = newPlayer.coins - oldSafe.coins;
    const gemsDiff = newPlayer.gems - oldSafe.gems;
    const levelDiff = newPlayer.level - oldSafe.level;

    if (coinsDiff > LIMITS.MAX_COINS_GAIN_PER_SAVE) {
        newPlayer.coins = oldSafe.coins;
    }

    if (gemsDiff > LIMITS.MAX_GEMS_GAIN_PER_SAVE) {
        newPlayer.gems = oldSafe.gems;
    }

    if (levelDiff > LIMITS.MAX_LEVEL_GAIN_PER_SAVE) {
        newPlayer.level = oldSafe.level;
    }

    if (newPlayer.coins < 0) {
        newPlayer.coins = oldSafe.coins;
    }

    if (newPlayer.gems < 0) {
        newPlayer.gems = oldSafe.gems;
    }

    if (newPlayer.level < oldSafe.level) {
        newPlayer.level = oldSafe.level;
    }

    if (newPlayer.xp < oldSafe.xp && oldSafe.xp - newPlayer.xp > 5000) {
        newPlayer.xp = oldSafe.xp;
    }

    newPlayer.coins = clamp(newPlayer.coins, 0, LIMITS.MAX_COINS);
    newPlayer.gems = clamp(newPlayer.gems, 0, LIMITS.MAX_GEMS);
    newPlayer.level = clamp(newPlayer.level, 1, LIMITS.MAX_LEVEL);
    newPlayer.xp = clamp(newPlayer.xp, 0, LIMITS.MAX_XP);

    newPlayer = validateExpeditionIntegrity(oldSafe, newPlayer);

    return newPlayer;
}

function buildSafePlayerState(oldPlayer, incomingRaw, normalizeTelegramUser) {
    const basePlayer = oldPlayer
        ? normalizePlayer(oldPlayer)
        : getDefaultPlayer(
            safeString(incomingRaw?.telegramId, "local-player"),
            safeString(incomingRaw?.username, "Gracz")
        );

    const incomingTelegramId = safeString(
        incomingRaw?.telegramId,
        basePlayer.telegramId || "local-player"
    );
    const incomingUsername = safeString(
        incomingRaw?.username,
        basePlayer.username || "Gracz"
    );

    const incoming = normalizePlayer({
        ...incomingRaw,
        telegramId: incomingTelegramId,
        username: incomingUsername,
        telegramUser: normalizeTelegramUser(
            incomingRaw?.telegramUser,
            incomingTelegramId,
            incomingUsername
        ),
        referredBy: basePlayer.referredBy || incomingRaw?.referredBy || "",
        referralCode: basePlayer.referralCode || incomingTelegramId,
        referralWelcomeBonusClaimed: !!basePlayer.referralWelcomeBonusClaimed,
        referralActivated: !!basePlayer.referralActivated,
        referralActivationBonusClaimed: !!basePlayer.referralActivationBonusClaimed
    });

    let safe = normalizePlayer({
        ...basePlayer,

        coins: incoming.coins,
        gems: incoming.gems,
        rewardBalance: incoming.rewardBalance,
        rewardWallet: incoming.rewardWallet,
        level: incoming.level,
        xp: incoming.xp,
        coinsPerClick: incoming.coinsPerClick,
        upgradeCost: incoming.upgradeCost,
        zooIncome: incoming.zooIncome,
        expeditionBoost: incoming.expeditionBoost,

        offlineMaxSeconds: incoming.offlineMaxSeconds,
        offlineBoostMultiplier: incoming.offlineBoostMultiplier,
        offlineBoostActiveUntil: incoming.offlineBoostActiveUntil,
        offlineBoost: incoming.offlineBoost,

        lastLogin: incoming.lastLogin,
        lastDailyRewardAt: incoming.lastDailyRewardAt,
        dailyRewardStreak: incoming.dailyRewardStreak,
        dailyRewardClaimDayKey: incoming.dailyRewardClaimDayKey,
        boost2xActiveUntil: incoming.boost2xActiveUntil,
        playTimeSeconds: incoming.playTimeSeconds,
        lastAwardedLevel: incoming.lastAwardedLevel,

        animals: incoming.animals,
        boxes: incoming.boxes,
        expedition: incoming.expedition,
        minigames: incoming.minigames,
        shopPurchases: incoming.shopPurchases,
        expeditionStats: incoming.expeditionStats,
        dailyMissions: incoming.dailyMissions,

        telegramId: incoming.telegramId,
        username: incoming.username,
        telegramUser: incoming.telegramUser,

        referredBy: basePlayer.referredBy || incoming.referredBy || "",
        referralCode: basePlayer.referralCode || incomingTelegramId,
        referralWelcomeBonusClaimed: !!basePlayer.referralWelcomeBonusClaimed,
        referralActivated: !!basePlayer.referralActivated,
        referralActivationBonusClaimed: !!basePlayer.referralActivationBonusClaimed,
        referralsCount: basePlayer.referralsCount,
        referrals: basePlayer.referrals,
        withdrawPending: basePlayer.withdrawPending
    });

    safe = sanitizeRewardState(basePlayer, safe);
    safe = validateProgress(basePlayer, safe);

    return normalizePlayer(safe);
}

module.exports = {
    sanitizeRewardState,
    validateExpeditionIntegrity,
    validateProgress,
    buildSafePlayerState
};