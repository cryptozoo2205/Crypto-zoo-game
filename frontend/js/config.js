window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;

    if (num >= 1_000_000_000_000) {
        return (num / 1_000_000_000_000).toFixed(2).replace(/\.00$/, "") + "T";
    }
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + "B";
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(2).replace(/\.00$/, "") + "K";
    }

    return String(Math.floor(num));
};

CryptoZoo.config = {
    clickValue: 1,
    offlineLimitHours: 8,

    animals: {
        monkey: { name: "Monkey", asset: "monkey", buyCost: 100, baseIncome: 1 },
        panda: { name: "Panda", asset: "panda", buyCost: 400, baseIncome: 3 },
        lion: { name: "Lion", asset: "lion", buyCost: 1200, baseIncome: 8 },
        tiger: { name: "Tiger", asset: "tiger", buyCost: 3000, baseIncome: 15 },
        elephant: { name: "Elephant", asset: "elephant", buyCost: 8000, baseIncome: 35 },
        giraffe: { name: "Giraffe", asset: "giraffe", buyCost: 18000, baseIncome: 70 },
        zebra: { name: "Zebra", asset: "zebra", buyCost: 45000, baseIncome: 140 },
        hippo: { name: "Hippo", asset: "hippo", buyCost: 120000, baseIncome: 280 },
        penguin: { name: "Penguin", asset: "penguin", buyCost: 300000, baseIncome: 600 },
        bear: { name: "Bear", asset: "bear", buyCost: 800000, baseIncome: 1400 },
        crocodile: { name: "Crocodile", asset: "crocodile", buyCost: 2000000, baseIncome: 3200 },
        kangaroo: { name: "Kangaroo", asset: "kangaroo", buyCost: 5000000, baseIncome: 7500 },
        wolf: { name: "Wolf", asset: "wolf", buyCost: 12000000, baseIncome: 18000 }
    },

    expeditions: [
        {
            id: "forest",
            name: "Forest Expedition",
            duration: 300,
            baseCoins: 500,
            baseGems: 1,
            rareChance: 0.20,
            epicChance: 0.05
        },
        {
            id: "river",
            name: "River Expedition",
            duration: 900,
            baseCoins: 1500,
            baseGems: 2,
            rareChance: 0.22,
            epicChance: 0.06
        },
        {
            id: "desert",
            name: "Desert Expedition",
            duration: 1800,
            baseCoins: 4000,
            baseGems: 3,
            rareChance: 0.25,
            epicChance: 0.07
        }
    ],

    boxes: {
        common: {
            name: "Common Box",
            buyCoins: 1000,
            buyGems: 0,
            coinMin: 300,
            coinMax: 1200,
            gemsMin: 0,
            gemsMax: 1,
            rewardMin: 0,
            rewardMax: 0
        },
        rare: {
            name: "Rare Box",
            buyCoins: 0,
            buyGems: 5,
            coinMin: 1500,
            coinMax: 5000,
            gemsMin: 1,
            gemsMax: 3,
            rewardMin: 0,
            rewardMax: 0.01
        },
        epic: {
            name: "Epic Box",
            buyCoins: 0,
            buyGems: 15,
            coinMin: 6000,
            coinMax: 20000,
            gemsMin: 2,
            gemsMax: 6,
            rewardMin: 0,
            rewardMax: 0.02
        },
        legendary: {
            name: "Legendary Box",
            buyCoins: 0,
            buyGems: 40,
            coinMin: 25000,
            coinMax: 80000,
            gemsMin: 5,
            gemsMax: 12,
            rewardMin: 0,
            rewardMax: 0.05
        }
    },

    shopItems: [
        {
            id: "click_upgrade",
            name: "Click Upgrade",
            desc: "+1 click power",
            price: 200,
            type: "click"
        },
        {
            id: "zoo_manager",
            name: "Zoo Manager",
            desc: "+25% zoo income",
            price: 5000,
            type: "income"
        },
        {
            id: "expedition_boost",
            name: "Expedition Gear",
            desc: "+20% expedition rewards",
            price: 15000,
            type: "expedition"
        },
        {
            id: "offline_boost",
            name: "Offline Booster",
            desc: "x2 offline income",
            price: 25000,
            type: "offline"
        }
    ]
};