const { LIMITS, ANIMALS_CONFIG } = require("../config/game-config");
const { clamp, normalizeRewardNumber, normalizeNumber } = require("../utils/helpers");
const { normalizePlayer } = require("./player-service");

const MINIGAME_UNLOCK_LEVELS = {
    memory: 5,
    tapChallenge: 7,
    animalHunt: 10
};

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

function sanitizeAnimals(oldAnimals, incomingAnimals) {
    const result = {};
    const maxOwned = Number(LIMITS.MAX_OWNED_PER_ANIMAL) || 50;
    const maxLevel = Number(LIMITS.MAX_LEVEL_PER_ANIMAL) || 100;

    const keys = new Set([
        ...Object.keys(normalizeObject(oldAnimals)),
        ...Object.keys(normalizeObject(incomingAnimals)),
        ...Object.keys(ANIMALS_CONFIG || {})
    ]);

    keys.forEach((type) => {
        const oldA = normalizeObject(oldAnimals?.[type]);
        const newA = normalizeObject(incomingAnimals?.[type]);

        result[type] = {
            count: clamp(
                Math.max(
                    0,
                    Number(oldA.count || 0),
                    Number(newA.count || 0)
                ),
                0,
                maxOwned
            ),
            level: clamp(
                Math.max(
                    1,
                    Number(oldA.level || 1),
                    Number(newA.level || 1)
                ),
                1,
                maxLevel
            )
        };
    });

    return result;
}

function computeZooIncome(player) {
    let total = 0;

    Object.keys(ANIMALS_CONFIG || {}).forEach((type) => {
        const cfg = ANIMALS_CONFIG[type] || {};
        const state = normalizeObject(player?.animals?.[type]);

        const count = clamp(
            Number(state.count || 0),
            0,
            Number(LIMITS.MAX_OWNED_PER_ANIMAL) || 50
        );

        const level = clamp(
            Number(state.level || 1),
            1,
            Number(LIMITS.MAX_LEVEL_PER_ANIMAL) || 100
        );

        total += count * level * Math.max(0, Number(cfg.baseIncome) || 0);
    });

    return clamp(total, 0, Number(LIMITS.MAX_ZOO_INCOME) || 1e12);
}

function sanitizeReward(oldPlayer, newPlayer) {
    if (!oldPlayer) {
        newPlayer.rewardBalance = clamp(
            normalizeRewardNumber(newPlayer.rewardBalance, 0),
            0,
            LIMITS.MAX_REWARD_BALANCE
        );
        newPlayer.rewardWallet = clamp(
            normalizeRewardNumber(newPlayer.rewardWallet, 0),
            0,
            LIMITS.MAX_REWARD_WALLET
        );
        newPlayer.withdrawPending = clamp(
            normalizeRewardNumber(newPlayer.withdrawPending, 0),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        );
        return newPlayer;
    }

    const oldRewardBalance = normalizeRewardNumber(oldPlayer.rewardBalance, 0);
    const newRewardBalance = normalizeRewardNumber(newPlayer.rewardBalance, 0);
    const rewardBalanceDiff = newRewardBalance - oldRewardBalance;

    if (rewardBalanceDiff > Number(LIMITS.MAX_REWARD_BALANCE_GAIN_PER_SAVE || 0)) {
        newPlayer.rewardBalance = oldRewardBalance;
    }

    const oldRewardWallet = normalizeRewardNumber(oldPlayer.rewardWallet, 0);
    const newRewardWallet = normalizeRewardNumber(newPlayer.rewardWallet, 0);
    const rewardWalletDiff = newRewardWallet - oldRewardWallet;

    if (rewardWalletDiff > Number(LIMITS.MAX_REWARD_WALLET_GAIN_PER_SAVE || 0)) {
        newPlayer.rewardWallet = oldRewardWallet;
    }

    const oldTotalReward =
        oldRewardBalance +
        oldRewardWallet +
        normalizeRewardNumber(oldPlayer.withdrawPending, 0);

    const newTotalReward =
        normalizeRewardNumber(newPlayer.rewardBalance, 0) +
        normalizeRewardNumber(newPlayer.rewardWallet, 0) +
        normalizeRewardNumber(newPlayer.withdrawPending, 0);

    const totalRewardDiff = newTotalReward - oldTotalReward;

    if (totalRewardDiff > Number(LIMITS.MAX_REWARD_TOTAL_GAIN_PER_SAVE || 0)) {
        newPlayer.rewardBalance = oldRewardBalance;
        newPlayer.rewardWallet = oldRewardWallet;
        newPlayer.withdrawPending = Math.max(
            normalizeRewardNumber(oldPlayer.withdrawPending, 0),
            normalizeRewardNumber(newPlayer.withdrawPending, 0)
        );
    }

    newPlayer.rewardBalance = clamp(
        normalizeRewardNumber(newPlayer.rewardBalance, 0),
        0,
        LIMITS.MAX_REWARD_BALANCE
    );

    newPlayer.rewardWallet = clamp(
        normalizeRewardNumber(newPlayer.rewardWallet, 0),
        0,
        LIMITS.MAX_REWARD_WALLET
    );

    newPlayer.withdrawPending = clamp(
        normalizeRewardNumber(newPlayer.withdrawPending, 0),
        0,
        LIMITS.MAX_WITHDRAW_PENDING
    );

    return newPlayer;
}

