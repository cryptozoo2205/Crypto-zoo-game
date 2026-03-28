const { LIMITS } = require("../config/game-config");
const {
    clamp,
    normalizeNumber,
    normalizeRewardNumber,
    safeString,
    normalizeTelegramUser
} = require("../utils/helpers");

function getDefaultPlayer(telegramId = "local-player", username = "Gracz") {
    return {
        telegramId: String(telegramId),
        username: String(username || "Gracz"),

        telegramUser: {
            id: String(telegramId),
            username: String(username || ""),
            first_name: String(username || "Gracz"),
            isMock: String(telegramId) === "local-player",
            isTelegramWebApp: false
        },

        coins: 0,
        gems: 0,
        rewardBalance: 0,
        rewardWallet: 0,
        withdrawPending: 0,

        level: 1,
        xp: 0,
        coinsPerClick: 1,
        upgradeCost: 50,
        zooIncome: 0,
        expeditionBoost: 0,

        offlineMaxSeconds: 1 * 60 * 60,
        offlineBoostMultiplier: 1,
        offlineBoostActiveUntil: 0,
        offlineBoost: 1,

        lastLogin: Date.now(),
        lastDailyRewardAt: 0,
        dailyRewardStreak: 0,
        dailyRewardClaimDayKey: "",
        boost2xActiveUntil: 0,
        playTimeSeconds: 0,
        lastAwardedLevel: 1,

        referredBy: "",
        referralCode: String(telegramId),
        referralsCount: 0,
        referrals: [],
        referralWelcomeBonusClaimed: false,
        referralActivated: false,
        referralActivationBonusClaimed: false,

        animals: {
            monkey: { count: 0, level: 1 },
            panda: { count: 0, level: 1 },
            lion: { count: 0, level: 1 },
            tiger: { count: 0, level: 1 },
            elephant: { count: 0, level: 1 },
            giraffe: { count: 0, level: 1 },
            zebra: { count: 0, level: 1 },
            hippo: { count: 0, level: 1 },
            penguin: { count: 0, level: 1 },
            bear: { count: 0, level: 1 },
            crocodile: { count: 0, level: 1 },
            kangaroo: { count: 0, level: 1 },
            wolf: { count: 0, level: 1 }
        },

        boxes: {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0
        },

        expedition: null,

        minigames: {
            wheelCooldownUntil: 0,
            memoryCooldownUntil: 0,
            extraWheelSpins: 0
        },

        shopPurchases: {},

        expeditionStats: {
            rareChanceBonus: 0,
            epicChanceBonus: 0,
            timeReductionSeconds: 0,
            timeBoostCharges: []
        },

        dailyMissions: {
            dayKey: "",
            missions: [],
            claimedCount: 0
        }
    };
}

function normalizeAnimalState(rawAnimals, baseAnimals) {
    const result = {};
    const template = baseAnimals || getDefaultPlayer().animals;

    Object.keys(template).forEach((type) => {
        const raw = rawAnimals && rawAnimals[type] ? rawAnimals[type] : template[type];
        result[type] = {
            count: Math.max(0, normalizeNumber(raw?.count, 0)),
            level: Math.max(1, normalizeNumber(raw?.level, 1))
        };
    });

    return result;
}

function normalizeBoxes(rawBoxes) {
    return {
        common: Math.max(0, normalizeNumber(rawBoxes?.common, 0)),
        rare: Math.max(0, normalizeNumber(rawBoxes?.rare, 0)),
        epic: Math.max(0, normalizeNumber(rawBoxes?.epic, 0)),
        legendary: Math.max(0, normalizeNumber(rawBoxes?.legendary, 0))
    };
}

function normalizeMinigames(rawMinigames) {
    return {
        wheelCooldownUntil: Math.max(0, normalizeNumber(rawMinigames?.wheelCooldownUntil, 0)),
        memoryCooldownUntil: Math.max(0, normalizeNumber(rawMinigames?.memoryCooldownUntil, 0)),
        extraWheelSpins: Math.max(0, normalizeNumber(rawMinigames?.extraWheelSpins, 0))
    };
}

function normalizeShopPurchases(raw) {
    const result = {};
    const source = raw && typeof raw === "object" ? raw : {};

    Object.keys(source).forEach((key) => {
        result[key] = Math.max(0, normalizeNumber(source[key], 0));
    });

    return result;
}

