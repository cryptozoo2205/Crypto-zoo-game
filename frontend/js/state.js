window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.state = {
    coins: 0,
    gems: 0,
    rewardBalance: 0,
    level: 1,
    xp: 0,
    coinsPerClick: 1,
    upgradeCost: 50,
    zooIncome: 0,
    expeditionBoost: 0,
    offlineBoost: 1,
    lastLogin: Date.now(),

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

    expedition: null
};