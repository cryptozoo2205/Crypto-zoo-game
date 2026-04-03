const LIMITS = {
    MAX_COINS: 1e15,
    MAX_GEMS: 1e6,
    MAX_LEVEL: 1000,
    MAX_XP: 1e9,

    MAX_REWARD_BALANCE: 100000,
    MAX_REWARD_WALLET: 100000,
    MAX_WITHDRAW_PENDING: 100000,

    MAX_COINS_GAIN_PER_SAVE: 5e9,
    MAX_GEMS_GAIN_PER_SAVE: 500,
    MAX_LEVEL_GAIN_PER_SAVE: 5,
    MAX_XP_GAIN_PER_SAVE: 1e9,

    MAX_REWARD_BALANCE_GAIN_PER_SAVE: 10,
    MAX_REWARD_WALLET_GAIN_PER_SAVE: 10,
    MAX_REWARD_TOTAL_GAIN_PER_SAVE: 10,

    MIN_WITHDRAW: 20,
    MAX_WITHDRAW: 100000,
    WITHDRAW_COOLDOWN_MS: 5 * 60 * 1000,

    withdrawUsdPerReward: 0.05,
    withdrawFeePercent: 0.10,
    minWithdrawReward: 20,
    minWithdrawLevel: 7,
    minWithdrawAccountAgeMs: 24 * 60 * 60 * 1000,

    MAX_REFERRALS_STORED: 500,

    MAX_OWNED_PER_ANIMAL: 50,
    MAX_LEVEL_PER_ANIMAL: 100,
    MAX_ZOO_INCOME: 1e12
};

const REFERRAL_REWARDS = {
    ACTIVATE_AT_LEVEL: 3,

    VISIT_NEW_PLAYER_COINS: 50,
    VISIT_NEW_PLAYER_GEMS: 0,
    VISIT_NEW_PLAYER_REWARD: 0,

    ACTIVATED_NEW_PLAYER_COINS: 150,
    ACTIVATED_NEW_PLAYER_GEMS: 0,
    ACTIVATED_NEW_PLAYER_REWARD: 0,

    ACTIVATED_REFERRER_COINS: 250,
    ACTIVATED_REFERRER_GEMS: 0,
    ACTIVATED_REFERRER_REWARD: 0
};

const ANIMALS_CONFIG = {
    monkey: { baseIncome: 1 },
    panda: { baseIncome: 5 },
    lion: { baseIncome: 14 },
    tiger: { baseIncome: 36 },
    elephant: { baseIncome: 90 },
    giraffe: { baseIncome: 220 },
    zebra: { baseIncome: 520 },
    hippo: { baseIncome: 1200 },
    penguin: { baseIncome: 2700 },
    bear: { baseIncome: 6000 },
    crocodile: { baseIncome: 13200 },
    kangaroo: { baseIncome: 29000 },
    wolf: { baseIncome: 64000 }
};

const EXPEDITIONS_CONFIG = {
    forest: {
        id: "forest",
        name: "Magic Forest",
        duration: 300,
        baseDuration: 300,
        baseCoins: 80,
        startCostCoins: 50,
        gemChance: 0.01,
        rareChance: 0.12,
        epicChance: 0.01,
        unlockLevel: 1
    },
    river: {
        id: "river",
        name: "Crystal River",
        duration: 900,
        baseDuration: 900,
        baseCoins: 320,
        startCostCoins: 250,
        gemChance: 0.015,
        rareChance: 0.13,
        epicChance: 0.015,
        unlockLevel: 3
    },
    volcano: {
        id: "volcano",
        name: "Golden Volcano",
        duration: 1800,
        baseDuration: 1800,
        baseCoins: 900,
        startCostCoins: 750,
        gemChance: 0.02,
        rareChance: 0.14,
        epicChance: 0.02,
        unlockLevel: 5
    },
    canyon: {
        id: "canyon",
        name: "Sunstone Canyon",
        duration: 3600,
        baseDuration: 3600,
        baseCoins: 2400,
        startCostCoins: 2000,
        gemChance: 0.025,
        rareChance: 0.15,
        epicChance: 0.025,
        unlockLevel: 7
    },
    glacier: {
        id: "glacier",
        name: "Frozen Glacier",
        duration: 7200,
        baseDuration: 7200,
        baseCoins: 5800,
        startCostCoins: 5000,
        gemChance: 0.03,
        rareChance: 0.16,
        epicChance: 0.03,
        unlockLevel: 10
    },
    jungle: {
        id: "jungle",
        name: "Emerald Jungle",
        duration: 14400,
        baseDuration: 14400,
        baseCoins: 13800,
        startCostCoins: 12000,
        gemChance: 0.04,
        rareChance: 0.17,
        epicChance: 0.04,
        unlockLevel: 14
    },
    temple: {
        id: "temple",
        name: "Ancient Temple",
        duration: 28800,
        baseDuration: 28800,
        baseCoins: 32000,
        startCostCoins: 28000,
        gemChance: 0.05,
        rareChance: 0.18,
        epicChance: 0.05,
        unlockLevel: 18
    },
    oasis: {
        id: "oasis",
        name: "Royal Oasis",
        duration: 43200,
        baseDuration: 43200,
        baseCoins: 68000,
        startCostCoins: 60000,
        gemChance: 0.06,
        rareChance: 0.19,
        epicChance: 0.06,
        unlockLevel: 22
    },
    kingdom: {
        id: "kingdom",
        name: "Lost Beast Kingdom",
        duration: 86400,
        baseDuration: 86400,
        baseCoins: 145000,
        startCostCoins: 125000,
        gemChance: 0.07,
        rareChance: 0.20,
        epicChance: 0.07,
        unlockLevel: 28
    }
};

const ADMIN_SECRET = String(process.env.ADMIN_SECRET || "");

module.exports = {
    LIMITS,
    REFERRAL_REWARDS,
    ANIMALS_CONFIG,
    EXPEDITIONS_CONFIG,
    ADMIN_SECRET
};