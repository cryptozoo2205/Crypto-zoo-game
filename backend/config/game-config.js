const LIMITS = {
    MAX_COINS: 1e15,
    MAX_GEMS: 1e6,
    MAX_LEVEL: 1000,
    MAX_XP: 1e9,

    MAX_REWARD_BALANCE: 100000,
    MAX_REWARD_WALLET: 100000,
    MAX_WITHDRAW_PENDING: 100000,

    MAX_COINS_GAIN_PER_SAVE: 5e7,
    MAX_GEMS_GAIN_PER_SAVE: 25,
    MAX_LEVEL_GAIN_PER_SAVE: 3,
    MAX_XP_GAIN_PER_SAVE: 5e6,

    MAX_REWARD_BALANCE_GAIN_PER_SAVE: 2,
    MAX_REWARD_WALLET_GAIN_PER_SAVE: 2,
    MAX_REWARD_TOTAL_GAIN_PER_SAVE: 2,

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

    VISIT_NEW_PLAYER_COINS: 200,
    VISIT_NEW_PLAYER_GEMS: 0,
    VISIT_NEW_PLAYER_REWARD: 0,

    ACTIVATED_NEW_PLAYER_COINS: 800,
    ACTIVATED_NEW_PLAYER_GEMS: 1,
    ACTIVATED_NEW_PLAYER_REWARD: 0,

    ACTIVATED_REFERRER_COINS: 1200,
    ACTIVATED_REFERRER_GEMS: 1,
    ACTIVATED_REFERRER_REWARD: 0
};

const ANIMALS_CONFIG = {
    monkey: { baseIncome: 1, buyCost: 120 },
    panda: { baseIncome: 4, buyCost: 520 },
    lion: { baseIncome: 11, buyCost: 2200 },
    tiger: { baseIncome: 26, buyCost: 9000 },
    elephant: { baseIncome: 62, buyCost: 22000 },
    giraffe: { baseIncome: 145, buyCost: 52000 },
    zebra: { baseIncome: 320, buyCost: 120000 },
    hippo: { baseIncome: 700, buyCost: 270000 },
    penguin: { baseIncome: 1500, buyCost: 600000 },
    bear: { baseIncome: 3200, buyCost: 1300000 },
    crocodile: { baseIncome: 6800, buyCost: 2900000 },
    kangaroo: { baseIncome: 14500, buyCost: 6400000 },
    wolf: { baseIncome: 30000, buyCost: 14000000 }
};

const ADMIN_SECRET = String(process.env.ADMIN_SECRET || "");

module.exports = {
    LIMITS,
    REFERRAL_REWARDS,
    ANIMALS_CONFIG,
    ADMIN_SECRET
};