function validateProgress(oldPlayer, newPlayer) {
    if (!oldPlayer) {
        newPlayer.coins = clamp(Number(newPlayer.coins || 0), 0, LIMITS.MAX_COINS);
        newPlayer.gems = clamp(Number(newPlayer.gems || 0), 0, LIMITS.MAX_GEMS);
        newPlayer.level = clamp(Number(newPlayer.level || 1), 1, LIMITS.MAX_LEVEL);
        newPlayer.xp = clamp(Number(newPlayer.xp || 0), 0, LIMITS.MAX_XP);
        return newPlayer;
    }

    const coinsDiff = Number(newPlayer.coins || 0) - Number(oldPlayer.coins || 0);
    const gemsDiff = Number(newPlayer.gems || 0) - Number(oldPlayer.gems || 0);
    const levelDiff = Number(newPlayer.level || 1) - Number(oldPlayer.level || 1);
    const xpDiff = Number(newPlayer.xp || 0) - Number(oldPlayer.xp || 0);

    if (coinsDiff > Number(LIMITS.MAX_COINS_GAIN_PER_SAVE || 0)) {
        newPlayer.coins = Number(oldPlayer.coins || 0);
    }

    if (gemsDiff > Number(LIMITS.MAX_GEMS_GAIN_PER_SAVE || 0)) {
        newPlayer.gems = Number(oldPlayer.gems || 0);
    }

    if (levelDiff > Number(LIMITS.MAX_LEVEL_GAIN_PER_SAVE || 0)) {
        newPlayer.level = Number(oldPlayer.level || 1);
    }

    if (xpDiff > Number(LIMITS.MAX_XP_GAIN_PER_SAVE || 0)) {
        newPlayer.xp = Number(oldPlayer.xp || 0);
    }

    newPlayer.coins = clamp(Number(newPlayer.coins || 0), 0, LIMITS.MAX_COINS);
    newPlayer.gems = clamp(Number(newPlayer.gems || 0), 0, LIMITS.MAX_GEMS);
    newPlayer.level = clamp(Number(newPlayer.level || 1), 1, LIMITS.MAX_LEVEL);
    newPlayer.xp = clamp(Number(newPlayer.xp || 0), 0, LIMITS.MAX_XP);

    return newPlayer;
}

function sanitizeExpedition(oldPlayer, newPlayer) {
    if (!oldPlayer) return newPlayer;

    const oldExp = oldPlayer.expedition;
    const newExp = newPlayer.expedition;

    if (!oldExp && newExp) {
        newPlayer.expedition = null;
        return newPlayer;
    }

    if (oldExp && newExp) {
        const oldId = String(oldExp.id || "");
        const newId = String(newExp.id || "");
        const oldStart = Number(oldExp.startTime || 0);
        const newStart = Number(newExp.startTime || 0);

        if (oldId !== newId || oldStart !== newStart) {
            newPlayer.expedition = oldExp;
        }
    }

    return newPlayer;
}

