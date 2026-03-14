
window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.config = {
    animalConfig: {
        monkey: {
            buyName: "małpę",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150,
            rarityMultiplier: 1.0
        },
        panda: {
            buyName: "pandę",
            buyCost: 400,
            baseIncome: 3,
            upgradeBaseCost: 600,
            rarityMultiplier: 1.5
        },
        lion: {
            buyName: "lwa",
            buyCost: 1200,
            baseIncome: 8,
            upgradeBaseCost: 1800,
            rarityMultiplier: 2.5
        }
    },
    maxOfflineSeconds: 86400,
    loadingFadeStartMs: 1800,
    loadingHideMs: 2600,
    passiveIncomeIntervalMs: 1000
};