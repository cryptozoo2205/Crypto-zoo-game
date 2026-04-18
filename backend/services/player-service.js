const { LIMITS } = require("../config/game-config");
const {
    clamp,
    normalizeNumber,
    normalizeRewardNumber,
    safeString,
    normalizeTelegramUser
} = require("../utils/helpers");

function normalizeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeReferrals(value) {
    return normalizeArray(value)
        .map((entry) => {
            const safeEntry = normalizeObject(entry);

            return {
                telegramId: safeString(safeEntry.telegramId, ""),
                username: safeString(safeEntry.username, "Gracz"),
                firstName: safeString(safeEntry.firstName, ""),
                createdAt: Math.max(0, normalizeNumber(safeEntry.createdAt, 0)),
                activated: Boolean(safeEntry.activated),
                activatedAt: Math.max(0, normalizeNumber(safeEntry.activatedAt, 0))
            };
        })
        .filter((entry) => !!entry.telegramId);
}

function normalizeAnimal(value) {
    const obj = normalizeObject(value);

    return {
        count: Math.max(0, normalizeNumber(obj.count, 0)),
        level: Math.max(1, normalizeNumber(obj.level, 1))
    };
}

function getDefaultAnimals() {
    return {
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
    };
}

function getCurrentDayKey(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getCurrentWeekKey(timestamp = Date.now()) {
    const date = new Date(timestamp);

    const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);

    return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getDefaultPlayer(telegramId = "local-player", username = "Gracz") {
    const now = Date.now();

    return {
        telegramId: String(telegramId),
        username: String(username || "Gracz"),

        telegramUser: {
            id: String(telegramId),
            username: String(username || ""),
            first_name: String(username || "Gracz"),
            last_name: "",
            language_code: "pl",
            isMock: String(telegramId) === "local-player",
            isTelegramWebApp: false
        },

        tonAddress: "",

        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        lastLogin: now,

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

        dailyExpeditionBoost: {
            activeUntil: 0,
            lastPurchaseAt: 0
        },

        offlineBaseHours: 0,
        offlineBoostHours: 0,
        offlineAdsHours: 0,
        offlineAdsResetAt: 0,
        offlineMaxSeconds: 0,
        offlineBoostMultiplier: 1,
        offlineBoostActiveUntil: 0,
        offlineBoost: 1,

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
        referralHistory: [],
        referralWelcomeBonusClaimed: false,
        referralActivated: false,
        referralActivationBonusClaimed: false,

        dailyCoins: 0,
        weeklyCoins: 0,
        dailyRankingCoins: 0,
        weeklyRankingCoins: 0,
        dailyUpdatedAt: now,
        weeklyUpdatedAt: now,
        dailyDayKey: getCurrentDayKey(now),
        weeklyWeekKey: getCurrentWeekKey(now),

        animals: getDefaultAnimals(),

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
            tapChallengeCooldownUntil: 0,
            animalHuntCooldownUntil: 0,
            extraWheelSpins: 0
        },

        shopPurchases: {},
        shopItemCharges: {},

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
        },

        missions: {},
        boosts: {},
        settings: {},
        profile: {},
        stats: {
            dailyCoins: 0,
            weeklyCoins: 0,
            dailyRankingCoins: 0,
            weeklyRankingCoins: 0,
            dailyUpdatedAt: now,
            weeklyUpdatedAt: now,
            dailyDayKey: getCurrentDayKey(now),
            weeklyWeekKey: getCurrentWeekKey(now)
        },

        depositHistory: [],
        deposits: [],
        transactions: [],
        withdrawHistory: [],
        payoutHistory: []
    };
}