function sanitizeMinigames(oldPlayer, newPlayer) {
    const oldMinigames = normalizeObject(oldPlayer?.minigames);
    const nextMinigames = normalizeObject(newPlayer?.minigames);
    const playerLevel = Math.max(1, Number(newPlayer?.level || oldPlayer?.level || 1));

    const oldMemoryCooldownUntil = Math.max(0, Number(oldMinigames.memoryCooldownUntil) || 0);
    const oldTapChallengeCooldownUntil = Math.max(0, Number(oldMinigames.tapChallengeCooldownUntil) || 0);
    const oldAnimalHuntCooldownUntil = Math.max(0, Number(oldMinigames.animalHuntCooldownUntil) || 0);
    const oldWheelCooldownUntil = Math.max(0, Number(oldMinigames.wheelCooldownUntil) || 0);
    const oldExtraWheelSpins = Math.max(0, Math.floor(Number(oldMinigames.extraWheelSpins) || 0));

    const requestedMemoryCooldownUntil = Math.max(0, Number(nextMinigames.memoryCooldownUntil) || 0);
    const requestedTapChallengeCooldownUntil = Math.max(0, Number(nextMinigames.tapChallengeCooldownUntil) || 0);
    const requestedAnimalHuntCooldownUntil = Math.max(0, Number(nextMinigames.animalHuntCooldownUntil) || 0);
    const requestedWheelCooldownUntil = Math.max(0, Number(nextMinigames.wheelCooldownUntil) || 0);
    const requestedExtraWheelSpins = Math.max(0, Math.floor(Number(nextMinigames.extraWheelSpins) || 0));

    const allowMemory = playerLevel >= MINIGAME_UNLOCK_LEVELS.memory;
    const allowTapChallenge = playerLevel >= MINIGAME_UNLOCK_LEVELS.tapChallenge;
    const allowAnimalHunt = playerLevel >= MINIGAME_UNLOCK_LEVELS.animalHunt;

    newPlayer.minigames = {
        ...oldMinigames,
        ...nextMinigames,
        memoryCooldownUntil: allowMemory
            ? Math.max(oldMemoryCooldownUntil, requestedMemoryCooldownUntil)
            : oldMemoryCooldownUntil,
        tapChallengeCooldownUntil: allowTapChallenge
            ? Math.max(oldTapChallengeCooldownUntil, requestedTapChallengeCooldownUntil)
            : oldTapChallengeCooldownUntil,
        animalHuntCooldownUntil: allowAnimalHunt
            ? Math.max(oldAnimalHuntCooldownUntil, requestedAnimalHuntCooldownUntil)
            : oldAnimalHuntCooldownUntil,
        wheelCooldownUntil: Math.max(oldWheelCooldownUntil, requestedWheelCooldownUntil),
        extraWheelSpins: Math.min(oldExtraWheelSpins, requestedExtraWheelSpins)
    };

    return newPlayer;
}

