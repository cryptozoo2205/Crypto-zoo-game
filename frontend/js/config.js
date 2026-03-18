window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.config = {
    clickValue: 1,

    animals: {
        monkey: {
            name: "Monkey",
            asset: "monkey",
            buyCost: 40,
            baseIncome: 1
        },
        panda: {
            name: "Panda",
            asset: "panda",
            buyCost: 180,
            baseIncome: 3
        },
        lion: {
            name: "Lion",
            asset: "lion",
            buyCost: 650,
            baseIncome: 8
        },
        tiger: {
            name: "Tiger",
            asset: "tiger",
            buyCost: 1800,
            baseIncome: 18
        },
        elephant: {
            name: "Elephant",
            asset: "elephant",
            buyCost: 5200,
            baseIncome: 42
        },
        giraffe: {
            name: "Giraffe",
            asset: "giraffe",
            buyCost: 14000,
            baseIncome: 95
        },
        zebra: {
            name: "Zebra",
            asset: "zebra",
            buyCost: 36000,
            baseIncome: 210
        },
        hippo: {
            name: "Hippo",
            asset: "hippo",
            buyCost: 92000,
            baseIncome: 470
        },
        penguin: {
            name: "Penguin",
            asset: "penguin",
            buyCost: 240000,
            baseIncome: 980
        },
        bear: {
            name: "Bear",
            asset: "bear",
            buyCost: 620000,
            baseIncome: 2100
        },
        crocodile: {
            name: "Crocodile",
            asset: "crocodile",
            buyCost: 1600000,
            baseIncome: 4500
        },
        kangaroo: {
            name: "Kangaroo",
            asset: "kangaroo",
            buyCost: 4200000,
            baseIncome: 9500
        },
        wolf: {
            name: "Wolf",
            asset: "wolf",
            buyCost: 11000000,
            baseIncome: 20000
        }
    },

    boxes: {
        common: {
            buyCoins: 900,
            buyGems: 0,
            coinMin: 180,
            coinMax: 1100,
            gemsMin: 0,
            gemsMax: 1,
            rewardMax: 0
        },
        rare: {
            buyCoins: 0,
            buyGems: 5,
            coinMin: 1000,
            coinMax: 4200,
            gemsMin: 1,
            gemsMax: 3,
            rewardMax: 0
        },
        epic: {
            buyCoins: 0,
            buyGems: 15,
            coinMin: 4500,
            coinMax: 14000,
            gemsMin: 2,
            gemsMax: 6,
            rewardMax: 0.15
        },
        legendary: {
            buyCoins: 0,
            buyGems: 40,
            coinMin: 14000,
            coinMax: 38000,
            gemsMin: 6,
            gemsMax: 14,
            rewardMax: 0.5
        }
    },

    expeditions: [
        {
            id: "forest",
            name: "Magic Forest",
            duration: 300,
            baseCoins: 500,
            baseGems: 1,
            rareChance: 0.22,
            epicChance: 0.06
        },
        {
            id: "river",
            name: "Crystal River",
            duration: 900,
            baseCoins: 2200,
            baseGems: 2,
            rareChance: 0.28,
            epicChance: 0.09
        },
        {
            id: "volcano",
            name: "Golden Volcano",
            duration: 1800,
            baseCoins: 6500,
            baseGems: 5,
            rareChance: 0.32,
            epicChance: 0.11
        }
    ],

    shopItems: [
        {
            id: "click1",
            name: "Click Upgrade I",
            desc: "+1 coin per click",
            price: 150,
            type: "click"
        },
        {
            id: "click2",
            name: "Click Upgrade II",
            desc: "+1 coin per click",
            price: 700,
            type: "click"
        },
        {
            id: "income1",
            name: "Zoo Manager",
            desc: "+25% zoo income",
            price: 1800,
            type: "income"
        },
        {
            id: "income2",
            name: "VIP Caretaker",
            desc: "+25% zoo income",
            price: 6500,
            type: "income"
        },
        {
            id: "expedition1",
            name: "Better Expedition Gear",
            desc: "+20% expedition rewards",
            price: 3200,
            type: "expedition"
        },
        {
            id: "offline1",
            name: "Offline Booster",
            desc: "Better offline income",
            price: 5000,
            type: "offline"
        }
    ]
};

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;

    if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(num >= 10000000000000 ? 0 : 1).replace(/\.0$/, "") + "T";
    }

    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(num >= 10000000000 ? 0 : 1).replace(/\.0$/, "") + "B";
    }

    if (num >= 1000000) {
        return (num / 1000000).toFixed(num >= 10000000 ? 0 : 1).replace(/\.0$/, "") + "M";
    }

    if (num >= 1000) {
        return (num / 1000).toFixed(num >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
    }

    if (Number.isInteger(num)) {
        return String(num);
    }

    return num.toFixed(2).replace(/\.00$/, "");
};