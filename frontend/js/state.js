window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.state = {
    coins: 0,
    gems: 0,
    level: 1,
    coinsPerClick: 1,
    upgradeCost: 50,
    zooIncome: 0,
    lastLogin: Date.now(),

    animals: {
        monkey: { count: 0, level: 1 },
        panda: { count: 0, level: 1 },
        lion: { count: 0, level: 1 },
        tiger: { count: 0, level: 1 },
        elephant: { count: 0, level: 1 },
        giraffe: { count: 0, level: 1 },
        zebra: { count: 0, level: 1 },
        penguin: { count: 0, level: 1 },
        bear: { count: 0, level: 1 },
        wolf: { count: 0, level: 1 },
        rhino: { count: 0, level: 1 },
        gorilla: { count: 0, level: 1 },
        crocodile: { count: 0, level: 1 }
    },

    boxes: {
        common: 0,
        rare: 0,
        epic: 0
    },

    expedition: null
};