function normalizeExpedition(rawExpedition) {
    if (!rawExpedition || typeof rawExpedition !== "object") {
        return null;
    }

    return {
        id: String(rawExpedition.id || ""),
        name: String(rawExpedition.name || "Expedition"),
        startTime: normalizeNumber(rawExpedition.startTime, Date.now()),
        endTime: normalizeNumber(rawExpedition.endTime, 0),
        duration: Math.max(0, normalizeNumber(rawExpedition.duration, 0)),
        baseDuration: Math.max(0, normalizeNumber(rawExpedition.baseDuration, 0)),
        timeReductionUsed: Math.max(0, normalizeNumber(rawExpedition.timeReductionUsed, 0)),
        rewardRarity: String(rawExpedition.rewardRarity || "common"),
        rewardCoins: Math.max(0, normalizeNumber(rawExpedition.rewardCoins, 0)),
        rewardGems: Math.max(0, normalizeNumber(rawExpedition.rewardGems, 0)),
        startCostCoins: Math.max(0, normalizeNumber(rawExpedition.startCostCoins, 0)),
        selectedAnimals: Array.isArray(rawExpedition.selectedAnimals)
            ? rawExpedition.selectedAnimals
                .map((entry) => ({
                    type: safeString(entry?.type, ""),
                    count: Math.max(1, normalizeNumber(entry?.count, 1))
                }))
                .filter((entry) => !!entry.type)
            : []
    };
}

function normalizeExpeditionStats(rawExpeditionStats) {
    const timeBoostCharges = Array.isArray(rawExpeditionStats?.timeBoostCharges)
        ? rawExpeditionStats.timeBoostCharges
            .map((value) => Math.max(0, normalizeNumber(value, 0)))
            .filter((value) => value > 0)
        : [];

    return {
        rareChanceBonus: Math.max(0, normalizeNumber(rawExpeditionStats?.rareChanceBonus, 0)),
        epicChanceBonus: Math.max(0, normalizeNumber(rawExpeditionStats?.epicChanceBonus, 0)),
        timeReductionSeconds: Math.max(0, normalizeNumber(rawExpeditionStats?.timeReductionSeconds, 0)),
        timeBoostCharges
    };
}

function normalizeDailyMissions(rawDailyMissions) {
    const safe = rawDailyMissions && typeof rawDailyMissions === "object"
        ? rawDailyMissions
        : {};

    return {
        dayKey: String(safe.dayKey || ""),
        claimedCount: Math.max(0, normalizeNumber(safe.claimedCount, 0)),
        missions: Array.isArray(safe.missions)
            ? safe.missions.map((mission) => ({
                id: String(mission?.id || ""),
                type: String(mission?.type || ""),
                target: Math.max(1, normalizeNumber(mission?.target, 1)),
                progress: Math.max(0, normalizeNumber(mission?.progress, 0)),
                title: String(mission?.title || "Misja"),
                rewardCoins: Math.max(0, normalizeNumber(mission?.rewardCoins, 0)),
                rewardGems: Math.max(0, normalizeNumber(mission?.rewardGems, 0)),
                claimed: !!mission?.claimed
            }))
            : []
    };
}

function normalizeReferralEntry(rawEntry) {
    return {
        telegramId: safeString(rawEntry?.telegramId, ""),
        username: safeString(rawEntry?.username, "Gracz"),
        firstName: safeString(rawEntry?.firstName, ""),
        createdAt: Math.max(0, normalizeNumber(rawEntry?.createdAt, Date.now())),
        activated: !!rawEntry?.activated,
        activatedAt: Math.max(0, normalizeNumber(rawEntry?.activatedAt, 0))
    };
}

function normalizeReferrals(rawReferrals) {
    if (!Array.isArray(rawReferrals)) {
        return [];
    }

    return rawReferrals
        .map((entry) => normalizeReferralEntry(entry))
        .filter((entry) => !!entry.telegramId)
        .slice(0, LIMITS.MAX_REFERRALS_STORED);
}

