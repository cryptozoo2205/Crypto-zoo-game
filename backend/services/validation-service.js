const { LIMITS } = require("../config/game-config");
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

function getMaxOwnedPerAnimal() {
    return Math.max(1, Number(LIMITS?.MAX_OWNED_PER_ANIMAL) || Number(LIMITS?.maxOwnedPerAnimal) || 50);
}

function getMaxLevelPerAnimal() {
    return Math.max(1, Number(LIMITS?.MAX_LEVEL_PER_ANIMAL) || Number(LIMITS?.maxLevelPerAnimal) || 100);
}

function getMaxCoinsGainPerSave() {
    return Math.max(0, Number(LIMITS?.MAX_COINS_GAIN_PER_SAVE) || 5000000000);
}

function getMaxGemsGainPerSave() {
    return Math.max(0, Number(LIMITS?.MAX_GEMS_GAIN_PER_SAVE) || 500);
}

function getMaxLevelGainPerSave() {
    return Math.max(0, Number(LIMITS?.MAX_LEVEL_GAIN_PER_SAVE) || 5);
}

function getMaxXpGainPerSave() {
    return Math.max(0, Number(LIMITS?.MAX_XP_GAIN_PER_SAVE) || 1000000);
}

function getMaxRewardBalanceGainPerSave() {
    return Math.max(0, Number(LIMITS?.MAX_REWARD_BALANCE_GAIN_PER_SAVE) || 10);
}

function getMaxRewardWalletGainPerSave() {
    return Math.max(0, Number(LIMITS?.MAX_REWARD_WALLET_GAIN_PER_SAVE) || 10);
}

function getMaxRewardTotalGainPerSave() {
    return Math.max(0, Number(LIMITS?.MAX_REWARD_TOTAL_GAIN_PER_SAVE) || 10);
}

function getMaxZooIncome() {
    return Math.max(0, Number(LIMITS?.MAX_ZOO_INCOME) || 1000000000000);
}

function getSafeAnimalState(value) {
    const obj = normalizeObject(value);
    const maxOwned = getMaxOwnedPerAnimal();
    const maxLevel = getMaxLevelPerAnimal();

    return {
        count: clamp(Math.floor(Number(obj.count) || 0), 0, maxOwned),
        level: clamp(Math.floor(Number(obj.level) || 1), 1, maxLevel)
    };
}

function mergeAnimalsSecure(oldAnimals, incomingAnimals) {
    const oldSafe = normalizeObject(oldAnimals);
    const incomingSafe = normalizeObject(incomingAnimals);
    const result = {};

    const allKeys = new Set([
        ...Object.keys(oldSafe),
        ...Object.keys(incomingSafe)
    ]);

    allKeys.forEach((key) => {
        const oldAnimal = getSafeAnimalState(oldSafe[key]);
        const incomingAnimal = getSafeAnimalState(incomingSafe[key]);

        result[key] = {
            count: Math.max(oldAnimal.count, incomingAnimal.count),
            level: Math.max(oldAnimal.level, incomingAnimal.level)
        };
    });

    return result;
}

function computeZooIncomeFromAnimals(player) {
    const animalsConfig = normalizeObject(player?.animals);
    const configAnimals = normalizeObject(global.window?.CryptoZoo?.config?.animals);

    if (!Object.keys(configAnimals).length) {
        return Math.max(0, Number(player?.zooIncome) || 0);
    }

    let total = 0;
    const maxOwned = getMaxOwnedPerAnimal();
    const maxLevel = getMaxLevelPerAnimal();

    Object.keys(configAnimals).forEach((type) => {
        const animalState = normalizeObject(animalsConfig[type]);
        const count = clamp(Math.floor(Number(animalState.count) || 0), 0, maxOwned);
        const level = clamp(Math.floor(Number(animalState.level) || 1), 1, maxLevel);
        const baseIncome = Math.max(0, Number(configAnimals[type]?.baseIncome) || 0);

        total += count * level * baseIncome;
    });

    return clamp(Math.floor(total), 0, getMaxZooIncome());
}

