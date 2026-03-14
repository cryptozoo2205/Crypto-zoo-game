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

        gemsFromLevel: 10
    },

    animals: {
        monkey: { key: "monkey", rarity: "common", buyCost: 100, baseIncome: 1, upgradeBaseCost: 150 },
        rabbit: { key: "rabbit", rarity: "common", buyCost: 180, baseIncome: 2, upgradeBaseCost: 260 },
        parrot: { key: "parrot", rarity: "common", buyCost: 320, baseIncome: 4, upgradeBaseCost: 420 },
        turtle: { key: "turtle", rarity: "common", buyCost: 550, baseIncome: 6, upgradeBaseCost: 700 },

        panda: { key: "panda", rarity: "rare", buyCost: 900, baseIncome: 10, upgradeBaseCost: 1100 },
        wolf: { key: "wolf", rarity: "rare", buyCost: 1500, baseIncome: 16, upgradeBaseCost: 1750 },
        flamingo: { key: "flamingo", rarity: "rare", buyCost: 2400, baseIncome: 24, upgradeBaseCost: 2600 },

        lion: { key: "lion", rarity: "epic", buyCost: 4200, baseIncome: 40, upgradeBaseCost: 4500 },
        tiger: { key: "tiger", rarity: "epic", buyCost: 7600, baseIncome: 70, upgradeBaseCost: 8000 },
        elephant: { key: "elephant", rarity: "epic", buyCost: 12000, baseIncome: 110, upgradeBaseCost: 12600 }
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