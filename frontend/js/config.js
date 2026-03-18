window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.config = {
    clickValue: 0.2,

    animals: {
        monkey: {
            name: "Monkey",
            asset: "monkey",
            buyCost: 180,
            baseIncome: 1
        },
        panda: {
            name: "Panda",
            asset: "panda",
            buyCost: 1200,
            baseIncome: 4
        },
        lion: {
            name: "Lion",
            asset: "lion",
            buyCost: 5000,
            baseIncome: 12
        },
        tiger: {
            name: "Tiger",
            asset: "tiger",
            buyCost: 15000,
            baseIncome: 30
        },
        elephant: {
            name: "Elephant",
            asset: "elephant",
            buyCost: 20000,
            baseIncome: 85
        },
        giraffe: {
            name: "Giraffe",
            asset: "giraffe",
            buyCost: 50000,
            baseIncome: 180
        },
        zebra: {
            name: "Zebra",
            asset: "zebra",
            buyCost: 120000,
            baseIncome: 420
        },
        hippo: {
            name: "Hippo",
            asset: "hippo",
            buyCost: 280000,
            baseIncome: 900
        },
        penguin: {
            name: "Penguin",
            asset: "penguin",
            buyCost: 600000,
            baseIncome: 1600
        },
        bear: {
            name: "Bear",
            asset: "bear",
            buyCost: 1200000,
            baseIncome: 3200
        },
        crocodile: {
            name: "Crocodile",
            asset: "crocodile",
            buyCost: 2500000,
            baseIncome: 6000
        },
        kangaroo: {
            name: "Kangaroo",
            asset: "kangaroo",
            buyCost: 5500000,
            baseIncome: 12000
        },
        wolf: {
            name: "Wolf",
            asset: "wolf",
            buyCost: 11000000,
            baseIncome: 22000
        }
    },

    boxes: {
        common: {
            buyCoins: 1000,
            buyGems: 0,
            coinMin: 250,
            coinMax: 1500,
            gemsMin: 0,
            gemsMax: 1,
            rewardMax: 0
        },
        rare: {
            buyCoins: 0,
            buyGems: 5,
            coinMin: 1500,
            coinMax: 6000,
            gemsMin: 1,
            gemsMax: 4,
            rewardMax: 0
        },
        epic: {
            buyCoins: 0,
            buyGems: 15,
            coinMin: 6000,
            coinMax: 20000,
            gemsMin: 3,
            gemsMax: 8,
            rewardMax: 0.25
        },
        legendary: {
            buyCoins: 0,
            buyGems: 40,
            coinMin: 20000,
            coinMax: 60000,
            gemsMin: 8,
            gemsMax: 20,
            rewardMax: 1
        }
    },

    expeditions: [
        {
            id: "forest",
            name: "Magic Forest",
            duration: 300,
            baseCoins: 800,
            baseGems: 1,
            rareChance: 0.25,
            epicChance: 0.08
        },
        {
            id: "river",
            name: "Crystal River",
            duration: 900,
            baseCoins: 3000,
            baseGems: 3,
            rareChance: 0.3,
            epicChance: 0.1
        },
        {
            id: "volcano",
            name: "Golden Volcano",
            duration: 1800,
            baseCoins: 8000,
            baseGems: 7,
            rareChance: 0.35,
            epicChance: 0.12
        }
    ],

    shopItems: [
        {
            id: "click1",
            name: "Click Upgrade",
            desc: "+1 coin per click",
            price: 250,
            type: "click"
        },
        {
            id: "click2",
            name: "Strong Finger",
            desc: "+1 coin per click",
            price: 1250,
            type: "click"
        },
        {
            id: "income1",
            name: "Zoo Manager",
            desc: "+25% zoo income",
            price: 3000,
            type: "income"
        },
        {
            id: "income2",
            name: "VIP Caretaker",
            desc: "+25% zoo income",
            price: 12000,
            type: "income"
        },
        {
            id: "expedition1",
            name: "Better Expedition Gear",
            desc: "+20% expedition rewards",
            price: 5000,
            type: "expedition"
        },
        {
            id: "offline1",
            name: "Offline Booster",
            desc: "Better offline income",
            price: 8000,
            type: "offline"
        }
    ]
};

CryptoZoo.formatNumber = function (value) {
    const num = Number(value) || 0;

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