function buildSafePlayerState(oldPlayer, incomingRaw) {
    const oldSafe = oldPlayer ? normalizePlayer(oldPlayer) : null;
    const incomingObj = normalizeObject(incomingRaw);
    const incoming = normalizePlayer(incomingRaw);

    const merged = {
        ...(oldSafe || {}),
        ...incoming,

        telegramUser: {
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
            normalizeRewardNumber(oldSafe?.rewardBalance, 0),
            normalizeRewardNumber(incoming.rewardBalance, 0)
        ),
        rewardWallet: Math.max(
            normalizeRewardNumber(oldSafe?.rewardWallet, 0),
            normalizeRewardNumber(incoming.rewardWallet, 0)
        ),
        withdrawPending: Math.max(
            normalizeRewardNumber(oldSafe?.withdrawPending, 0),
            normalizeRewardNumber(incoming.withdrawPending, 0)
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
            ...normalizeObject(incomingObj.shopPurchases)
        },

        animals: sanitizeAnimals(oldSafe?.animals, incomingObj.animals),

        boxes: {
            common: Math.max(
                Number(oldSafe?.boxes?.common || 0),
                Number(incomingObj.boxes?.common || 0),
                Number(incoming.boxes?.common || 0)
            ),
            rare: Math.max(
                Number(oldSafe?.boxes?.rare || 0),
                Number(incomingObj.boxes?.rare || 0),
                Number(incoming.boxes?.rare || 0)
            ),
            epic: Math.max(
                Number(oldSafe?.boxes?.epic || 0),
                Number(incomingObj.boxes?.epic || 0),
                Number(incoming.boxes?.epic || 0)
            ),
            legendary: Math.max(
                Number(oldSafe?.boxes?.legendary || 0),
                Number(incomingObj.boxes?.legendary || 0),
                Number(incoming.boxes?.legendary || 0)
            )
        },

        missions: {
            ...normalizeObject(oldSafe?.missions),
            ...normalizeObject(incomingObj.missions)
        },

        dailyMissions: {
            ...normalizeObject(oldSafe?.dailyMissions),
            ...normalizeObject(incomingObj.dailyMissions)
        },

        boosts: {
            ...normalizeObject(oldSafe?.boosts),
            ...normalizeObject(incomingObj.boosts)
        },

        settings: {
            ...normalizeObject(oldSafe?.settings),
            ...normalizeObject(incomingObj.settings)
        },

        profile: {
            ...normalizeObject(oldSafe?.profile),
            ...normalizeObject(incomingObj.profile)
        },

        stats: {
            ...normalizeObject(oldSafe?.stats),
            ...normalizeObject(incomingObj.stats)
        },

        minigames: {
            ...normalizeObject(oldSafe?.minigames),
            ...normalizeObject(incomingObj.minigames)
        },

        expedition: Object.prototype.hasOwnProperty.call(incomingObj, "expedition")
            ? incomingObj.expedition
            : (oldSafe?.expedition ?? null),

        offlineBaseHours: Math.max(
            Number(oldSafe?.offlineBaseHours || 1),
            Number(incomingObj.offlineBaseHours || 1),
            Number(incoming.offlineBaseHours || 1)
        ),
        offlineBoostHours: Math.max(
            Number(oldSafe?.offlineBoostHours || 0),
            Number(incomingObj.offlineBoostHours || 0),
            Number(incoming.offlineBoostHours || 0)
        ),
        offlineAdsHours: Math.max(
            Number(oldSafe?.offlineAdsHours || 0),
            Number(incomingObj.offlineAdsHours || 0),
            Number(incoming.offlineAdsHours || 0)
        ),
        offlineAdsResetAt: Math.max(
            Number(oldSafe?.offlineAdsResetAt || 0),
            Number(incomingObj.offlineAdsResetAt || 0),
            Number(incoming.offlineAdsResetAt || 0)
        ),
        offlineMaxSeconds: Math.max(
            Number(oldSafe?.offlineMaxSeconds || 3600),
            Number(incomingObj.offlineMaxSeconds || 3600),
            Number(incoming.offlineMaxSeconds || 3600)
        ),
        offlineBoostMultiplier: Math.max(
            Number(oldSafe?.offlineBoostMultiplier || 1),
            Number(incomingObj.offlineBoostMultiplier || 1),
            Number(incoming.offlineBoostMultiplier || 1)
        ),
        offlineBoostActiveUntil: Math.max(
            Number(oldSafe?.offlineBoostActiveUntil || 0),
            Number(incomingObj.offlineBoostActiveUntil || 0),
            Number(incoming.offlineBoostActiveUntil || 0)
        ),
        offlineBoost: Math.max(
            Number(oldSafe?.offlineBoost || 1),
            Number(incomingObj.offlineBoost || 1),
            Number(incoming.offlineBoost || 1)
        ),

        depositHistory: uniqueMergeArrays(
            incomingObj.depositHistory || incomingObj.depositsHistory || incomingObj.paymentHistory,
            oldSafe?.depositHistory || oldSafe?.depositsHistory || oldSafe?.paymentHistory
        ),
        deposits: uniqueMergeArrays(incomingObj.deposits, oldSafe?.deposits),
        transactions: uniqueMergeArrays(incomingObj.transactions, oldSafe?.transactions),
        withdrawHistory: uniqueMergeArrays(incomingObj.withdrawHistory, oldSafe?.withdrawHistory),
        payoutHistory: uniqueMergeArrays(incomingObj.payoutHistory, oldSafe?.payoutHistory),
        referrals: uniqueMergeArrays(incomingObj.referrals, oldSafe?.referrals),
        referralHistory: uniqueMergeArrays(incomingObj.referralHistory, oldSafe?.referralHistory),

        lastDailyRewardAt: Math.max(
            Number(oldSafe?.lastDailyRewardAt || 0),
            Number(incomingObj.lastDailyRewardAt || 0),
            Number(incoming.lastDailyRewardAt || 0)
        ),
        dailyRewardStreak: Math.max(
            Number(oldSafe?.dailyRewardStreak || 0),
            Number(incomingObj.dailyRewardStreak || 0),
            Number(incoming.dailyRewardStreak || 0)
        ),
        dailyRewardClaimDayKey:
            String(incomingObj.dailyRewardClaimDayKey || "") ||
            String(incoming.dailyRewardClaimDayKey || "") ||
            String(oldSafe?.dailyRewardClaimDayKey || ""),

        boost2xActiveUntil: Math.max(
            Number(oldSafe?.boost2xActiveUntil || 0),
            Number(incomingObj.boost2xActiveUntil || 0),
            Number(incoming.boost2xActiveUntil || 0)
        ),
        playTimeSeconds: Math.max(
            Number(oldSafe?.playTimeSeconds || 0),
            Number(incomingObj.playTimeSeconds || 0),
            Number(incoming.playTimeSeconds || 0)
        ),
        lastAwardedLevel: Math.max(
            Number(oldSafe?.lastAwardedLevel || 1),
            Number(incomingObj.lastAwardedLevel || 1),
            Number(incoming.lastAwardedLevel || 1)
        ),

        referredBy: String(oldSafe?.referredBy || incomingObj.referredBy || incoming.referredBy || ""),
        referralCode: String(oldSafe?.referralCode || incomingObj.referralCode || incoming.referralCode || ""),
        referralsCount: Math.max(
            Number(oldSafe?.referralsCount || 0),
            Number(incomingObj.referralsCount || 0),
            Number(incoming.referralsCount || 0)
        ),
        referralWelcomeBonusClaimed: Boolean(
            oldSafe?.referralWelcomeBonusClaimed ||
            incomingObj.referralWelcomeBonusClaimed ||
            incoming.referralWelcomeBonusClaimed
        ),
        referralActivated: Boolean(
            oldSafe?.referralActivated ||
            incomingObj.referralActivated ||
            incoming.referralActivated
        ),
        referralActivationBonusClaimed: Boolean(
            oldSafe?.referralActivationBonusClaimed ||
            incomingObj.referralActivationBonusClaimed ||
            incoming.referralActivationBonusClaimed
        ),

        createdAt: Math.max(
            Number(oldSafe?.createdAt || 0),
            Number(incomingObj.createdAt || 0),
            Number(incoming.createdAt || 0)
        ),
        updatedAt: Date.now(),
        lastLogin: Math.max(
            Number(oldSafe?.lastLogin || 0),
            Number(incomingObj.lastLogin || 0),
            Number(incoming.lastLogin || 0)
        )
    };

    sanitizeExpedition(oldSafe, merged);
    sanitizeMinigames(oldSafe, merged);
    merged.zooIncome = computeZooIncome(merged);
    sanitizeReward(oldSafe, merged);
    validateProgress(oldSafe, merged);

    return normalizePlayer(merged);
}

module.exports = {
    buildSafePlayerState
};