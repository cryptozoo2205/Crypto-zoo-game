const { LIMITS } = require("../config/game-config");
const {
    clamp,
    normalizeNumber,
    normalizeRewardNumber,
    safeString,
    normalizeTelegramUser
} = require("../utils/helpers");

function getDefaultPlayer(telegramId = "local-player", username = "Gracz") {
    const now = Date.now();

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

        // 🔥 NOWE (CRITICAL)
        createdAt: now,
        lastActiveAt: now,

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

        lastLogin: now,
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

function normalizePlayer(input) {
    const base = getDefaultPlayer(input?.telegramId, input?.username);

    const now = Date.now();

    const createdAt = Math.max(
        0,
        normalizeNumber(input?.createdAt, base.createdAt || now)
    );

    return {
        ...base,
        ...input,

        telegramId: safeString(input?.telegramId, base.telegramId),
        username: safeString(input?.username, base.username),

        // 🔥 CRITICAL FIELDS
        createdAt,
        lastActiveAt: now,

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
        xp: clamp(Math.max(0, normalizeNumber(input?.xp, base.xp)), 0, LIMITS.MAX_XP)
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
    normalizePlayer,
    getPlayerOrCreate
};