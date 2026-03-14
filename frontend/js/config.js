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
            upgradeBaseCost: 150,
            icon: "🐵"
        },

        rabbit: {
            key: "rabbit",
            name: "Królik",
            rarity: "common",
            buyCost: 180,
            baseIncome: 2,
            upgradeBaseCost: 260,
            icon: "🐰"
        },

        parrot: {
            key: "parrot",
            name: "Papuga",
            rarity: "common",
            buyCost: 320,
            baseIncome: 4,
            upgradeBaseCost: 420,
            icon: "🦜"
        },

        turtle: {
            key: "turtle",
            name: "Żółw",
            rarity: "common",
            buyCost: 550,
            baseIncome: 6,
            upgradeBaseCost: 700,
            icon: "🐢"
        },

        panda: {
            key: "panda",
            name: "Panda",
            rarity: "rare",
            buyCost: 900,
            baseIncome: 10,
            upgradeBaseCost: 1100,
            icon: "🐼"
        },

        wolf: {
            key: "wolf",
            name: "Wilk",
            rarity: "rare",
            buyCost: 1500,
            baseIncome: 16,
            upgradeBaseCost: 1750,
            icon: "🐺"
        },

        flamingo: {
            key: "flamingo",
            name: "Flaming",
            rarity: "rare",
            buyCost: 2400,
            baseIncome: 24,
            upgradeBaseCost: 2600,
            icon: "🦩"
        },

        lion: {
            key: "lion",
            name: "Lew",
            rarity: "epic",
            buyCost: 4200,
            baseIncome: 40,
            upgradeBaseCost: 4500,
            icon: "🦁"
        },

        tiger: {
            key: "tiger",
            name: "Tygrys",
            rarity: "epic",
            buyCost: 7600,
            baseIncome: 70,
            upgradeBaseCost: 8000,
            icon: "🐯"
        },

        elephant: {
            key: "elephant",
            name: "Słoń",
            rarity: "epic",
            buyCost: 12000,
            baseIncome: 110,
            upgradeBaseCost: 12600,
            icon: "🐘"
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