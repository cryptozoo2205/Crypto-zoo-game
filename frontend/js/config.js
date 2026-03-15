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
            asset: "monkey",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150
        },
        panda: {
            key: "panda",
            name: "Panda",
            asset: "panda",
            buyCost: 400,
            baseIncome: 3,
            upgradeBaseCost: 600
        },
        lion: {
            key: "lion",
            name: "Lew",
            asset: "lion",
            buyCost: 1200,
            baseIncome: 8,
            upgradeBaseCost: 1800
        },
        tiger: {
            key: "tiger",
            name: "Tygrys",
            asset: "tiger",
            buyCost: 3000,
            baseIncome: 15,
            upgradeBaseCost: 4200
        },
        elephant: {
            key: "elephant",
            name: "Słoń",
            asset: "elephant",
            buyCost: 8000,
            baseIncome: 35,
            upgradeBaseCost: 11000
        },
        giraffe: {
            key: "giraffe",
            name: "Żyrafa",
            asset: "giraffe",
            buyCost: 18000,
            baseIncome: 70,
            upgradeBaseCost: 24000
        },
        zebra: {
            key: "zebra",
            name: "Zebra",
            asset: "zebra",
            buyCost: 35000,
            baseIncome: 130,
            upgradeBaseCost: 48000
        },
        penguin: {
            key: "penguin",
            name: "Pingwin",
            asset: "penguin",
            buyCost: 70000,
            baseIncome: 240,
            upgradeBaseCost: 95000
        },
        bear: {
            key: "bear",
            name: "Niedźwiedź",
            asset: "bear",
            buyCost: 140000,
            baseIncome: 420,
            upgradeBaseCost: 190000
        },
        wolf: {
            key: "wolf",
            name: "Wilk",
            asset: "wolf",
            buyCost: 280000,
            baseIncome: 750,
            upgradeBaseCost: 380000
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