const { LIMITS, ANIMALS_CONFIG } = require("../config/game-config");
const { clamp, normalizeRewardNumber } = require("../utils/helpers");
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

// 🔒 ANIMALS SECURITY
function sanitizeAnimals(oldAnimals, incomingAnimals) {
    const result = {};
    const maxOwned = LIMITS.MAX_OWNED_PER_ANIMAL;
    const maxLevel = LIMITS.MAX_LEVEL_PER_ANIMAL;

    const keys = new Set([
        ...Object.keys(oldAnimals || {}),
        ...Object.keys(incomingAnimals || {})
    ]);

    keys.forEach((type) => {
        const oldA = normalizeObject(oldAnimals?.[type]);
        const newA = normalizeObject(incomingAnimals?.[type]);

        result[type] = {
            count: clamp(
                Math.max(oldA.count || 0, newA.count || 0),
                0,
                maxOwned
            ),
            level: clamp(
                Math.max(oldA.level || 1, newA.level || 1),
                1,
                maxLevel
            )
        };
    });

    return result;
}

// 🔒 BACKEND ZOO INCOME
function computeZooIncome(player) {
    let total = 0;

    Object.keys(ANIMALS_CONFIG).forEach((type) => {
        const cfg = ANIMALS_CONFIG[type];
        const state = player.animals?.[type] || {};

        const count = clamp(Number(state.count || 0), 0, LIMITS.MAX_OWNED_PER_ANIMAL);
        const level = clamp(Number(state.level || 1), 1, LIMITS.MAX_LEVEL_PER_ANIMAL);

        total += count * level * cfg.baseIncome;
    });

    return clamp(total, 0, LIMITS.MAX_ZOO_INCOME);
}

// 🔒 REWARD SECURITY
function sanitizeReward(oldPlayer, newPlayer) {
    if (!oldPlayer) return newPlayer;

    const oldR = normalizeRewardNumber(oldPlayer.rewardBalance, 0);
    const newR = normalizeRewardNumber(newPlayer.rewardBalance, 0);

    const diff = newR - oldR;

    if (diff > LIMITS.MAX_REWARD_BALANCE_GAIN_PER_SAVE) {
        newPlayer.rewardBalance = oldR;
    }

    return newPlayer;
}

// 🔒 CORE PROGRESS
function validateProgress(oldPlayer, newPlayer) {
    if (!oldPlayer) return newPlayer;

    if (newPlayer.coins - oldPlayer.coins > LIMITS.MAX_COINS_GAIN_PER_SAVE) {
        newPlayer.coins = oldPlayer.coins;
    }

    if (newPlayer.gems - oldPlayer.gems > LIMITS.MAX_GEMS_GAIN_PER_SAVE) {
        newPlayer.gems = oldPlayer.gems;
    }

    if (newPlayer.level - oldPlayer.level > LIMITS.MAX_LEVEL_GAIN_PER_SAVE) {
        newPlayer.level = oldPlayer.level;
    }

    return newPlayer;
}

// 🔒 EXPEDITION LOCK
function sanitizeExpedition(oldPlayer, newPlayer) {
    if (!oldPlayer) return newPlayer;

    const oldExp = oldPlayer.expedition;
    const newExp = newPlayer.expedition;

    if (!oldExp && newExp) {
        newPlayer.expedition = null;
    }

    if (oldExp && newExp) {
        if (oldExp.id !== newExp.id || oldExp.startTime !== newExp.startTime) {
            newPlayer.expedition = oldExp;
        }
    }

    return newPlayer;
}

// 🔥 MAIN
function buildSafePlayerState(oldPlayer, incomingRaw) {
    const oldSafe = oldPlayer ? normalizePlayer(oldPlayer) : null;
    const incoming = normalizePlayer(incomingRaw);

    const merged = {
        ...(oldSafe || {}),
        ...incoming
    };

    // 🔒 animals
    merged.animals = sanitizeAnimals(oldSafe?.animals, incoming.animals);

    // 🔒 expedition
    sanitizeExpedition(oldSafe, merged);

    // 🔒 zoo income (FULL BACKEND CONTROL)
    merged.zooIncome = computeZooIncome(merged);

    // 🔒 rewards
    sanitizeReward(oldSafe, merged);

    // 🔒 core anti-cheat
    validateProgress(oldSafe, merged);

    return normalizePlayer(merged);
}

module.exports = {
    buildSafePlayerState
};