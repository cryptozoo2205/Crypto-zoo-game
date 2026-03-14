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
            icon: "🐵",
            rarity: "common",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150
        },
        rabbit: {
            key: "rabbit",
            name: "Królik",
            icon: "🐰",
            rarity: "common",
            buyCost: 180,
            baseIncome: 2,
            upgradeBaseCost: 260
        },
        fox: {
            key: "fox",
            name: "Lis",
            icon: "🦊",
            rarity: "common",
            buyCost: 320,
            baseIncome: 4,
            upgradeBaseCost: 420
        },
        wolf: {
            key: "wolf",
            name: "Wilk",
            icon: "🐺",
            rarity: "common",
            buyCost: 550,
            baseIncome: 6,
            upgradeBaseCost: 700
        },
        panda: {
            key: "panda",
            name: "Panda",
            icon: "🐼",
            rarity: "rare",
            buyCost: 900,
            baseIncome: 10,
            upgradeBaseCost: 1100
        },
        tiger: {
            key: "tiger",
            name: "Tygrys",
            icon: "🐯",
            rarity: "rare",
            buyCost: 1500,
            baseIncome: 16,
            upgradeBaseCost: 1750
        },
        gorilla: {
            key: "gorilla",
            name: "Goryl",
            icon: "🦍",
            rarity: "rare",
            buyCost: 2400,
            baseIncome: 24,
            upgradeBaseCost: 2600
        },
        lion: {
            key: "lion",
            name: "Lew",
            icon: "🦁",
            rarity: "epic",
            buyCost: 4200,
            baseIncome: 40,
            upgradeBaseCost: 4500
        },
        elephant: {
            key: "elephant",
            name: "Słoń",
            icon: "🐘",
            rarity: "epic",
            buyCost: 7600,
            baseIncome: 70,
            upgradeBaseCost: 8000
        },
        giraffe: {
            key: "giraffe",
            name: "Żyrafa",
            icon: "🦒",
            rarity: "epic",
            buyCost: 12000,
            baseIncome: 110,
            upgradeBaseCost: 12600
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