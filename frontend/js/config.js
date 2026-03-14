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
    passiveIncomeIntervalMs: 1000
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