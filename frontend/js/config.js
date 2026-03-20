window.CryptoZoo = window.CryptoZoo || {};

CryptoZoo.config = {
    clickValue: 0.15,

    animals: {
        monkey: {
            name: "Monkey",
            asset: "monkey",
            buyCost: 70,
            baseIncome: 1
        },
        panda: {
            name: "Panda",
            asset: "panda",
            buyCost: 260,
            baseIncome: 4
        },
        lion: {
            name: "Lion",
            asset: "lion",
            buyCost: 900,
            baseIncome: 12
        },
        tiger: {
            name: "Tiger",
            asset: "tiger",
            buyCost: 2600,
            baseIncome: 30
        },
        elephant: {
            name: "Elephant",
            asset: "elephant",
            buyCost: 7500,
            baseIncome: 85
        },
        giraffe: {
            name: "Giraffe",
            asset: "giraffe",
            buyCost: 18000,
            baseIncome: 180
        },
        zebra: {
            name: "Zebra",
            asset: "zebra",
            buyCost: 42000,
            baseIncome: 420
        },
        hippo: {
            name: "Hippo",
            asset: "hippo",
            buyCost: 100000,
            baseIncome: 900
        },
        penguin: {
            name: "Penguin",
            asset: "penguin",
            buyCost: 230000,
            baseIncome: 1600
        },
        bear: {
            name: "Bear",
            asset: "bear",
            buyCost: 520000,
            baseIncome: 3200
        },
        crocodile: {
            name: "Crocodile",
            asset: "crocodile",
            buyCost: 1200000,
            baseIncome: 6000
        },
        kangaroo: {
            name: "Kangaroo",
            asset: "kangaroo",
            buyCost: 2600000,
            baseIncome: 12000
        },
        wolf: {
            name: "Wolf",
            asset: "wolf",
            buyCost: 6000000,
            baseIncome: 22000
        }
    },

    boxes: {
        common: {
            buyCoins: 150,
            buyGems: 0,
            coinMin: 80,
            coinMax: 260,
            gemsMin: 0,
            gemsMax: 1,
            rewardMax: 0
        },
        rare: {
            buyCoins: 0,
            buyGems: 3,
            coinMin: 500,
            coinMax: 1800,
            gemsMin: 1,
            gemsMax: 3,
            rewardMax: 0
        },
        epic: {
            buyCoins: 0,
            buyGems: 10,
            coinMin: 2500,
            coinMax: 9000,
            gemsMin: 2,
            gemsMax: 6,
            rewardMax: 0.25
        },
        legendary: {
            buyCoins: 0,
            buyGems: 25,
            coinMin: 10000,
            coinMax: 30000,
            gemsMin: 6,
            gemsMax: 14,
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
            name: "Click Upgrade I",
            desc: "+1 coin per click",
            price: 60,
            type: "click"
        },
        {
            id: "click2",
            name: "Click Upgrade II",
            desc: "+1 coin per click",
            price: 180,
            type: "click"
        },
        {
            id: "click3",
            name: "Strong Finger",
            desc: "+1 coin per click",
            price: 500,
            type: "click"
        },
        {
            id: "click4",
            name: "Turbo Tap",
            desc: "+1 coin per click",
            price: 1200,
            type: "click"
        },
        {
            id: "click5",
            name: "Diamond Claw",
            desc: "+1 coin per click",
            price: 3000,
            type: "click"
        },

        {
            id: "income1",
            name: "Zoo Manager",
            desc: "+25% zoo income",
            price: 900,
            type: "income"
        },
        {
            id: "income2",
            name: "VIP Caretaker",
            desc: "+25% zoo income",
            price: 2500,
            type: "income"
        },
        {
            id: "income3",
            name: "Automation Crew",
            desc: "+25% zoo income",
            price: 7000,
            type: "income"
        },
        {
            id: "income4",
            name: "Golden Feeding System",
            desc: "+25% zoo income",
            price: 18000,
            type: "income"
        },
        {
            id: "income5",
            name: "Elite Zoo Director",
            desc: "+25% zoo income",
            price: 45000,
            type: "income"
        },

        {
            id: "expedition1",
            name: "Better Expedition Gear",
            desc: "+20% expedition rewards",
            price: 1500,
            type: "expedition"
        },
        {
            id: "expedition2",
            name: "Rare Route Maps",
            desc: "+20% expedition rewards",
            price: 4500,
            type: "expedition"
        },
        {
            id: "expedition3",
            name: "Epic Explorer Team",
            desc: "+20% expedition rewards",
            price: 12000,
            type: "expedition"
        },

        {
            id: "offline1",
            name: "Offline Booster",
            desc: "x2 offline income",
            price: 2200,
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