function normalizePlayer(input) {
    const safeInput = normalizeObject(input);
    const base = getDefaultPlayer(safeInput.telegramId, safeInput.username);
    const now = Date.now();

    const telegramId = safeString(safeInput.telegramId, base.telegramId);
    const username = safeString(safeInput.username, base.username);

    const createdAt = Math.max(
        0,
        normalizeNumber(safeInput.createdAt, base.createdAt || now)
    );

    const updatedAt = Math.max(
        createdAt,
        normalizeNumber(safeInput.updatedAt, now)
    );

    const animalsInput = normalizeObject(safeInput.animals);
    const defaultAnimals = getDefaultAnimals();
    const normalizedAnimals = {};

    Object.keys(defaultAnimals).forEach((key) => {
        normalizedAnimals[key] = normalizeAnimal(animalsInput[key] || defaultAnimals[key]);
    });

    Object.keys(animalsInput).forEach((key) => {
        if (!normalizedAnimals[key]) {
            normalizedAnimals[key] = normalizeAnimal(animalsInput[key]);
        }
    });

    const boxesInput = normalizeObject(safeInput.boxes);
    const minigamesInput = normalizeObject(safeInput.minigames);
    const expeditionStatsInput = normalizeObject(safeInput.expeditionStats);
    const dailyMissionsInput = normalizeObject(safeInput.dailyMissions);
    const dailyExpeditionBoostInput = normalizeObject(safeInput.dailyExpeditionBoost);
    const statsInput = normalizeObject(safeInput.stats);

    const offlineBaseHours = Math.max(
        0,
        Math.floor(normalizeNumber(safeInput.offlineBaseHours, base.offlineBaseHours))
    );

    const offlineBoostHours = Math.max(
        0,
        Math.floor(normalizeNumber(safeInput.offlineBoostHours, base.offlineBoostHours))
    );

    const offlineAdsHours = Math.max(
        0,
        normalizeNumber(safeInput.offlineAdsHours, base.offlineAdsHours)
    );

    const offlineAdsResetAt = Math.max(
        0,
        normalizeNumber(safeInput.offlineAdsResetAt, base.offlineAdsResetAt || 0)
    );

    const computedOfflineMaxSeconds = Math.max(
        0,
        Math.round((offlineBaseHours + offlineBoostHours + offlineAdsHours) * 60 * 60)
    );

    const dailyCoins = Math.max(
        0,
        normalizeNumber(
            safeInput.dailyCoins,
            normalizeNumber(statsInput.dailyCoins, base.dailyCoins)
        )
    );

    const weeklyCoins = Math.max(
        0,
        normalizeNumber(
            safeInput.weeklyCoins,
            normalizeNumber(statsInput.weeklyCoins, base.weeklyCoins)
        )
    );

    const dailyRankingCoins = Math.max(
        0,
        normalizeNumber(
            safeInput.dailyRankingCoins,
            normalizeNumber(statsInput.dailyRankingCoins, dailyCoins)
        )
    );

    const weeklyRankingCoins = Math.max(
        0,
        normalizeNumber(
            safeInput.weeklyRankingCoins,
            normalizeNumber(statsInput.weeklyRankingCoins, weeklyCoins)
        )
    );

    const dailyUpdatedAt = Math.max(
        0,
        normalizeNumber(
            safeInput.dailyUpdatedAt,
            normalizeNumber(statsInput.dailyUpdatedAt, base.dailyUpdatedAt)
        )
    );

    const weeklyUpdatedAt = Math.max(
        0,
        normalizeNumber(
            safeInput.weeklyUpdatedAt,
            normalizeNumber(statsInput.weeklyUpdatedAt, base.weeklyUpdatedAt)
        )
    );

    const dailyDayKey = safeString(
        safeInput.dailyDayKey,
        safeString(statsInput.dailyDayKey, base.dailyDayKey)
    ) || getCurrentDayKey(now);

    const weeklyWeekKey = safeString(
        safeInput.weeklyWeekKey,
        safeString(statsInput.weeklyWeekKey, base.weeklyWeekKey)
    ) || getCurrentWeekKey(now);

    return {
        ...base,
        ...safeInput,

        telegramId,
        username,

        telegramUser: normalizeTelegramUser(
            {
                ...normalizeObject(base.telegramUser),
                ...normalizeObject(safeInput.telegramUser)
            },
            telegramId,
            username
        ),

        tonAddress: safeString(safeInput.tonAddress, base.tonAddress),

        createdAt,
        updatedAt,
        lastActiveAt: now,
        lastLogin: Math.max(0, normalizeNumber(safeInput.lastLogin, base.lastLogin)),

        coins: clamp(Math.max(0, normalizeNumber(safeInput.coins, base.coins)), 0, LIMITS.MAX_COINS),
        gems: clamp(Math.max(0, normalizeNumber(safeInput.gems, base.gems)), 0, LIMITS.MAX_GEMS),

        rewardBalance: clamp(
            normalizeRewardNumber(safeInput.rewardBalance, base.rewardBalance),
            0,
            LIMITS.MAX_REWARD_BALANCE
        ),
        rewardWallet: clamp(
            normalizeRewardNumber(safeInput.rewardWallet, base.rewardWallet),
            0,
            LIMITS.MAX_REWARD_WALLET
        ),
        withdrawPending: clamp(
            normalizeRewardNumber(safeInput.withdrawPending, base.withdrawPending),
            0,
            LIMITS.MAX_WITHDRAW_PENDING
        ),

        level: clamp(Math.max(1, normalizeNumber(safeInput.level, base.level)), 1, LIMITS.MAX_LEVEL),
        xp: clamp(Math.max(0, normalizeNumber(safeInput.xp, base.xp)), 0, LIMITS.MAX_XP),

        coinsPerClick: Math.max(0, normalizeNumber(safeInput.coinsPerClick, base.coinsPerClick)),
        upgradeCost: Math.max(0, normalizeNumber(safeInput.upgradeCost, base.upgradeCost)),
        zooIncome: Math.max(0, normalizeNumber(safeInput.zooIncome, base.zooIncome)),
        expeditionBoost: Math.max(0, normalizeNumber(safeInput.expeditionBoost, base.expeditionBoost)),

        dailyExpeditionBoost: {
            activeUntil: Math.max(
                0,
                normalizeNumber(dailyExpeditionBoostInput.activeUntil, base.dailyExpeditionBoost.activeUntil)
            ),
            lastPurchaseAt: Math.max(
                0,
                normalizeNumber(dailyExpeditionBoostInput.lastPurchaseAt, base.dailyExpeditionBoost.lastPurchaseAt)
            )
        },

        offlineBaseHours,
        offlineBoostHours,
        offlineAdsHours,
        offlineAdsResetAt,
        offlineMaxSeconds: Math.max(
            0,
            normalizeNumber(safeInput.offlineMaxSeconds, computedOfflineMaxSeconds)
        ),
        offlineBoostMultiplier: Math.max(
            0,
            normalizeNumber(safeInput.offlineBoostMultiplier, base.offlineBoostMultiplier)
        ),
        offlineBoostActiveUntil: Math.max(
            0,
            normalizeNumber(safeInput.offlineBoostActiveUntil, base.offlineBoostActiveUntil)
        ),
        offlineBoost: Math.max(0, normalizeNumber(safeInput.offlineBoost, base.offlineBoost)),

        lastDailyRewardAt: Math.max(0, normalizeNumber(safeInput.lastDailyRewardAt, base.lastDailyRewardAt)),
        dailyRewardStreak: Math.max(0, normalizeNumber(safeInput.dailyRewardStreak, base.dailyRewardStreak)),
        dailyRewardClaimDayKey: safeString(
            safeInput.dailyRewardClaimDayKey,
            base.dailyRewardClaimDayKey
        ),
        boost2xActiveUntil: Math.max(0, normalizeNumber(safeInput.boost2xActiveUntil, base.boost2xActiveUntil)),
        playTimeSeconds: Math.max(0, normalizeNumber(safeInput.playTimeSeconds, base.playTimeSeconds)),
        lastAwardedLevel: Math.max(1, normalizeNumber(safeInput.lastAwardedLevel, base.lastAwardedLevel)),

        referredBy: safeString(safeInput.referredBy, base.referredBy),
        referralCode: safeString(safeInput.referralCode, base.referralCode),
        referralsCount: Math.max(0, normalizeNumber(safeInput.referralsCount, base.referralsCount)),
        referrals: normalizeReferrals(safeInput.referrals),
        referralHistory: normalizeArray(safeInput.referralHistory),
        referralWelcomeBonusClaimed: Boolean(safeInput.referralWelcomeBonusClaimed),
        referralActivated: Boolean(safeInput.referralActivated),
        referralActivationBonusClaimed: Boolean(safeInput.referralActivationBonusClaimed),

        dailyCoins,
        weeklyCoins,
        dailyRankingCoins,
        weeklyRankingCoins,
        dailyUpdatedAt,
        weeklyUpdatedAt,
        dailyDayKey,
        weeklyWeekKey,

        animals: normalizedAnimals,

        boxes: {
            common: Math.max(0, normalizeNumber(boxesInput.common, base.boxes.common)),
            rare: Math.max(0, normalizeNumber(boxesInput.rare, base.boxes.rare)),
            epic: Math.max(0, normalizeNumber(boxesInput.epic, base.boxes.epic)),
            legendary: Math.max(0, normalizeNumber(boxesInput.legendary, base.boxes.legendary))
        },

        expedition: safeInput.expedition || null,

        minigames: {
            wheelCooldownUntil: Math.max(
                0,
                normalizeNumber(minigamesInput.wheelCooldownUntil, base.minigames.wheelCooldownUntil)
            ),
            memoryCooldownUntil: Math.max(
                0,
                normalizeNumber(minigamesInput.memoryCooldownUntil, base.minigames.memoryCooldownUntil)
            ),
            tapChallengeCooldownUntil: Math.max(
                0,
                normalizeNumber(minigamesInput.tapChallengeCooldownUntil, base.minigames.tapChallengeCooldownUntil)
            ),
            animalHuntCooldownUntil: Math.max(
                0,
                normalizeNumber(minigamesInput.animalHuntCooldownUntil, base.minigames.animalHuntCooldownUntil)
            ),
            extraWheelSpins: Math.max(
                0,
                normalizeNumber(minigamesInput.extraWheelSpins, base.minigames.extraWheelSpins)
            )
        },

        shopPurchases: normalizeObject(safeInput.shopPurchases),
        shopItemCharges: normalizeObject(safeInput.shopItemCharges),

        expeditionStats: {
            rareChanceBonus: Math.max(
                0,
                normalizeNumber(expeditionStatsInput.rareChanceBonus, base.expeditionStats.rareChanceBonus)
            ),
            epicChanceBonus: Math.max(
                0,
                normalizeNumber(expeditionStatsInput.epicChanceBonus, base.expeditionStats.epicChanceBonus)
            ),
            timeReductionSeconds: Math.max(
                0,
                normalizeNumber(
                    expeditionStatsInput.timeReductionSeconds,
                    base.expeditionStats.timeReductionSeconds
                )
            ),
            timeBoostCharges: normalizeArray(expeditionStatsInput.timeBoostCharges)
        },

        dailyMissions: {
            dayKey: safeString(dailyMissionsInput.dayKey, base.dailyMissions.dayKey),
            missions: normalizeArray(dailyMissionsInput.missions),
            claimedCount: Math.max(
                0,
                normalizeNumber(dailyMissionsInput.claimedCount, base.dailyMissions.claimedCount)
            )
        },

        missions: normalizeObject(safeInput.missions),
        boosts: normalizeObject(safeInput.boosts),
        settings: normalizeObject(safeInput.settings),
        profile: normalizeObject(safeInput.profile),

        stats: {
            ...normalizeObject(base.stats),
            ...statsInput,
            dailyCoins,
            weeklyCoins,
            dailyRankingCoins,
            weeklyRankingCoins,
            dailyUpdatedAt,
            weeklyUpdatedAt,
            dailyDayKey,
            weeklyWeekKey
        },

        depositHistory: normalizeArray(
            safeInput.depositHistory || safeInput.depositsHistory || safeInput.paymentHistory
        ),
        deposits: normalizeArray(safeInput.deposits),
        transactions: normalizeArray(safeInput.transactions),
        withdrawHistory: normalizeArray(safeInput.withdrawHistory),
        payoutHistory: normalizeArray(safeInput.payoutHistory)
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
    getPlayerOrCreate,
    normalizeReferrals,
    getCurrentDayKey,
    getCurrentWeekKey
};