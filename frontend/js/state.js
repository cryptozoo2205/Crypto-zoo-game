window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.state = {
    coins: 0,
    gems: 0,
    level: 1,
    coinsPerClick: 1,
    upgradeCost: 50,
    zooIncome: 0,

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
        wolf: { count: 0, level: 1 }
    },

    expedition: null
};