function sanitizeRewardState(oldPlayer, newPlayer) {
    const safePlayer = normalizePlayer(newPlayer);

    if (!oldPlayer) {
        safePlayer.rewardBalance = clamp(
            normalizeRewardNumber(safePlayer.rewardBalance, 0),
            0,
            Number(LIMITS?.MAX_REWARD_BALANCE) || 100000
        );

        safePlayer.rewardWallet = clamp(
            normalizeRewardNumber(safePlayer.rewardWallet, 0),
            0,
            Number(LIMITS?.MAX_REWARD_WALLET) || 100000
        );

        safePlayer.withdrawPending = clamp(
            normalizeRewardNumber(safePlayer.withdrawPending, 0),
            0,
            Number(LIMITS?.MAX_WITHDRAW_PENDING) || 100000
        );

        return safePlayer;
    }

    const oldSafe = normalizePlayer(oldPlayer);

    const oldRewardBalance = normalizeRewardNumber(oldSafe.rewardBalance, 0);
    const oldRewardWallet = normalizeRewardNumber(oldSafe.rewardWallet, 0);
    const oldWithdrawPending = normalizeRewardNumber(oldSafe.withdrawPending, 0);

    const incomingRewardBalance = normalizeRewardNumber(safePlayer.rewardBalance, oldRewardBalance);
    const incomingRewardWallet = normalizeRewardNumber(safePlayer.rewardWallet, oldRewardWallet);
    const incomingWithdrawPending = normalizeRewardNumber(safePlayer.withdrawPending, oldWithdrawPending);

    const rewardBalanceGain = incomingRewardBalance - oldRewardBalance;
    const rewardWalletGain = incomingRewardWallet - oldRewardWallet;
    const rewardTotalGain =
        (incomingRewardBalance + incomingRewardWallet + incomingWithdrawPending) -
        (oldRewardBalance + oldRewardWallet + oldWithdrawPending);

    safePlayer.rewardBalance =
        rewardBalanceGain > getMaxRewardBalanceGainPerSave()
            ? oldRewardBalance
            : incomingRewardBalance;

    safePlayer.rewardWallet =
        rewardWalletGain > getMaxRewardWalletGainPerSave()
            ? oldRewardWallet
            : incomingRewardWallet;

    safePlayer.withdrawPending = Math.max(
        oldWithdrawPending,
        incomingWithdrawPending
    );

    if (rewardTotalGain > getMaxRewardTotalGainPerSave()) {
        safePlayer.rewardBalance = oldRewardBalance;
        safePlayer.rewardWallet = oldRewardWallet;
        safePlayer.withdrawPending = oldWithdrawPending;
    }

    safePlayer.rewardBalance = clamp(
        normalizeRewardNumber(safePlayer.rewardBalance, 0),
        0,
        Number(LIMITS?.MAX_REWARD_BALANCE) || 100000
    );

    safePlayer.rewardWallet = clamp(
        normalizeRewardNumber(safePlayer.rewardWallet, 0),
        0,
        Number(LIMITS?.MAX_REWARD_WALLET) || 100000
    );

    safePlayer.withdrawPending = clamp(
        normalizeRewardNumber(safePlayer.withdrawPending, 0),
        0,
        Number(LIMITS?.MAX_WITHDRAW_PENDING) || 100000
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

    if (coinsDiff > getMaxCoinsGainPerSave()) {
        newPlayer.coins = oldSafe.coins;
    }

    if (gemsDiff > getMaxGemsGainPerSave()) {
        newPlayer.gems = oldSafe.gems;
    }

    if (levelDiff > getMaxLevelGainPerSave()) {
        newPlayer.level = oldSafe.level;
    }

    if (xpDiff > getMaxXpGainPerSave()) {
        newPlayer.xp = oldSafe.xp;
    }

    newPlayer.coins = clamp(Number(newPlayer.coins || 0), 0, LIMITS.MAX_COINS);
    newPlayer.gems = clamp(Number(newPlayer.gems || 0), 0, LIMITS.MAX_GEMS);
    newPlayer.level = clamp(Number(newPlayer.level || 1), 1, LIMITS.MAX_LEVEL);
    newPlayer.xp = clamp(Number(newPlayer.xp || 0), 0, LIMITS.MAX_XP);

    return newPlayer;
}

function sanitizeExpeditionState(oldPlayer, merged, incomingRaw) {
    const incomingObj = normalizeObject(incomingRaw);
    const hasIncomingExpeditionField = Object.prototype.hasOwnProperty.call(incomingObj, "expedition");

    if (!oldPlayer) {
        merged.expedition = hasIncomingExpeditionField ? (incomingObj.expedition ?? null) : null;
        return merged;
    }

    const oldSafe = normalizePlayer(oldPlayer);
    const oldExpedition = oldSafe?.expedition || null;
    const incomingExpedition = hasIncomingExpeditionField ? (incomingObj.expedition ?? null) : undefined;

    if (incomingExpedition === null) {
        merged.expedition = oldExpedition;
        return merged;
    }

    if (incomingExpedition && !oldExpedition) {
        merged.expedition = oldExpedition;
        return merged;
    }

    if (incomingExpedition && oldExpedition) {
        const sameId =
            String(incomingExpedition?.id || "") === String(oldExpedition?.id || "");
        const sameStart =
            Number(incomingExpedition?.startTime || 0) === Number(oldExpedition?.startTime || 0);

        merged.expedition = sameId && sameStart ? oldExpedition : oldExpedition;
        return merged;
    }

    merged.expedition = oldExpedition;
    return merged;
}

function buildSafePlayerState(oldPlayer, incomingRaw, normalizeTelegramUser) {
    const oldSafe = oldPlayer ? normalizePlayer(oldPlayer) : null;
    const incoming = normalizePlayer(incomingRaw);

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

        animals: mergeAnimalsSecure(
            oldSafe?.animals,
            incoming.animals
        ),

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

    sanitizeExpeditionState(oldSafe, merged, incomingRaw);

    merged.zooIncome = computeZooIncomeFromAnimals(merged);

    const safe1 = sanitizeRewardState(oldSafe, merged);
    const safe2 = validateProgress(oldSafe, safe1);

    return normalizePlayer(safe2);
}

module.exports = {
    sanitizeRewardState,
    validateProgress,
    buildSafePlayerState
};