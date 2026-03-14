window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.config = {
    economy: {
        startCoins: 0,
        startGems: 0,
        startLevel: 1,
        startCoinsPerClick: 1,
        startUpgradeCost: 50,
        clickUpgradeMultiplier: 2.4,
        levelDivider: 5000,
        passiveIncomeIntervalMs: 1000,
        gemsPerLevel: 1
    },

    animals: {
        monkey: {
            key: "monkey",
            name: "Małpa",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150
        },
        panda: {
            key: "panda",
            name: "Panda",
            buyCost: 400,
            baseIncome: 3,
            upgradeBaseCost: 600
        },
        lion: {
            key: "lion",
            name: "Lew",
            buyCost: 1200,
            baseIncome: 8,
            upgradeBaseCost: 1800
        }
    }
};

window.CryptoZoo.formatNumber = function (num) {
    num = Number(num) || 0;

    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";

    return Math.floor(num).toString();
};