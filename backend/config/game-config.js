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

    // 🔒 IMPORTANT
    MAX_OWNED_PER_ANIMAL: 50,
    MAX_LEVEL_PER_ANIMAL: 100,
    MAX_ZOO_INCOME: 1e12
};

const REFERRAL_REWARDS = {
    ACTIVATE_AT_LEVEL: 3,

    VISIT_NEW_PLAYER_COINS: 50,
    VISIT_NEW_PLAYER_GEMS: 0,

    ACTIVATED_NEW_PLAYER_COINS: 150,
    ACTIVATED_NEW_PLAYER_GEMS: 0,

    ACTIVATED_REFERRER_COINS: 250,
    ACTIVATED_REFERRER_GEMS: 0
};

const EXPEDITIONS_CONFIG = {
    forest: { id: "forest", startCostCoins: 50 },
    river: { id: "river", startCostCoins: 250 },
    volcano: { id: "volcano", startCostCoins: 750 },
    canyon: { id: "canyon", startCostCoins: 2000 },
    glacier: { id: "glacier", startCostCoins: 5000 },
    jungle: { id: "jungle", startCostCoins: 12000 },
    temple: { id: "temple", startCostCoins: 28000 },
    oasis: { id: "oasis", startCostCoins: 60000 },
    kingdom: { id: "kingdom", startCostCoins: 125000 }
};

// 🔥 KLUCZ DO ANTI-CHEAT
const ANIMALS_CONFIG = {
    monkey: { baseIncome: 1 },
    panda: { baseIncome: 5 },
    lion: { baseIncome: 14 },
    tiger: { baseIncome: 32 },
    elephant: { baseIncome: 75 },
    giraffe: { baseIncome: 160 },
    zebra: { baseIncome: 320 },
    hippo: { baseIncome: 650 },
    penguin: { baseIncome: 1200 },
    bear: { baseIncome: 2500 },
    crocodile: { baseIncome: 5000 },
    kangaroo: { baseIncome: 9500 },
    wolf: { baseIncome: 18000 }
};

const ADMIN_SECRET = String(process.env.ADMIN_SECRET || "");

module.exports = {
    LIMITS,
    REFERRAL_REWARDS,
    EXPEDITIONS_CONFIG,
    ANIMALS_CONFIG,
    ADMIN_SECRET
};