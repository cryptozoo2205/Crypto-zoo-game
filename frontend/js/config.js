window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.config = {
    economy: {
        startCoins: 0,
        startLevel: 1,
        startCoinsPerClick: 1,
        startUpgradeCost: 50,

        clickUpgradeMultiplier: 2.4,
        levelDivider: 5000,
        passiveIncomeIntervalMs: 1000
    },

    animals: {
        monkey: {
            key: "monkey",
            name: "Małpa",
            rarity: "common",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150
        },

        panda: {
            key: "panda",
            name: "Panda",
            rarity: "rare",
            buyCost: 400,
            baseIncome: 3,
            upgradeBaseCost: 600
        },

        lion: {
            key: "lion",
            name: "Lew",
            rarity: "epic",
            buyCost: 1200,
            baseIncome: 8,
            upgradeBaseCost: 1800
        }
    }
};

window.CryptoZoo.formatNumber = function (num) {
    if (num === null || num === undefined) return "0";

    num = Number(num);

    if (Number.isNaN(num)) return "0";

    if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(2) + "T";
    }

    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + "B";
    }

    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + "M";
    }

    if (num >= 1000) {
        return (num / 1000).toFixed(2) + "K";
    }

    return Math.floor(num).toString();
};