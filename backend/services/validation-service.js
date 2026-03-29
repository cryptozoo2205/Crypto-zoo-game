const { LIMITS } = require("../config/game-config");
const { clamp, normalizeRewardNumber } = require("../utils/helpers");
const { normalizePlayer } = require("./player-service");

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
    if (!oldPlayer) return newPlayer;

    const oldSafe = normalizePlayer(oldPlayer);

    const coinsDiff = newPlayer.coins - oldSafe.coins;
    const gemsDiff = newPlayer.gems - oldSafe.gems;
    const levelDiff = newPlayer.level - oldSafe.level;

    // 🔥 tylko blokujemy ogromne cheaty — NIE normalne zmiany
    if (coinsDiff > LIMITS.MAX_COINS_GAIN_PER_SAVE) {
        newPlayer.coins = oldSafe.coins;
    }

    if (gemsDiff > LIMITS.MAX_GEMS_GAIN_PER_SAVE) {
        newPlayer.gems = oldSafe.gems;
    }

    if (levelDiff > LIMITS.MAX_LEVEL_GAIN_PER_SAVE) {
        newPlayer.level = oldSafe.level;
    }

    // ❗ NIE BLOKUJEMY SPADKÓW (wydawanie gemów!)
    newPlayer.coins = clamp(newPlayer.coins, 0, LIMITS.MAX_COINS);
    newPlayer.gems = clamp(newPlayer.gems, 0, LIMITS.MAX_GEMS);
    newPlayer.level = clamp(newPlayer.level, 1, LIMITS.MAX_LEVEL);

    return newPlayer;
}

function buildSafePlayerState(oldPlayer, incomingRaw, normalizeTelegramUser) {
    const incoming = normalizePlayer(incomingRaw);

    const safe = normalizePlayer({
        ...(oldPlayer || {}),
        ...incoming
    });

    const safe1 = sanitizeRewardState(oldPlayer, safe);
    const safe2 = validateProgress(oldPlayer, safe1);

    return normalizePlayer(safe2);
}

module.exports = {
    sanitizeRewardState,
    validateProgress,
    buildSafePlayerState
};