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

    const coinsDiff = newPlayer.coins - oldPlayer.coins;
    const gemsDiff = newPlayer.gems - oldPlayer.gems;
    const levelDiff = newPlayer.level - oldPlayer.level;

    if (coinsDiff > LIMITS.MAX_COINS_GAIN_PER_SAVE) {
        newPlayer.coins = oldPlayer.coins;
    }

    if (gemsDiff > LIMITS.MAX_GEMS_GAIN_PER_SAVE) {
        newPlayer.gems = oldPlayer.gems;
    }

    if (levelDiff > LIMITS.MAX_LEVEL_GAIN_PER_SAVE) {
        newPlayer.level = oldPlayer.level;
    }

    if (newPlayer.xp < oldPlayer.xp && oldPlayer.xp - newPlayer.xp > 5000) {
        newPlayer.xp = oldPlayer.xp;
    }

    newPlayer = validateExpeditionIntegrity(oldPlayer, newPlayer);

    return newPlayer;
}

function buildSafePlayerState(oldPlayer, incomingRaw, normalizeTelegramUser) {
    const incomingTelegramId = safeString(
        incomingRaw?.telegramId,
        oldPlayer?.telegramId || "local-player"
    );
    const incomingUsername = safeString(
        incomingRaw?.username,
        oldPlayer?.username || "Gracz"
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
        referredBy: oldPlayer?.referredBy || incomingRaw?.referredBy || "",
        referralCode: oldPlayer?.referralCode || incomingTelegramId,
        referralWelcomeBonusClaimed: !!oldPlayer?.referralWelcomeBonusClaimed,
        referralActivated: !!oldPlayer?.referralActivated,
        referralActivationBonusClaimed: !!oldPlayer?.referralActivationBonusClaimed
    });

    let safe = normalizePlayer({
        ...(oldPlayer || getDefaultPlayer(incoming.telegramId, incoming.username)),
        ...incoming,
        telegramId: incoming.telegramId,
        username: incoming.username,
        telegramUser: incoming.telegramUser,
        referredBy: oldPlayer?.referredBy || incoming.referredBy || "",
        referralCode: oldPlayer?.referralCode || incomingTelegramId,
        referralWelcomeBonusClaimed: !!oldPlayer?.referralWelcomeBonusClaimed,
        referralActivated: !!oldPlayer?.referralActivated,
        referralActivationBonusClaimed: !!oldPlayer?.referralActivationBonusClaimed
    });

    safe = sanitizeRewardState(oldPlayer, safe);
    safe = validateProgress(oldPlayer, safe);

    return normalizePlayer(safe);
}

module.exports = {
    sanitizeRewardState,
    validateExpeditionIntegrity,
    validateProgress,
    buildSafePlayerState
};