function normalizePlayer(input) {
    const base = getDefaultPlayer(input?.telegramId, input?.username);
    const safeTelegramId = safeString(input?.telegramId, base.telegramId);
    const safeUsername = safeString(input?.username, base.username);
    const telegramUser = normalizeTelegramUser(
        input?.telegramUser,
        safeTelegramId,
        safeUsername
    );
    const referrals = normalizeReferrals(input?.referrals);

    return {
        ...base,

        telegramId: safeTelegramId,
        username: safeUsername || telegramUser.first_name || "Gracz",
        telegramUser,

        coins: clamp(Math.max(0, normalizeNumber(input?.coins, base.coins)), 0, LIMITS.MAX_COINS),
        gems: clamp(Math.max(0, normalizeNumber(input?.gems, base.gems)), 0, LIMITS.MAX_GEMS),

        rewardBalance: clamp(
            normalizeRewardNumber(input?.rewardBalance, base.rewardBalance),
            0,
            LIMITS.MAX_REWARD_BALANCE
        ),
        rewardWallet: clamp(
            normalizeRewardNumber(input?.rewardWallet, base.rewardWallet),
            0,
            LIMITS.MAX_REWARD_WALLET
        ),
        withdrawPending: clamp(
            normalizeRewardNumber(input?.withdrawPending, base.withdrawPending),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        ),

        level: clamp(Math.max(1, normalizeNumber(input?.level, base.level)), 1, LIMITS.MAX_LEVEL),
        xp: clamp(Math.max(0, normalizeNumber(input?.xp, base.xp)), 0, LIMITS.MAX_XP),
        coinsPerClick: Math.max(1, normalizeNumber(input?.coinsPerClick, base.coinsPerClick)),
        upgradeCost: Math.max(0, normalizeNumber(input?.upgradeCost, base.upgradeCost)),
        zooIncome: Math.max(0, normalizeNumber(input?.zooIncome, base.zooIncome)),
        expeditionBoost: Math.max(0, normalizeNumber(input?.expeditionBoost, base.expeditionBoost)),

        offlineMaxSeconds: Math.max(0, normalizeNumber(input?.offlineMaxSeconds, base.offlineMaxSeconds)),
        offlineBoostMultiplier: Math.max(1, normalizeNumber(input?.offlineBoostMultiplier, base.offlineBoostMultiplier)),
        offlineBoostActiveUntil: Math.max(0, normalizeNumber(input?.offlineBoostActiveUntil, base.offlineBoostActiveUntil)),
        offlineBoost: Math.max(1, normalizeNumber(input?.offlineBoost, base.offlineBoost)),

        lastLogin: normalizeNumber(input?.lastLogin, Date.now()),
        lastDailyRewardAt: Math.max(0, normalizeNumber(input?.lastDailyRewardAt, 0)),
        dailyRewardStreak: Math.max(0, normalizeNumber(input?.dailyRewardStreak, 0)),
        dailyRewardClaimDayKey: String(input?.dailyRewardClaimDayKey || ""),
        boost2xActiveUntil: Math.max(0, normalizeNumber(input?.boost2xActiveUntil, 0)),
        playTimeSeconds: Math.max(0, normalizeNumber(input?.playTimeSeconds, 0)),
        lastAwardedLevel: Math.max(1, normalizeNumber(input?.lastAwardedLevel, base.lastAwardedLevel)),

        referredBy: safeString(input?.referredBy, ""),
        referralCode: safeString(input?.referralCode, safeTelegramId),
        referralsCount: Math.max(0, normalizeNumber(input?.referralsCount, referrals.length)),
        referrals,
        referralWelcomeBonusClaimed: !!input?.referralWelcomeBonusClaimed,
        referralActivated: !!input?.referralActivated,
        referralActivationBonusClaimed: !!input?.referralActivationBonusClaimed,

        animals: normalizeAnimalState(input?.animals, base.animals),
        boxes: normalizeBoxes(input?.boxes),
        expedition: normalizeExpedition(input?.expedition),
        minigames: normalizeMinigames(input?.minigames),
        shopPurchases: normalizeShopPurchases(input?.shopPurchases),
        expeditionStats: normalizeExpeditionStats(input?.expeditionStats),
        dailyMissions: normalizeDailyMissions(input?.dailyMissions)
    };
}

function getPlayerOrCreate(db, telegramId, username = "Gracz", telegramUser = null) {
    const id = String(telegramId || "local-player");

    if (!db.players[id]) {
        db.players[id] = getDefaultPlayer(id, username);
    }

    db.players[id] = normalizePlayer({
        ...db.players[id],
        telegramId: id,
        username: safeString(username, db.players[id].username || "Gracz"),
        telegramUser: telegramUser || db.players[id].telegramUser
    });

    return db.players[id];
}

module.exports = {
    getDefaultPlayer,
    normalizeAnimalState,
    normalizeBoxes,
    normalizeMinigames,
    normalizeShopPurchases,
    normalizeExpedition,
    normalizeExpeditionStats,
    normalizeDailyMissions,
    normalizeReferralEntry,
    normalizeReferrals,
    normalizePlayer,
    getPlayerOrCreate
};