window.CryptoZoo = window.CryptoZoo || {};

window.CryptoZoo.config = {
    maxOfflineSeconds: 86400,
    animals: {
        monkey: {
            key: "monkey",
            displayName: "Małpa",
            buyName: "małpę",
            buyCost: 100,
            baseIncome: 1,
            upgradeBaseCost: 150,
            rarity: "Common",
            rarityMultiplier: 1.0
        },
        panda: {
            key: "panda",
            displayName: "Panda",
            buyName: "pandę",
            buyCost: 400,
            baseIncome: 3,
            upgradeBaseCost: 600,
            rarity: "Rare",
            rarityMultiplier: 1.5
        },
        lion: {
            key: "lion",
            displayName: "Lew",
            buyName: "lwa",
            buyCost: 1200,
            baseIncome: 8,
            upgradeBaseCost: 1800,
            rarity: "Epic",
            rarityMultiplier: 2.5
        }
    }
};